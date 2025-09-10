import Store from 'electron-store'

/**
 * Định nghĩa Schema (lược đồ) cho dữ liệu bạn muốn lưu trữ.
 * Việc này cung cấp type-safety và tự động hoàn thành code.
 */
interface StorageSchema {
  userApiKeys: {
    openAI?: string
    google?: string
    gemini?: string
  }
  // Thêm các cài đặt khác ở đây, ví dụ:
  // windowBounds: { width: number; height: number; x: number; y: number };
}

/**
 * Khởi tạo một instance duy nhất của Store với schema đã định nghĩa.
 * Instance này sẽ được sử dụng trên toàn bộ tiến trình Main.
 */
export const store = new Store<StorageSchema>({
  // Bạn có thể cung cấp các giá trị mặc định ở đây
  defaults: {
    userApiKeys: {}
  }
})
