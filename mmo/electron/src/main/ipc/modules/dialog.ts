import { dialog, IpcMain } from 'electron'

export function openDialog(ipc: IpcMain): void {
  // Mở hộp thoại chọn file
  ipc.handle('dialog:openFile', async () => {
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

  // Mở hộp thoại chọn thư mục
  ipc.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (canceled) {
      return null
    }
    return filePaths[0]
  })
}
