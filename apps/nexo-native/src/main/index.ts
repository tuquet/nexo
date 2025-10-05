import path from 'node:path';
import process from 'node:process';

import { app } from 'electron';
import log from 'electron-log';

// import { app } from 'electron'
import { setupAppEvents } from './bootstrap/event';
import { setupLogger } from './bootstrap/logger';
import { APP_PATH } from './bootstrap/path';
import { setupProtocol } from './bootstrap/protocol';
import { setupMainWindow } from './bootstrap/window';
import { setupIpcHandlers } from './ipc';
// import { startMockServer, stopMockServer } from './bootstrap/mock-server'

const DATABASE_PATH = path.join(APP_PATH, process.env.VITE_DATABASE_NAME || '');

// Fixing the issue with the env variable
process.env = { ...process.env, ...import.meta.env };
process.env.VITE_DATABASE_NAME = DATABASE_PATH;

void (async () => {
  try {
    if (!process.env.VITE_DATABASE_NAME) {
      log.warn(
        '[Boostrap] VITE_DATABASE_NAME is not set. Application may not work as expected.',
      );
    }

    await setupLogger();

    // await startMockServer()

    await setupAppEvents();

    await setupProtocol();

    await setupMainWindow();

    await setupIpcHandlers();
  } catch (error) {
    log.error('Failed to setup application:', error);
    // Consider a more graceful exit in production
    app.quit();
  }
})();

// app.on('will-quit', () => {
//   stopMockServer()
// })
