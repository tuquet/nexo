import { Buffer } from 'node:buffer';
import path from 'node:path';
import process from 'node:process';

import axios from 'axios';
import { app } from 'electron';
import log from 'electron-log';
import fs from 'fs-extra';

import { getMainWindow } from '../bootstrap/window';

// Giả định rằng bạn có một hàm getMainWindow() để lấy cửa sổ chính
// như được mô tả trong kiến trúc tại README.md

const productName = 'Catalyst';
const userDataPath = app.getPath('userData');
const finalUserDataPath = userDataPath.includes(productName)
  ? userDataPath
  : path.join(app.getPath('appData'), productName);

const binariesDir = path.join(finalUserDataPath, 'binaries');
const ytDlpName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
const ytDlpPath = path.join(binariesDir, ytDlpName);

/**
 * Gửi trạng thái về cho tiến trình renderer
 */
function sendStatus(
  status: 'complete' | 'downloading' | 'error' | 'verifying',
  key: string,
  args: Record<string, any> = {},
  percent?: number,
) {
  const mainWindow = getMainWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('binary-manager:status', {
      status,
      key,
      args,
      percent,
    });
  }
}

/**
 * Tải file yt-dlp từ URL và báo cáo tiến trình.
 */
async function downloadYtDlp(downloadUrl: string) {
  await fs.ensureDir(binariesDir);
  const writer = fs.createWriteStream(ytDlpPath);

  sendStatus('downloading', 'page.binaryManager.status.downloadingFile', {
    file: ytDlpName,
  });

  const response = await axios({
    url: downloadUrl,
    method: 'GET',
    responseType: 'stream',
  });

  const totalLength = Number.parseInt(
    response.headers['content-length'] || '0',
    10,
  );
  let downloadedLength = 0;

  response.data.on('data', (chunk: Buffer) => {
    downloadedLength += chunk.length;
    const percent = Math.floor((downloadedLength / totalLength) * 100);
    sendStatus(
      'downloading',
      'page.binaryManager.status.downloadingFile',
      { file: ytDlpName },
      percent,
    );
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      // Trên macOS/Linux, cần cấp quyền thực thi cho file
      if (process.platform !== 'win32') {
        fs.chmodSync(ytDlpPath, '755');
      }
      resolve(ytDlpPath);
    });
    writer.on('error', reject);
  });
}

/**
 * Đảm bảo công cụ yt-dlp đã sẵn sàng để sử dụng.
 */
export async function ensureYtDlp(): Promise<string> {
  if (await fs.pathExists(ytDlpPath)) {
    log.debug(`[YtDlpManager] yt-dlp binary already exists at: ${ytDlpPath}`);
    return ytDlpPath;
  }

  try {
    const releaseUrl =
      'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest';
    const { data: releaseInfo } = await axios.get(releaseUrl);
    const asset = releaseInfo.assets.find((a: any) => a.name === ytDlpName);

    if (!asset)
      throw new Error(`Không tìm thấy file ${ytDlpName} cho nền tảng của bạn.`);

    await downloadYtDlp(asset.browser_download_url);
    return ytDlpPath;
  } catch (error) {
    sendStatus('error', 'page.binaryManager.status.error');
    throw error; // Ném lỗi để Promise.all trong IPC handler có thể bắt được
  }
}
