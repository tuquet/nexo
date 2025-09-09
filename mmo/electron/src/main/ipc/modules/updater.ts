import type { UpdateInfo } from 'electron-updater'

import { IpcMain } from 'electron'
import log from 'electron-log'
import pkg from 'electron-updater'
import { getMainWindow } from '../../process/window'
const { autoUpdater } = pkg

// Vô hiệu hóa việc tự động tải xuống. Chúng ta muốn người dùng có quyền lựa chọn.
autoUpdater.autoDownload = false

export function updater(ipc: IpcMain): void {
  // Chuyển tiếp các sự kiện của autoUpdater đến tiến trình renderer
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    log.info('[Updater] Update available:', info)
    getMainWindow()?.webContents.send('updater:update-available', info)
  })

  autoUpdater.on('download-progress', (progressInfo) => {
    log.info(`[Updater] Download progress: ${progressInfo.percent.toFixed(2)}%`)
    getMainWindow()?.webContents.send('updater:download-progress', progressInfo)
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    log.info('[Updater] Update downloaded:', info)
    getMainWindow()?.webContents.send('updater:update-downloaded', info)
  })

  autoUpdater.on('error', (error) => {
    log.error('[Updater] Error:', error)
    getMainWindow()?.webContents.send('updater:error', error.message)
  })

  // Xử lý các lệnh từ tiến trình renderer
  ipc.handle('updater:check-for-updates', () => {
    log.info('[Updater] Renderer requested to check for updates.')
    return autoUpdater.checkForUpdates()
  })

  ipc.on('updater:start-download', () => {
    log.info('[Updater] Renderer requested to start download.')
    autoUpdater.downloadUpdate().catch((error) => {
      log.error('[Updater] Download failed:', error)
    })
  })

  ipc.on('updater:quit-and-install', () => {
    log.info('[Updater] Renderer requested to quit and install.')
    autoUpdater.quitAndInstall()
  })
}
