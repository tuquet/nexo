import { app } from 'electron';

import { APP_NAME, APP_OAUTH_PROTOCOL_KEY } from '../config';
import { getMainWindow } from './window';

export function setupProtocol(): void {
  app.setAsDefaultProtocolClient(APP_NAME);
}

export function handleProtocolUrl(url: string): void {
  const window = getMainWindow();
  if (window) {
    const parsedUrl = new URL(url);
    const queryParams = Object.fromEntries(parsedUrl.searchParams.entries());
    if (window.isMinimized()) window.restore();
    window.focus();
    window.webContents.send(APP_OAUTH_PROTOCOL_KEY, queryParams);
  }
}
