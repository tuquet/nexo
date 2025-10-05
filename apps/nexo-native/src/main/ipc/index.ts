import { ipcMain } from 'electron';

import * as Ipcs from './modules';

export function setupIpcHandlers(): void {
  Object.values(Ipcs).forEach((handler) => {
    if (typeof handler === 'function') {
      handler(ipcMain);
    }
  });
}
