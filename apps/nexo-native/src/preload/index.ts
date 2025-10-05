import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  /** Gửi một sự kiện 'ping' đến tiến trình Main */
  ping: (): void => ipcRenderer.send('ping'),
  /** Lắng nghe sự kiện 'pong' từ tiến trình Main */
  onPong: (callback: (message: string) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, message: string): void => callback(message)
    ipcRenderer.on('pong', listener)
    // Trả về một hàm để gỡ bỏ listener, giúp tránh rò rỉ bộ nhớ
    return () => ipcRenderer.removeListener('pong', listener)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
