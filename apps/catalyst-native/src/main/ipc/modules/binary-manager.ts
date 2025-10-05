import { IpcMain } from 'electron'
import { ensureBinaries } from '../../lib/binary-manager'
import { ensureYtDlp } from '../../lib/yt-dlp-manager'
import { getMainWindow } from '../../bootstrap/window'

// Ánh xạ các key công cụ tới nhóm hoặc nguồn tải của chúng.
// Cấu trúc này giúp dễ dàng mở rộng trong tương lai (ví dụ: thêm yt-dlp từ nguồn khác).
const KNOWN_BINARY_GROUPS: Record<string, string[]> = {
  ffbinaries: ['ffmpeg', 'ffprobe'],
  ytdlp: ['yt-dlp']
}

export function binaryManager(ipc: IpcMain): void {
  /**
   * Đảm bảo các công cụ được yêu cầu đã sẵn sàng.
   * @param _event
   * @param requiredKeys Mảng các key của công cụ cần thiết (ví dụ: ['ffmpeg', 'ffprobe']).
   */
  ipc.handle('binary-manager:ensure', async (_, requiredKeys: string[] = []) => {
    if (requiredKeys.length === 0) {
      return
    }

    const mainWindow = getMainWindow()
    mainWindow?.webContents.send('binary-manager:status', {
      status: 'verifying',
      key: 'page.binaryManager.status.verifying'
    })

    try {
      const needsFfbinaries = requiredKeys.some((key) =>
        KNOWN_BINARY_GROUPS.ffbinaries.includes(key)
      )
      const needsYtDlp = requiredKeys.some((key) => KNOWN_BINARY_GROUPS.ytdlp.includes(key))

      const downloadTasks: Promise<any>[] = []

      if (needsFfbinaries) {
        downloadTasks.push(ensureBinaries())
      }

      if (needsYtDlp) {
        downloadTasks.push(ensureYtDlp())
      }

      await Promise.all(downloadTasks)

      mainWindow?.webContents.send('binary-manager:status', {
        status: 'complete',
        key: 'page.binaryManager.status.complete'
      })
    } catch (error) {
      // Các hàm ensure... riêng lẻ sẽ gửi lỗi cụ thể của chúng. Đây là phương án dự phòng.
      mainWindow?.webContents.send('binary-manager:status', {
        status: 'error',
        key: 'page.binaryManager.status.error'
      })
      throw error // Ném lại lỗi để renderer biết rằng lời gọi đã thất bại.
    }
  })
}
