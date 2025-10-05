/**
 * A wrapper around Electron's IPC (Inter-Process Communication) for the renderer process.
 * This provides a more convenient and potentially type-safe way to communicate
 * with the main process. It also handles cases where the Electron API is not available
 * (e.g., in a web browser environment for testing).
 */
export const ipc = {
  /**
   * Sends a message to the main process and expects a result asynchronously.
   * @param channel - The channel to send the message to.
   * @param args - Arguments to send with the message.
   * @returns A promise that resolves with the response from the main process.
   */
  invoke<T = any>(channel: string, ...args: any[]): Promise<T> {
    if (window.electron?.ipcRenderer) {
      return window.electron.ipcRenderer.invoke(channel, ...args);
    }
    // Provide a mock or error for non-Electron environments if needed.
    console.warn(
      `IPC invoke ignored in non-Electron environment for channel: ${channel}`,
    );
    return Promise.resolve(undefined as T);
  },

  /**
   * Sends a one-way message to the main process.
   * @param channel - The channel to send the message to.
   * @param args - Arguments to send with the message.
   */
  send(channel: string, ...args: any[]): void {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send(channel, ...args);
    } else {
      console.warn(
        `IPC send ignored in non-Electron environment for channel: ${channel}`,
      );
    }
  },

  /**
   * Listens for a message from the main process.
   * @param channel - The channel to listen on.
   * @param listener - The function to call when a message is received.
   * @returns A function to remove the listener.
   */
  on<T = any>(
    channel: string,
    listener: (event: any, ...args: T[]) => void,
  ): () => void {
    if (window.electron?.ipcRenderer) {
      const ipcListener = (event: any, ...args: T[]) =>
        listener(event, ...args);
      window.electron.ipcRenderer.on(channel, ipcListener);
      return () => {
        window.electron.ipcRenderer.removeListener(channel, ipcListener);
      };
    }
    console.warn(
      `IPC on ignored in non-Electron environment for channel: ${channel}`,
    );
    return () => {};
  },

  /**
   * Removes all listeners for a specific channel.
   * @param channel - The channel to remove listeners from.
   */
  removeAllListeners(channel: string): void {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.removeAllListeners(channel);
    } else {
      console.warn(
        `IPC removeAllListeners ignored in non-Electron environment for channel: ${channel}`,
      );
    }
  },
};
