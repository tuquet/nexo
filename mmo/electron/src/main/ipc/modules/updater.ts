import type { UpdateInfo } from 'electron-updater'

import { IpcMain } from 'electron'
import { is } from '@electron-toolkit/utils'
import log from 'electron-log'
import pkg from 'electron-updater'

import { getMainWindow } from '../../process/window'

const { autoUpdater } = pkg

// Vô hiệu hóa việc tự động tải xuống. Chúng ta muốn người dùng có quyền lựa chọn.
autoUpdater.autoDownload = false

// Nếu đang trong môi trường dev, buộc updater phải kiểm tra.
// Điều này cho phép thử nghiệm luồng cập nhật thực với GitHub trong quá trình phát triển.
if (is.dev) {
  autoUpdater.forceDevUpdateConfig = true
}

// Cờ để bật chế độ giả lập cập nhật trong môi trường dev.
// Hữu ích để debug giao diện cập nhật mà không cần kết nối mạng hoặc release thật.
// Đặt thành `false` nếu bạn muốn kiểm tra với GitHub release thật trong môi trường dev.
const FAKE_UPDATE_IN_DEV = false

export function updater(ipc: IpcMain): void {
  // Chuyển tiếp các sự kiện của autoUpdater đến tiến trình renderer
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    log.info('[Updater] Update available')
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
    log.info('[Updater] IPC: check-for-updates')

    // Nếu cờ giả lập được bật trong môi trường dev, ưu tiên chạy giả lập.
    if (is.dev && FAKE_UPDATE_IN_DEV) {
      log.warn('[Updater] FAKE MODE: Simulating update check.')
      // Giả lập việc tìm thấy bản cập nhật sau 2 giây
      setTimeout(() => {
        log.warn('[Updater] FAKE MODE: Sending update-available event.')
        getMainWindow()?.webContents.send('updater:update-available', {
          version: '99.9.9-fake',
          releaseName: 'The Fake Update',
          releaseNotes: 'This is a simulated update for development purposes.',
          releaseDate: new Date().toISOString()
        })
      }, 2000)
      return Promise.resolve() // Trả về một promise đã giải quyết
    }

    // Ngược lại, thực hiện kiểm tra cập nhật thật.
    // Nhờ `forceDevUpdateConfig`, nó sẽ hoạt động trong môi trường dev.
    return autoUpdater.checkForUpdates().catch((error) => {
      log.error('[Updater] Check for updates failed:', error)
      throw error
    })
  })

  ipc.on('updater:start-download', () => {
    log.info('[Updater] IPC: start-download')

    if (is.dev && FAKE_UPDATE_IN_DEV) {
      log.warn('[Updater] FAKE MODE: Simulating download.')
      let percent = 0
      const interval = setInterval(() => {
        percent += Math.random() * 20
        if (percent >= 100) {
          clearInterval(interval)
          log.warn('[Updater] FAKE MODE: Sending update-downloaded event.')
          getMainWindow()?.webContents.send('updater:update-downloaded', {
            version: '99.9.9-fake'
          })
        } else {
          getMainWindow()?.webContents.send('updater:download-progress', { percent })
        }
      }, 500)
      return // Kết thúc hàm
    }

    autoUpdater.downloadUpdate().catch((error) => log.error('[Updater] Download failed:', error))
  })

  ipc.on('updater:quit-and-install', () => {
    log.info('[Updater] IPC: quit-and-install')

    if (is.dev && FAKE_UPDATE_IN_DEV) {
      log.warn('[Updater] FAKE MODE: quitAndInstall called. In a real app, it would restart.')
      return // Kết thúc hàm
    }

    autoUpdater.quitAndInstall()
  })
}
