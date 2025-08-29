import { fileURLToPath } from 'url'
import { is } from '@electron-toolkit/utils'
import { BrowserWindow, shell } from 'electron'
import log from 'electron-log'

import icon from '../../../resources/icon.png?asset'
import { createWindow, waitForServerUp } from '../helpers'
import { APP_DEV_RENDERER_URL } from './constant'

let mainWindow: BrowserWindow | null = null

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export async function setupMainWindow(): Promise<BrowserWindow> {
  mainWindow = createWindow('main', {
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: fileURLToPath(new URL('../preload/index.mjs', import.meta.url)),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    if (process.env.VITE_NODE_ENV === 'development') {
      mainWindow?.webContents.openDevTools()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // process.env.ELECTRON_RENDERER_URL
  if (is.dev && APP_DEV_RENDERER_URL) {
    await waitForServerUp(APP_DEV_RENDERER_URL)
    await mainWindow.loadURL(APP_DEV_RENDERER_URL)
  } else {
    mainWindow
      .loadFile(fileURLToPath(new URL('../renderer/index.html', import.meta.url)))
      .catch((error) => {
        log.error('Failed to load file:', error)
      })
  }

  return mainWindow
}
