import { ref } from 'vue';

import { preferences } from '@vben/preferences';

import { defineStore } from 'pinia';

import { ipc } from '#/api/ipc';

import { useNotificationStore } from './notification';

// These types are copied from AppUpdater.vue to avoid circular dependencies
// and keep the store self-contained.
export interface UpdateInfo {
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

export interface ProgressInfo {
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
  const isModalVisible = ref(false);

  // Actions
  async function checkForUpdates() {
    if (updateState.value !== 'idle' || !window.electron) return;

    try {
      updateState.value = 'checking';
      await ipc.invoke('updater:check-for-updates');

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

  function handleUpdateDownloaded(_info?: UpdateInfo) {
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
    ipc.send('updater:start-download');
    updateState.value = 'downloading';
  }

  function toggleUpdaterViewer(visible?: boolean) {
    isModalVisible.value =
      typeof visible === 'boolean' ? visible : !isModalVisible.value;
  }

  function quitAndInstall() {
    ipc.send('updater:quit-and-install');
  }

  function $reset() {
    updateState.value = 'idle';
    errorMessage.value = '';
    updateInfo.value = null;
    downloadProgress.value = null;
  }

  return {
    isModalVisible,
    updateState,
    updateInfo,
    downloadProgress,
    errorMessage,
    toggleUpdaterViewer,
    checkForUpdates,
    handleUpdateAvailable,
    handleDownloadProgress,
    handleUpdateDownloaded,
    handleError,
    startDownload,
    quitAndInstall,
    $reset,
  };
});
