import path from 'node:path'

import { app } from 'electron'
import log from 'electron-log'

const LOG_FILE_NAME = 'main.log'

export function setupLogger(): void {
  log.transports.file.resolvePathFn = () => path.join(process.cwd(), 'logs', LOG_FILE_NAME)
  log.transports.file.getFile().clear()

  const loggerAndQuit = (message: unknown): void => {
    log.error(message)
    app.quit()
    setTimeout(() => process.exit(1), 1000)
  }

  process.on('uncaughtException', (error) => loggerAndQuit(error))
  process.on('unhandledRejection', (error) => log.error(error))
}
