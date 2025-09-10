import { shell } from 'electron'
import { APP_PATH } from '../../bootstrap/path'

export function openPath(ipc: Electron.IpcMain): void {
  ipc.on('open-path-app-data', () => {
    void shell.openPath(APP_PATH)
  })
}
