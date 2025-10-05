import { IpcMain, shell } from 'electron'
import log from 'electron-log'

export function shellModule(ipc: IpcMain): void {
  /**
   * Mở một đường dẫn (file hoặc thư mục) trong trình quản lý file của hệ thống.
   * Nếu là file, nó sẽ được chọn.
   */
  ipc.on('shell:open-path', (_, path: string) => {
    log.info(`[Shell] Opening path: ${path}`)
    // shell.openPath trả về một promise với thông báo lỗi nếu thất bại
    shell.openPath(path).catch((err) => {
      log.error(`[Shell] Failed to open path ${path}:`, err)
    })
  })

  /**
   * Mở một URL trong trình duyệt mặc định của hệ thống.
   */
  ipc.on('shell:open-external', (_, url: string) => {
    log.info(`[Shell] Opening external URL: ${url}`)
    shell.openExternal(url).catch((err) => {
      log.error(`[Shell] Failed to open external URL ${url}:`, err)
    })
  })

  /**
   * Hiển thị một file trong trình quản lý file của hệ thống.
   */
  ipc.on('shell:show-item-in-folder', (_, fullPath: string) => {
    log.info(`[Shell] Showing item in folder: ${fullPath}`)
    shell.showItemInFolder(fullPath)
  })
}
