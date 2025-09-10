import { BrowserWindow, IpcMain, safeStorage } from 'electron'
import log from 'electron-log'
import { store } from '../../bootstrap/store'

/**
 * Kiểm tra xem một key có phải là key nhạy cảm cần được mã hóa hay không.
 * @param key - Tên của key cài đặt.
 * @returns `true` nếu key cần được mã hóa.
 */
function isSensitiveKey(key: string): boolean {
  return key.startsWith('userApiKeys.')
}

// Kiểm tra xem hệ điều hành có hỗ trợ mã hóa không.
const isEncryptionAvailable = safeStorage.isEncryptionAvailable()
if (!isEncryptionAvailable) {
  log.warn(
    '[Settings] Mã hóa không khả dụng trên hệ thống này. Dữ liệu nhạy cảm sẽ được lưu dưới dạng văn bản thuần túy.'
  )
}

export function settings(ipc: IpcMain): void {
  /**
   * Lấy một giá trị từ store.
   * Nếu là key nhạy cảm, nó sẽ được tự động giải mã.
   */
  ipc.handle('settings:get', (_, key: string) => {
    const storedValue = store.get(key as any)

    if (
      isEncryptionAvailable &&
      isSensitiveKey(key) &&
      typeof storedValue === 'string' &&
      storedValue
    ) {
      try {
        // Chuyển đổi từ base64 về Buffer và giải mã
        const encryptedBuffer = Buffer.from(storedValue, 'base64')
        return safeStorage.decryptString(encryptedBuffer)
      } catch (error) {
        log.error(`[Settings] Không thể giải mã key "${key}". Trả về giá trị rỗng.`, error)
        return '' // Trả về rỗng nếu giải mã thất bại để tránh lỗi ứng dụng
      }
    }

    return storedValue
  })

  /**
   * Thiết lập một giá trị trong store.
   * Nếu là key nhạy cảm, nó sẽ được tự động mã hóa.
   */
  ipc.on('settings:set', (_, { key, value }: { key: string; value: unknown }) => {
    let finalValue = value
    if (isEncryptionAvailable && isSensitiveKey(key) && typeof value === 'string' && value) {
      try {
        // Mã hóa giá trị và chuyển đổi thành chuỗi base64 để lưu trữ
        const encryptedBuffer = safeStorage.encryptString(value)
        finalValue = encryptedBuffer.toString('base64')
      } catch (error) {
        log.error(`[Settings] Không thể mã hóa key "${key}". Giá trị không được lưu.`, error)
        return // Dừng lại nếu không mã hóa được
      }
    }

    // Lưu giá trị (đã mã hóa nếu cần) vào store
    store.set(key as any, finalValue)

    // Phát một sự kiện đến tất cả các cửa sổ renderer để thông báo rằng một cài đặt đã thay đổi.
    // Chúng ta chỉ gửi `key` để tránh phát tán dữ liệu nhạy cảm.
    // Các cửa sổ sẽ tự gọi `settings:get` để lấy giá trị mới đã được giải mã.
    for (const window of BrowserWindow.getAllWindows()) {
      window.webContents.send('settings:key-updated', key)
    }
  })
}
