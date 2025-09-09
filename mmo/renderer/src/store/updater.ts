import { ref } from 'vue';

import { preferences } from '@vben/preferences';

import { defineStore } from 'pinia';

import { useNotificationStore } from './notification';

// These types are copied from AppUpdater.vue to avoid circular dependencies
// and keep the store self-contained.
interface UpdateInfo {
  files: {
    sha512: string;
    size: number;
    url: string;
  }[];
  path: string;
  releaseDate: string;
  releaseName: string;
  releaseNotes: null | string;
  sha512: string;
  tag: string;
  version: string;
}

interface ProgressInfo {
  percent: number;
}

type UpdateState =
  | 'available'
  | 'checking'
  | 'downloaded'
  | 'downloading'
  | 'error'
  | 'idle';

export const useUpdaterStore = defineStore('app-updater', () => {
  // State
  const updateState = ref<UpdateState>('idle');
  const updateInfo = ref<null | UpdateInfo>(null);
  const downloadProgress = ref<null | ProgressInfo>(null);
  const errorMessage = ref('');

  // Actions
  async function checkForUpdates() {
    if (updateState.value !== 'idle' || !window.electron?.ipcRenderer) return;

    try {
      updateState.value = 'checking';
      await window.electron.ipcRenderer.invoke('updater:check-for-updates');

      // If no 'update-available' event is received after a while,
      // assume no update is available and revert to idle.
      setTimeout(() => {
        if (updateState.value === 'checking') {
          updateState.value = 'idle';
        }
      }, 15_000); // 15-second timeout
    } catch (error: any) {
      console.error('[UpdaterStore] Check for updates failed:', error);
      errorMessage.value = error.message || 'An unknown error occurred.';
      updateState.value = 'error';
    }
  }

  function handleUpdateAvailable(info: UpdateInfo) {
    const notificationStore = useNotificationStore();
    updateInfo.value = info;
    updateState.value = 'available';
    notificationStore.addNotification({
      title: 'Có bản cập nhật mới',
      message: `Phiên bản ${info.version} đã sẵn sàng để tải xuống.`,
      avatar: preferences.logo.source,
    });
  }

  function handleDownloadProgress(progress: ProgressInfo) {
    updateState.value = 'downloading';
    downloadProgress.value = progress;
  }

  function handleUpdateDownloaded() {
    const notificationStore = useNotificationStore();
    updateState.value = 'downloaded';
    notificationStore.addNotification({
      title: 'Cập nhật đã sẵn sàng',
      message: `Bản cập nhật đã được tải xuống. Khởi động lại để cài đặt.`,
      avatar: preferences.logo.source,
    });
  }

  function handleError(err: string) {
    errorMessage.value = err;
    updateState.value = 'error';
  }

  function startDownload() {
    window.electron.ipcRenderer.send('updater:start-download');
    updateState.value = 'downloading';
  }

  function quitAndInstall() {
    window.electron.ipcRenderer.send('updater:quit-and-install');
  }

  function resetState() {
    updateState.value = 'idle';
    errorMessage.value = '';
    updateInfo.value = null;
    downloadProgress.value = null;
  }

  return {
    updateState,
    updateInfo,
    downloadProgress,
    errorMessage,
    checkForUpdates,
    handleUpdateAvailable,
    handleDownloadProgress,
    handleUpdateDownloaded,
    handleError,
    startDownload,
    quitAndInstall,
    resetState,
  };
});
