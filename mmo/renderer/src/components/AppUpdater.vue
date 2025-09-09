<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { $t } from '#/locales';

defineOptions({ name: 'AppUpdater' });

// Local types to avoid importing from 'electron-updater' in the renderer.
interface UpdateInfo {
  version: string;
  // Add other properties if needed
}

interface ProgressInfo {
  percent: number;
  // Add other properties if needed
}

type UpdateState =
  | 'available'
  | 'checking'
  | 'downloaded'
  | 'downloading'
  | 'error'
  | 'idle';

const updateState = ref<UpdateState>('idle');
const updateInfo = ref<null | UpdateInfo>(null);
const downloadProgress = ref<null | ProgressInfo>(null);
const errorMessage = ref('');
const timer = ref<ReturnType<typeof setInterval>>();

const [UpdateNoticeModal, modalApi] = useVbenModal({
  closable: false,
  closeOnPressEscape: false,
  closeOnClickModal: false,
  onConfirm: handleConfirm,
  onCancel: handleCancel,
});

function handleConfirm() {
  switch (updateState.value) {
    case 'available': {
      // User wants to start the download
      window.electron.ipcRenderer.send('updater:start-download');
      updateState.value = 'downloading';
      break;
    }
    case 'downloaded': {
      // User wants to restart and install
      window.electron.ipcRenderer.send('updater:quit-and-install');
      break;
    }
    default: {
      modalApi.close();
      break;
    }
  }
}

function handleCancel() {
  // Reset state if the user cancels
  updateState.value = 'idle';
  updateInfo.value = null;
  downloadProgress.value = null;
  modalApi.close();
}

async function checkForUpdates() {
  if (updateState.value !== 'idle' || !window.electron?.ipcRenderer) return;

  try {
    updateState.value = 'checking';
    await window.electron.ipcRenderer.invoke('updater:check-for-updates');
    // The main process will send 'updater:update-available' if an update is found.
    // If not, we just revert to 'idle'.
    if (updateState.value === 'checking') {
      updateState.value = 'idle';
    }
  } catch (error: any) {
    console.error('[Updater] Check for updates failed:', error);
    errorMessage.value = error.message || 'An unknown error occurred.';
    updateState.value = 'error';
    modalApi.open();
  }
}

const listeners: (() => void)[] = [];

onMounted(() => {
  if (!window.electron?.ipcRenderer) {
    console.warn(
      'AppUpdater: Electron IPC not available. Update checks are disabled.',
    );
    return;
  }

  // Check for updates immediately on mount
  checkForUpdates();

  // Then check every 30 minutes
  timer.value = setInterval(checkForUpdates, 30 * 60 * 1000);

  // Listen for events from the main process
  listeners.push(
    window.electron.ipcRenderer.on(
      'updater:update-available',
      (_: any, info: UpdateInfo) => {
        updateInfo.value = info;
        updateState.value = 'available';
        modalApi.open();
      },
    ),
    window.electron.ipcRenderer.on(
      'updater:download-progress',
      (_: any, progress: ProgressInfo) => {
        updateState.value = 'downloading';
        downloadProgress.value = progress;
      },
    ),
    window.electron.ipcRenderer.on('updater:update-downloaded', () => {
      updateState.value = 'downloaded';
      // Re-open the modal if it was closed, to show the "Restart" button
      if (!modalApi.onOpened) {
        modalApi.open();
      }
    }),
    window.electron.ipcRenderer.on('updater:error', (_: any, err: string) => {
      errorMessage.value = err;
      updateState.value = 'error';
      if (!modalApi.onOpened) {
        modalApi.open();
      }
    }),
  );
});

onUnmounted(() => {
  clearInterval(timer.value);
  // Clean up all IPC listeners
  listeners.forEach((unlisten) => unlisten());
});

function getModalContent() {
  switch (updateState.value) {
    case 'available': {
      return `Phiên bản mới ${updateInfo.value?.version} đã sẵn sàng. Bạn có muốn tải xuống ngay bây giờ không?`;
    }
    case 'downloaded': {
      return 'Bản cập nhật đã được tải xuống. Hãy khởi động lại ứng dụng để áp dụng các thay đổi.';
    }
    case 'downloading': {
      return `Đang tải bản cập nhật... ${downloadProgress.value?.percent.toFixed(0) || 0}%`;
    }
    case 'error': {
      return `Đã xảy ra lỗi: ${errorMessage.value}`;
    }
    default: {
      return 'Đang kiểm tra cập nhật...';
    }
  }
}
</script>
<template>
  <UpdateNoticeModal
    :cancel-text="updateState === 'available' ? $t('common.later') : undefined"
    :confirm-text="
      updateState === 'downloaded'
        ? 'Khởi động lại & Cài đặt'
        : updateState === 'available'
          ? 'Tải xuống ngay'
          : $t('common.ok')
    "
    :show-cancel-button="updateState === 'available'"
    :show-confirm-button="
      updateState !== 'downloading' && updateState !== 'checking'
    "
    :fullscreen-button="false"
    :title="$t('ui.widgets.checkUpdatesTitle')"
    centered
    content-class="px-8 min-h-10"
    footer-class="border-none mb-3 mr-3"
    header-class="border-none"
  >
    {{ getModalContent() }}
    <div v-if="updateState === 'downloading'" class="mt-4">
      <!-- Simple progress bar -->
      <div class="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          class="h-2.5 rounded-full bg-blue-600"
          :style="{ width: `${downloadProgress?.percent.toFixed(0) || 0}%` }"
        ></div>
      </div>
    </div>
  </UpdateNoticeModal>
</template>
