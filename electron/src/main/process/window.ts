import * as http from 'node:http'
import path from 'node:path'

import { is } from '@electron-toolkit/utils'
import { BrowserWindow, shell } from 'electron'
import log from 'electron-log'

import icon from '../../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export async function createMainWindow(): Promise<BrowserWindow> {
  mainWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
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

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    await waitForServerUp(process.env.ELECTRON_RENDERER_URL)
    await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html')).catch((error) => {
      log.error('Failed to load file:', error)
    })
  }

  return mainWindow
}

const isHostUp = (url: string) =>
  new Promise((resolve) => http.get(url, () => resolve(true)).on('error', () => resolve(false)))

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function waitForServerUp(url: string) {
  console.log(`Waiting for server navigo-frontend to be up at ${url}`)
  while (true) {
    const isUp = await isHostUp(url)
    if (isUp) break
    await wait(1000)
  }
}
