import { shell } from 'electron'

export function openExternal(ipc: Electron.IpcMain): void {
  ipc.on('open-external-app-deeplink', (_, { url }) => {
    void shell.openExternal(url)
  })
}
