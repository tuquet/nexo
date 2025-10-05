import { IpcMain } from 'electron'
import { getSetting, setSetting } from '../../lib/settings-manager'

export function settings(ipc: IpcMain): void {
  /**
   * Lấy một giá trị từ store.
   * Nếu là key nhạy cảm, nó sẽ được tự động giải mã.
   */
  ipc.handle('settings:get', (_, key: string) => {
    return getSetting(key)
  })

  /**
   * Thiết lập một giá trị trong store.
   * Nếu là key nhạy cảm, nó sẽ được tự động mã hóa.
   */
  ipc.on('settings:set', (_, { key, value }: { key: string; value: unknown }) => {
    setSetting(key, value)
  })
}
