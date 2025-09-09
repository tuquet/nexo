<!-- eslint-disable vue/no-v-html -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import DOMPurify from 'dompurify';
import { storeToRefs } from 'pinia';

import { $t } from '#/locales';
import { useUpdaterStore } from '#/store/updater';

defineOptions({ name: 'AppUpdater' });

// Local types to avoid importing from 'electron-updater' in the renderer.
interface UpdateInfo {
  files: File[];
  path: string;
  releaseDate: string;
  releaseName: string;
  releaseNotes: null | string;
  sha512: string;
  tag: string;
  version: string;
}

interface File {
  sha512: string;
  size: number;
  url: string;
}

interface ProgressInfo {
  percent: number;
  // Add other properties if needed
}

const updaterStore = useUpdaterStore();
const { updateState, updateInfo, downloadProgress, errorMessage } =
  storeToRefs(updaterStore);

const timer = ref<ReturnType<typeof setInterval>>();

const sanitizedReleaseNotes = computed(() => {
  if (updateInfo.value?.releaseNotes) {
    return DOMPurify.sanitize(updateInfo.value.releaseNotes);
  }
  return '';
});

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = Math.max(decimals, 0);
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

const [UpdateNoticeModal, modalApi] = useVbenModal({
  closable: false,
  closeOnPressEscape: true,
  closeOnClickModal: true,
  onConfirm: handleConfirm,
  onCancel: handleCancel,
});

function handleConfirm() {
  switch (updateState.value) {
    case 'available': {
      // User wants to start the download
      updaterStore.startDownload();
      break;
    }
    case 'downloaded': {
      // User wants to restart and install
      updaterStore.quitAndInstall();
      break;
    }
    case 'error': {
      // Reset state after user acknowledges the error
      updaterStore.resetState();
      modalApi.close();
      break;
    }
    default: {
      modalApi.close();
      break;
    }
  }
}

function handleCancel() {
  // When the user clicks "Later", we just close the modal.
  // The state remains 'available' so the float button is still visible.
  modalApi.close();
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
  updaterStore.checkForUpdates();

  // Then check every 30 minutes
  timer.value = setInterval(updaterStore.checkForUpdates, 30 * 60 * 1000);

  // Listen for events from the main process
  listeners.push(
    window.electron.ipcRenderer.on(
      'updater:update-available',
      (_: any, info: UpdateInfo) => updaterStore.handleUpdateAvailable(info),
    ),
    window.electron.ipcRenderer.on(
      'updater:download-progress',
      (_: any, progress: ProgressInfo) =>
        updaterStore.handleDownloadProgress(progress),
    ),
    window.electron.ipcRenderer.on('updater:update-downloaded', () =>
      updaterStore.handleUpdateDownloaded(),
    ),
    window.electron.ipcRenderer.on('updater:error', (_: any, err: string) =>
      updaterStore.handleError(err),
    ),
  );
});

watch(
  () => updateState.value,
  (newState) => {
    // Hiển thị modal ngay lập tức khi có lỗi
    if (newState === 'error') {
      modalApi.open();
    }
  },
);

onUnmounted(() => {
  clearInterval(timer.value);
  // Clean up all IPC listeners
  listeners.forEach((unlisten) => unlisten());
});

defineExpose({ open: modalApi.open });
</script>
<template>
  <UpdateNoticeModal
    :cancel-text="
      updateState === 'available' ? $t('page.common.later') : undefined
    "
    :confirm-text="
      updateState === 'downloaded'
        ? 'Khởi động lại & Cài đặt'
        : updateState === 'available'
          ? 'Tải xuống ngay'
          : $t('page.common.ok')
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
    <div v-if="updateState === 'available' && updateInfo">
      <h3 class="text-lg font-semibold">
        Phiên bản mới {{ updateInfo.version }} đã sẵn sàng!
      </h3>
      <p class="text-muted-foreground mt-1 text-sm">
        Phát hành ngày:
        {{ new Date(updateInfo.releaseDate).toLocaleString() }}
      </p>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div
        v-if="updateInfo.releaseNotes"
        class="prose prose-sm dark:prose-invert bg-muted mt-4 max-h-40 overflow-y-auto rounded-md border p-2"
        v-html="sanitizedReleaseNotes"
      ></div>
      <div
        v-if="updateInfo.files && updateInfo.files.length > 0"
        class="mt-4 text-sm"
      >
        <p v-if="updateInfo.files[0]">
          <strong>Kích thước tải xuống:</strong>
          {{ formatBytes(updateInfo.files?.[0]?.size) }}
        </p>
      </div>
    </div>
    <div v-else-if="updateState === 'downloading'">
      <p>
        Đang tải bản cập nhật...
        {{ downloadProgress?.percent.toFixed(0) || 0 }}%
      </p>
      <div class="mt-4">
        <!-- Simple progress bar -->
        <div class="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            class="h-2.5 rounded-full bg-blue-600"
            :style="{ width: `${downloadProgress?.percent.toFixed(0) || 0}%` }"
          ></div>
        </div>
      </div>
    </div>
    <div v-else-if="updateState === 'downloaded'">
      Bản cập nhật đã được tải xuống. Hãy khởi động lại ứng dụng để áp dụng các
      thay đổi.
    </div>
    <div v-else-if="updateState === 'error'">
      Đã xảy ra lỗi: {{ errorMessage }}
    </div>
    <div v-else>Đang kiểm tra cập nhật...</div>
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
