import { is } from '@electron-toolkit/utils'

/**
 * Định nghĩa cấu trúc cho đối tượng cấu hình ứng dụng.
 * Việc này giúp đảm bảo type-safety và gợi ý code tốt hơn.
 */
interface AppConfig {
  github: {
    owner: string
    repo: string
  }
  isDevelopment: boolean
  // Thêm các cấu hình khác cho ứng dụng của bạn ở đây
}

/**
 * Đối tượng cấu hình trung tâm cho toàn bộ ứng dụng.
 * Nó đọc các giá trị từ môi trường và cung cấp một nguồn chân lý duy nhất.
 */
export const config: AppConfig = {
  isDevelopment: is.dev,
  github: {
    owner: 'tuquet',
    repo: 'catalyst'
  }
}
