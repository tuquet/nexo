import path from 'node:path'
import process from 'node:process'

import log from 'electron-log'
import { app } from 'electron'
import { setupAppEvents } from './process/event'
import { setupLogger } from './process/logger'
import { APP_PATH } from './process/path'
import { setupProtocol } from './process/protocol'
import AppUpdater from './process/updater'
import { setupMainWindow } from './process/window'
import { setupIpcHandlers } from './ipc'
import { startMockServer, stopMockServer } from './process/mock-server'

const DATABASE_PATH = path.join(APP_PATH, process.env.VITE_DATABASE_NAME || '')

// @ts-expect-error - Fixing the issue with the env variable
process.env = { ...process.env, ...import.meta.env }
process.env.VITE_DATABASE_NAME = DATABASE_PATH

const updater = new AppUpdater()

void (async () => {
  try {
    if (!process.env.VITE_DATABASE_NAME) {
      log.warn('VITE_DATABASE_NAME is not set.  Application may not work as expected.')
    }

    await setupLogger()

    await startMockServer()

    await setupAppEvents()

    await setupProtocol()

    await setupMainWindow()

    await setupIpcHandlers()

    await updater.checkForUpdates()
  } catch (error) {
    log.error('Failed to setup application:', error)
    // Consider a more graceful exit in production
    process.exit(1)
  }
})()

app.on('will-quit', () => {
  stopMockServer()
})
