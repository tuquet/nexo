import { ElectronAPI } from '@electron-toolkit/preload'

export interface ICustomAPI {
  ping: () => void
  onPong: (callback: (message: string) => void) => () => void
}

declare global {
  interface Window {
    api: ICustomAPI
    electron: ElectronAPI
    VUE_DEVTOOLS_CONFIG?: {
      disableAutofill?: boolean
    }
  }
}
