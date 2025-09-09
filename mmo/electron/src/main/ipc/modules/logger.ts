import type { IpcMain } from 'electron'
import log, { type LogMessage, type Transport } from 'electron-log'
import { getMainWindow } from '../../process/window'

/**
 * Định dạng dữ liệu log thành một chuỗi duy nhất.
 */
function formatLogData(data: any[]): string {
  return data
    .map((item) => {
      if (typeof item === 'object' && item !== null) {
        try {
          // Chuyển đổi object thành chuỗi JSON để dễ đọc
          return JSON.stringify(item, null, 2)
        } catch {
          return item.toString()
        }
      }
      return String(item)
    })
    .join(' ')
}

/**
 * Cấu hình electron-log để gửi log đến tiến trình Renderer.
 * Hàm này được gọi một lần khi các IPC handler được thiết lập.
 */
function configureRendererTransport(): void {
  // Transport tùy chỉnh để gửi log đến tiến trình renderer
  const rendererTransport: any | Transport = (msg: LogMessage) => {
    const mainWindow = getMainWindow()
    // Chỉ gửi khi cửa sổ chính tồn tại và chưa bị hủy
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app-log', {
        level: msg.level,
        message: formatLogData(msg.data),
        date: msg.date
      })
    }
  }

  // Gán transport tùy chỉnh. Mọi log (info, warn, error, v.v.) sẽ được xử lý bởi transport này,
  // song song với các transport mặc định (ghi ra file, console).
  log.transports.renderer = rendererTransport

  log.info('Logger transport to renderer has been configured.')
}

let isTransportConfigured = false

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function logger(_ipc: IpcMain): void {
  if (!isTransportConfigured) {
    configureRendererTransport()
    isTransportConfigured = true
  }
}
