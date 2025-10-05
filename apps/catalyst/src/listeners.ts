import type { LogEntry } from '#/store/logger';
import type { ProgressInfo, UpdateInfo } from '#/store/updater';

import { useLoggerStore, useSettingsStore, useUpdaterStore } from '#/store';

import { ipc } from './api/ipc';

/**
 * Thiết lập các listener toàn cục để nhận sự kiện từ tiến trình Main.
 * Hàm này nên được gọi một lần trong giai đoạn khởi tạo của ứng dụng.
 */
export function setupIpcListeners(): void {
  if (!window.electron?.ipcRenderer) {
    console.warn(
      '[Listeners] Electron IPC renderer not available. Skipping listener setup.',
    );
    return;
  }

  const loggerStore = useLoggerStore();
  const updaterStore = useUpdaterStore();
  const settingsStore = useSettingsStore();

  // --- Lắng nghe sự kiện Log ---
  ipc.on('app-log', (_event: any, logEntry: LogEntry) => {
    loggerStore.addLog(logEntry);
  });

  // --- Lắng nghe sự kiện Updater ---
  ipc.on('updater:update-available', (_event: any, info: UpdateInfo) => {
    updaterStore.handleUpdateAvailable(info);
  });

  ipc.on('updater:download-progress', (_event: any, progress: ProgressInfo) => {
    updaterStore.handleDownloadProgress(progress);
  });

  ipc.on('updater:update-downloaded', (_event: any, info: UpdateInfo) => {
    updaterStore.handleUpdateDownloaded(info);
  });

  ipc.on('updater:error', (_event: any, err: string) => {
    updaterStore.handleError(err);
  });

  // --- Lắng nghe sự kiện Settings ---
  ipc.on('settings:key-updated', async (_event: any, key: string) => {
    await settingsStore.fetchSingleApiKey(key);
  });
}
