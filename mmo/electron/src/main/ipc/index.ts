import { ipcMain } from 'electron'
import * as appIpc from './app'

export function setupIpcHandlers(): void {
  Object.values(appIpc).forEach((handler) => {
    if (typeof handler === 'function') {
      handler(ipcMain)
    }
  })
}
