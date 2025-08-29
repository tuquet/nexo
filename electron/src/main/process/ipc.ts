import { ipcMain, shell } from 'electron'

import { APP_PATH } from './path'

export function setupIpc(): void {
  ipcMain.on('open-oauth-app-deeplink', (_, { url }) => {
    void shell.openExternal(url)
  })

  ipcMain.on('view-data-folder', () => {
    void shell.openPath(APP_PATH)
  })
}
