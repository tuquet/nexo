import process from 'node:process';

import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow } from 'electron';
// import { installExtension, VUEJS_DEVTOOLS } from 'electron-devtools-installer';
import log from 'electron-log';

import { handleProtocolUrl } from './protocol';
import { getMainWindow, setupMainWindow } from './window';

export async function setupAppEvents(): Promise<void> {
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
    return;
  }

  await app.whenReady();

  electronApp.setAppUserModelId('vn.tfsoftware.catalyst');

  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleProtocolUrl(url);
    log.info(event, url);
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void setupMainWindow();
    }
  });

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  app.on('second-instance', (_event, argv) => {
    const window = getMainWindow();
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
      const url = argv.find((arg) => arg.startsWith('catalyst://'));
      if (url) handleProtocolUrl(url);
    }
  });

  app.on('before-quit', () => log.info('Application is quitting...'));

  if (is.dev) {
    // await installExtension([VUEJS_DEVTOOLS])
    //   .then(([vue]) => console.log(`Added Extensions:  ${vue.name}`))
    //   .catch((error) => console.log('An error occurred:', error));
  }
}
