import { IpcMain, dialog } from 'electron'

export function dialogModule(ipc: IpcMain): void {
  /**
   * Mở hộp thoại để người dùng chọn một file.
   */
  ipc.handle('dialog:select-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Videos', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (canceled) {
      return null
    }
    return filePaths[0]
  })

  /**
   * Mở hộp thoại để người dùng chọn một thư mục.
   */
  ipc.handle('dialog:select-directory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (canceled) {
      return null
    }
    return filePaths[0]
  })
}
