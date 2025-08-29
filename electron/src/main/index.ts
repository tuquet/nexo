import path from 'node:path'
import process from 'node:process'

import log from 'electron-log'

import { setupAppEvents } from './process/event'
import { setupIpc } from './process/ipc'
import { setupLogger } from './process/logger'
import { APP_PATH } from './process/path'
import { setupProtocol } from './process/protocol'
import AppUpdater from './process/updater'
import { setupMainWindow } from './process/window'

const DATABASE_PATH = path.join(APP_PATH, process.env.VITE_DATABASE_NAME || '')

// @ts-expect-error - Fixing the issue with the env variable
process.env = { ...process.env, ...import.meta.env }
process.env.VITE_DATABASE_NAME = DATABASE_PATH

const updater = new AppUpdater()

void (async () => {
  try {
    await setupLogger()

    await setupAppEvents()

    await setupProtocol()

    await setupMainWindow()

    await setupIpc()

    await updater.checkForUpdates()
  } catch (error) {
    log.error('Failed to setup application:', error)
    process.exit(1)
  }
})()
