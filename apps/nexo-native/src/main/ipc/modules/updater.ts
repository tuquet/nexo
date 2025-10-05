import type { UpdateInfo } from 'electron-updater';

import fs from 'node:fs/promises';

import { is } from '@electron-toolkit/utils';
import { IpcMain } from 'electron';
import log from 'electron-log';
import pkg from 'electron-updater';

import { getMainWindow } from '../../bootstrap/window';

const { autoUpdater } = pkg;

autoUpdater.autoDownload = false;

if (is.dev) {
  autoUpdater.forceDevUpdateConfig = true;
}

export function updater(ipc: IpcMain): void {
  /**
   * Hướng dẫn kiểm tra tính năng tự động cập nhật trong môi trường phát triển:
   *
   * 1. **Publish một phiên bản:**
   *    - Đảm bảo bạn đã có một phiên bản được publish trên GitHub Releases (ví dụ: v1.0.0).
   *
   * 2. **"Giả mạo" phiên bản hiện tại:**
   *    - Mở file `package.json` ở thư mục gốc của dự án.
   *    - Thay đổi giá trị của trường `version` thành một phiên bản thấp hơn (ví dụ: "0.9.0").
   *
   * 3. **Chạy ứng dụng và kiểm tra:**
   *    - Chạy ứng dụng ở chế độ development (`pnpm dev:mmo`) và kích hoạt chức năng kiểm tra cập nhật.
   *    - Dialog thông báo có phiên bản mới sẽ được hiển thị vì `forceDevUpdateConfig` được bật.
   */
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    log.debug('[Updater] Update available');
    getMainWindow()?.webContents.send('updater:update-available', info);
  });

  autoUpdater.on('download-progress', (progressInfo) => {
    log.debug(
      `[Updater] Download progress: ${progressInfo.percent.toFixed(2)}%`,
    );
    getMainWindow()?.webContents.send(
      'updater:download-progress',
      progressInfo,
    );
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    log.debug('[Updater] Update downloaded:', info);
    getMainWindow()?.webContents.send('updater:update-downloaded', info);
  });

  autoUpdater.on('error', (error) => {
    log.error('[Updater] Error:', error);
    getMainWindow()?.webContents.send('updater:error', error.message);
  });

  ipc.handle('updater:check-for-updates', () => {
    return autoUpdater.checkForUpdates().catch((error) => {
      log.error('[Updater] Check for updates failed:', error);
      throw error;
    });
  });

  ipc.on('updater:start-download', () => {
    log.debug('[Updater] start-download');

    autoUpdater
      .downloadUpdate()
      .catch((error) => log.error('[Updater] Download failed:', error));
  });

  ipc.on('updater:quit-and-install', () => {
    log.debug('[Updater] quit-and-install');
    autoUpdater.quitAndInstall();
  });

  ipc.on('updater:clear-cache', async () => {
    log.info('[Updater] Received request to clear updater cache.');
    let cacheDir: string | undefined;

    try {
      // This is an internal method, but it's the most reliable way to get the helper.
      // It ensures we get the same cache directory that the updater itself uses.
      const downloadedUpdateHelper = await (
        autoUpdater as any
      ).getOrCreateDownloadHelper();
      cacheDir = downloadedUpdateHelper.cacheDir;
    } catch (error) {
      log.error('[Updater] Could not get downloadedUpdateHelper:', error);
    }

    if (!cacheDir) {
      log.error(
        '[Updater] Cache directory path is not available. Cannot clear cache.',
      );
      return;
    }

    try {
      log.info(`[Updater] Attempting to delete cache directory: ${cacheDir}`);
      await fs.rm(cacheDir, { recursive: true, force: true });
      log.info(
        '[Updater] Cache directory cleared successfully (or it did not exist).',
      );
    } catch (error) {
      log.error(
        '[Updater] An unexpected error occurred while clearing the updater cache:',
        error,
      );
    }
  });
}
