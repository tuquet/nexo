import { BrowserWindow, safeStorage } from 'electron'
import log from 'electron-log'
import { store } from '../bootstrap/store'

function isSensitiveKey(key: string): boolean {
  return key.startsWith('userApiKeys.')
}

/**
 * Lấy một giá trị từ store, tự động giải mã nếu cần.
 * @param key - Key của cài đặt, hỗ trợ dot-notation.
 * @returns Giá trị đã được giải mã hoặc giá trị gốc.
 */
export function getSetting(key: string): unknown {
  const storedValue = store.get(key as any)

  if (
    safeStorage.isEncryptionAvailable() &&
    isSensitiveKey(key) &&
    typeof storedValue === 'string' &&
    storedValue
  ) {
    try {
      const encryptedBuffer = Buffer.from(storedValue, 'base64')
      return safeStorage.decryptString(encryptedBuffer)
    } catch (error) {
      log.error(`[SettingsManager] Không thể giải mã key "${key}". Trả về giá trị rỗng.`, error)
      return ''
    }
  }

  return storedValue
}

/**
 * Lấy và giải mã API key của OpenAI từ store.
 * @returns API key hoặc chuỗi rỗng nếu không có.
 */
export function getOpenAiApiKey(): string {
  return (getSetting('userApiKeys.openAI') as string) || ''
}

/**
 * Lấy và giải mã API key của Gemini từ store.
 * @returns API key hoặc chuỗi rỗng nếu không có.
 */
export function getGeminiApiKey(): string {
  return (getSetting('userApiKeys.gemini') as string) || ''
}

/**
 * Lưu một giá trị vào store, tự động mã hóa nếu cần.
 * @param key - Key của cài đặt, hỗ trợ dot-notation.
 * @param value - Giá trị cần lưu.
 */
export function setSetting(key: string, value: unknown): void {
  const isEncryptionAvailable = safeStorage.isEncryptionAvailable()
  let finalValue = value

  if (isEncryptionAvailable && isSensitiveKey(key) && typeof value === 'string' && value) {
    try {
      const encryptedBuffer = safeStorage.encryptString(value)
      finalValue = encryptedBuffer.toString('base64')
    } catch (error) {
      log.error(`[SettingsManager] Không thể mã hóa key "${key}". Giá trị không được lưu.`, error)
      return
    }
  }

  store.set(key as any, finalValue)

  // Phát một sự kiện đến tất cả các cửa sổ renderer để thông báo rằng một cài đặt đã thay đổi.
  // Chúng ta chỉ gửi `key` để tránh phát tán dữ liệu nhạy cảm.
  // Các cửa sổ sẽ tự gọi `settings:get` để lấy giá trị mới đã được giải mã.
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('settings:key-updated', key)
  }
}
