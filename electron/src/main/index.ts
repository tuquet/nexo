import path from 'node:path'
import process from 'node:process'

import log from 'electron-log'

import { setupAppEvents } from './process/event'
import { registerIpcHandlers } from './process/ipc'
import { setupLogger } from './process/logger'
import { APP_PATH } from './process/path'
import { setupProtocolHandlers } from './process/protocol'
import AppUpdater from './process/updater'
import { createMainWindow } from './process/window'

// @ts-expect-error - Fixing the issue with the env variable
process.env = { ...process.env, ...import.meta.env }
process.env.VITE_DATABASE_NAME =
  process.env.VITE_DATABASE_NAME && path.join(APP_PATH, process.env.VITE_DATABASE_NAME)

const updater = new AppUpdater()

void (async () => {
  try {
    await setupLogger()

    await setupAppEvents()

    await setupProtocolHandlers()

    await createMainWindow()

    await registerIpcHandlers()

    await updater.checkForUpdates()
  } catch (error) {
    log.error('Failed to setup application:', error)
    process.exit(1)
  }
})()
