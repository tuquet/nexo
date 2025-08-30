// / <reference types="vite/client" />

import type { ElectronAPI } from '@electron-toolkit/preload';

interface ICustomAPI {
  onPong: (callback: (message: string) => void) => () => void;
  ping: () => void;
}

declare global {
  interface Window {
    api: ICustomAPI;
    electron: ElectronAPI;
  }
}
