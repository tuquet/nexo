import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import log from 'electron-log'
import { getMainWindow } from '../bootstrap/window'
import { createRequire } from 'node:module'
import { is } from '@electron-toolkit/utils'

// Use customRequire for CJS module with tricky exports to ensure it loads correctly.
const customRequire = createRequire(import.meta.url)
const ffbinaries = customRequire('ffbinaries')
if (is.dev) {
  ffbinaries.clearCache()
}

const BINARIES = ['ffmpeg', 'ffprobe'] as const
type BinaryName = (typeof BINARIES)[number]

// Ensure a clean, consistent path for both development and production.
const productName = 'Catalyst'
const userDataPath = app.getPath('userData')
const finalUserDataPath = userDataPath.includes(productName)
  ? userDataPath
  : path.join(app.getPath('appData'), productName)

const binariesPath = path.join(finalUserDataPath, 'binaries')

// Lưu trữ đường dẫn trong bộ nhớ để tránh kiểm tra lại file hệ thống
const binaryPaths: Partial<Record<BinaryName, string>> = {}

const MANIFEST_FILENAME = 'manifest.json'
const manifestPath = path.join(binariesPath, MANIFEST_FILENAME)
interface IBinaryManifest {
  version: string
}

/**
 * Lấy tên file tương ứng với hệ điều hành.
 * @param binaryName Tên của công cụ (ví dụ: 'ffmpeg').
 * @returns Tên file đầy đủ (ví dụ: 'ffmpeg.exe' trên Windows).
 */
function getBinaryFilename(binaryName: BinaryName): string {
  return process.platform === 'win32' ? `${binaryName}.exe` : binaryName
}

/**
 * Kiểm tra xem tất cả các công cụ cần thiết có tồn tại và có thể thực thi không.
 * @returns Promise trả về true nếu có, false nếu không.
 */
async function checkBinariesExist(): Promise<boolean> {
  try {
    await fs.mkdir(binariesPath, { recursive: true })
    for (const name of BINARIES) {
      const filePath = path.join(binariesPath, getBinaryFilename(name))
      await fs.access(filePath, fs.constants.X_OK) // Kiểm tra quyền thực thi
      binaryPaths[name] = filePath // Lưu đường dẫn vào cache
    }
    log.debug('[BinaryManager] Tất cả công cụ đã được tìm thấy và có thể thực thi.' + binariesPath)
    return true
  } catch {
    log.warn('[BinaryManager] Một hoặc nhiều công cụ bị thiếu hoặc không thể thực thi.')
    return false
  }
}

/**
 * Promisified wrapper for ffbinaries.listVersions to get the latest version.
 */
function getLatestFfbinariesVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    ffbinaries.listVersions((err: Error | null, versions: string[]) => {
      if (err) {
        log.error('[BinaryManager] Failed to get versions from ffbinaries.', err)
        return reject(err)
      }
      if (versions && versions.length > 0) {
        // The first version in the array is the latest
        resolve(versions[0])
      } else {
        reject(new Error('No versions found by ffbinaries.'))
      }
    })
  })
}

/**
 * Tải các công cụ cần thiết ('ffmpeg', 'ffprobe') bằng ffbinaries.
 * Gửi tiến trình về cho tiến trình renderer.
 */
async function downloadBinaries(versionToDownload: string): Promise<void> {
  const mainWindow = getMainWindow()
  mainWindow?.webContents.send('binary-manager:status', {
    status: 'downloading',
    key: 'page.binaryManager.status.downloading'
  })

  return new Promise((resolve, reject) => {
    ffbinaries.downloadFiles(
      BINARIES,
      {
        destination: binariesPath,
        version: versionToDownload,
        tickerFn: (progress) => {
          const percent = Math.round(progress.progress * 100)
          log.info(`[BinaryManager] Đang tải: ${percent}% của ${progress.filename}`)
          mainWindow?.webContents.send('binary-manager:status', {
            status: 'downloading',
            key: 'page.binaryManager.status.downloadingFile',
            args: { file: progress.filename },
            percent
          })
        }
      },
      async (err) => {
        if (err) {
          log.error('[BinaryManager] Tải công cụ thất bại:', err)
          mainWindow?.webContents.send('binary-manager:status', {
            status: 'error',
            key: 'page.binaryManager.status.error'
          })
          return reject(new Error('Tải công cụ thất bại.'))
        }

        // Sau khi tải xong, ghi lại phiên bản vào manifest
        try {
          const manifest: IBinaryManifest = { version: versionToDownload }
          await fs.mkdir(binariesPath, { recursive: true })
          await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
          log.info(`[BinaryManager] Đã ghi manifest thành công cho phiên bản ${versionToDownload}.`)
          resolve()
        } catch (manifestError) {
          log.error('[BinaryManager] Không thể ghi manifest phiên bản sau khi tải.', manifestError)
          // Vẫn resolve để ứng dụng hoạt động, lần sau sẽ tải lại.
          resolve()
        }
      }
    )
  })
}

/**
 * Đảm bảo ffmpeg và ffprobe có sẵn, tải chúng nếu cần.
 * @returns Promise trả về một object chứa đường dẫn đến các công cụ.
 */
export async function ensureBinaries(): Promise<Record<BinaryName, string>> {
  let shouldDownload = false
  const filesExist = await checkBinariesExist()
  let latestVersion: string | null = null

  if (!filesExist) {
    shouldDownload = true
    log.info('[BinaryManager] Không tìm thấy công cụ. Bắt đầu tải.')
  } else {
    // File tồn tại, kiểm tra phiên bản
    try {
      latestVersion = await getLatestFfbinariesVersion()
      const manifestContent = await fs.readFile(manifestPath, 'utf-8')
      const manifest: IBinaryManifest = JSON.parse(manifestContent)

      if (manifest.version !== latestVersion) {
        log.info(
          `[BinaryManager] Phiên bản đã cũ (Local: ${manifest.version}, Latest: ${latestVersion}). Bắt đầu cập nhật.`
        )
        shouldDownload = true
        // Dọn dẹp các file cũ trước khi tải
        await fs.rm(binariesPath, { recursive: true, force: true })
      } else {
        log.debug(
          `[BinaryManager] Các công cụ đã ở phiên bản mới nhất (Version: ${latestVersion}).`
        )
      }
    } catch (error) {
      // Manifest bị thiếu hoặc lỗi, tải lại để đảm bảo an toàn
      log.warn('[BinaryManager] Không thể đọc manifest phiên bản. Bắt đầu tải lại.', error)
      shouldDownload = true
      await fs.rm(binariesPath, { recursive: true, force: true })
    }
  }

  if (shouldDownload) {
    // If we don't have the latest version yet (e.g., because files didn't exist), get it now.
    if (!latestVersion) {
      try {
        latestVersion = await getLatestFfbinariesVersion()
      } catch (error: any) {
        throw new Error(`Could not determine which version to download: ${error.message}`)
      }
    }

    await downloadBinaries(latestVersion)
    const finalCheck = await checkBinariesExist()
    if (!finalCheck) {
      throw new Error('Không tìm thấy công cụ ngay cả sau khi đã thử tải.')
    }
  }
  return binaryPaths as Record<BinaryName, string>
}
