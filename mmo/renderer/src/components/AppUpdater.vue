<!-- eslint-disable vue/no-v-html -->
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import { GithubOutlined } from '@ant-design/icons-vue';
import { Button, Drawer, Progress, Tag, Tooltip } from 'ant-design-vue';
import DOMPurify from 'dompurify';
import { storeToRefs } from 'pinia';

import { ipc } from '#/api/ipc';
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

const isDev = import.meta.env.DEV;

const updaterStore = useUpdaterStore();
const {
  updateState,
  updateInfo,
  downloadProgress,
  errorMessage,
  isModalVisible,
} = storeToRefs(updaterStore);

const timer = ref<ReturnType<typeof setInterval>>();

const sanitizedReleaseNotes = computed(() => {
  if (updateInfo.value?.releaseNotes) {
    return DOMPurify.sanitize(updateInfo.value.releaseNotes);
  }
  return '';
});

const isPrerelease = computed(() => {
  return updateInfo.value?.version.includes('-') ?? false;
});

const confirmText = computed(() => {
  switch (updateState.value) {
    case 'available': {
      return $t('page.updater.ui.downloadNow');
    }
    case 'downloaded': {
      return $t('page.updater.ui.restartAndInstall');
    }
    default: {
      return $t('page.common.ok');
    }
  }
});

function formatBytes(bytes: number, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = Math.max(decimals, 0);
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

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
      updaterStore.$reset();
      updaterStore.toggleUpdaterViewer(false);
      break;
    }
    default: {
      updaterStore.toggleUpdaterViewer(false);
      break;
    }
  }
}

function handleCancel() {
  // When the user clicks "Later", we just close the modal.
  // The state remains 'available' so the float button is still visible.
  updaterStore.toggleUpdaterViewer(false);
}

function openReleasesPage() {
  if (window.electron?.ipcRenderer) {
    ipc.send(
      'shell:open-external',
      'https://github.com/tuquet/catalyst/releases',
    );
  }
}

function handleClearCacheAndRecheck() {
  if (window.electron?.ipcRenderer) {
    // Send a command to the main process to clear the updater cache.
    // The main process should handle the actual file deletion.
    ipc.send('updater:clear-cache');
  }
  // Reset the store to its initial state.
  updaterStore.$reset();
  // A small delay to ensure state is reset before re-checking.
  setTimeout(() => {
    updaterStore.checkForUpdates();
  }, 100);
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
    ipc.on('updater:update-available', (_: any, info: UpdateInfo) =>
      updaterStore.handleUpdateAvailable(info),
    ),
    ipc.on('updater:download-progress', (_: any, progress: ProgressInfo) =>
      updaterStore.handleDownloadProgress(progress),
    ),
    ipc.on('updater:update-downloaded', () =>
      updaterStore.handleUpdateDownloaded(),
    ),
    ipc.on('updater:error', (_: any, err: string) =>
      updaterStore.handleError(err),
    ),
  );
});

watch(
  () => updateState.value,
  (newState) => {
    // Hiển thị modal ngay lập tức khi có lỗi
    if (newState === 'error') {
      updaterStore.toggleUpdaterViewer(true);
    }
  },
);

onUnmounted(() => {
  clearInterval(timer.value);
  // Clean up all IPC listeners
  listeners.forEach((unlisten) => unlisten());
});
</script>
<template>
  <Drawer
    v-model:open="isModalVisible"
    :title="$t('ui.widgets.checkUpdatesTitle')"
    placement="right"
    :closable="true"
    :mask-closable="true"
    :keyboard="true"
    width="500"
    @close="handleCancel"
  >
    <template #extra>
      <Tooltip :title="$t('page.updater.ui.viewOnGithub')">
        <Button type="text" shape="circle" @click="openReleasesPage">
          <template #icon>
            <GithubOutlined />
          </template>
        </Button>
      </Tooltip>
    </template>
    <!-- Display update information if available, across multiple states -->
    <div v-if="updateInfo">
      <h3 class="flex items-center gap-2 text-lg font-semibold">
        <span>
          {{
            $t('page.updater.ui.newVersionReady', {
              version: updateInfo.version,
            })
          }}
        </span>
        <Tag v-if="isPrerelease" color="orange">
          {{ $t('page.updater.ui.releaseType.prerelease') }}
        </Tag>
        <Tag v-else color="green">
          {{ $t('page.updater.ui.releaseType.stable') }}
        </Tag>
      </h3>
      <p class="text-muted-foreground mt-1 text-sm">
        {{ $t('page.updater.ui.releaseDate') }}
        {{ new Date(updateInfo.releaseDate).toLocaleString() }}
      </p>
      <div
        v-if="updateInfo.releaseNotes"
        class="prose prose-sm dark:prose-invert bg-muted mt-4 max-h-40 overflow-y-auto rounded-md border p-2"
        v-html="sanitizedReleaseNotes"
      ></div>
      <div v-if="updateInfo.files?.[0]?.size" class="mt-4 text-sm">
        <strong>{{ $t('page.updater.ui.downloadSize') }}</strong>
        {{ formatBytes(updateInfo.files[0].size) }}
      </div>

      <!-- Status-specific UI that appears below the update info -->
      <div class="mt-6">
        <div v-if="updateState === 'downloading'">
          <p class="mb-2">{{ $t('page.updater.ui.downloading') }}</p>
          <Progress :percent="Math.round(downloadProgress?.percent || 0)" />
        </div>
        <p v-else-if="updateState === 'downloaded'" class="font-semibold">
          {{ $t('page.updater.ui.downloadedMessage') }}
        </p>
      </div>
    </div>

    <div v-else-if="updateState === 'error'">
      {{ $t('page.updater.ui.errorMessage', { error: errorMessage }) }}
    </div>
    <div v-else>{{ $t('page.updater.ui.checkingForUpdate') }}</div>

    <template #footer>
      <div class="flex w-full items-center justify-between">
        <!-- Dev tools on the left -->
        <div>
          <Tooltip
            v-if="isDev"
            :title="$t('page.updater.ui.clearAndRecheckTooltip')"
          >
            <Button danger type="dashed" @click="handleClearCacheAndRecheck">
              {{ $t('page.updater.ui.clearAndRecheck') }}
            </Button>
          </Tooltip>
        </div>

        <!-- Standard buttons on the right -->
        <div class="flex justify-end gap-2">
          <Button v-if="updateState === 'available'" @click="handleCancel">
            {{ $t('page.common.later') }}
          </Button>
          <Button
            v-if="updateState !== 'downloading' && updateState !== 'checking'"
            type="primary"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </Button>
        </div>
      </div>
    </template>
  </Drawer>
</template>
