import { app } from 'electron'

import { APP_NAME } from './constant'
import { getMainWindow } from './window'

export function setupProtocolHandlers(): void {
  app.setAsDefaultProtocolClient(APP_NAME)
}

export function handleProtocolUrl(url: string): void {
  const window = getMainWindow()
  if (window) {
    const parsedUrl = new URL(url)
    const queryParams = Object.fromEntries(parsedUrl.searchParams.entries())
    if (window.isMinimized()) window.restore()
    window.focus()
    window.webContents.send('oauth-singin-events', queryParams)
  }
}
