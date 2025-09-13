<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type {
  DownloadJob,
  DownloadSettings,
} from '#/store/video-download-manager';

import { h, onMounted } from 'vue';

import { Page, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { SendOutlined } from '@ant-design/icons-vue';
import { useStorage } from '@vueuse/core';
import {
  Alert,
  Avatar,
  Button,
  message,
  Modal,
  Progress,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { ipc } from '#/api/ipc';
import { useBinaryManager } from '#/store/binary-manager';
import { useVideoDownloadManager } from '#/store/video-download-manager';

const {
  binaryManagerState,
  ensureBinaries,
  BinaryManagerModal,
  binaryManagerModalApi,
} = useBinaryManager();

const defaultFormState = {
  videoUrl: '',
  outputPath: '',
  useCookieFile: false,
  cookieFilePath: '',
  downloadPlaylist: true,
  isAudioOnly: false,
  concurrentDownloads: 3,
};

const formState = useStorage<typeof defaultFormState>(
  'youtube-downloader-form-state',
  {
    ...defaultFormState,
  },
);

const formOptions: VbenFormProps = {
  handleSubmit,
  handleReset,
  layout: 'vertical',
  wrapperClass: 'grid lg:grid-cols-3',
  actionLayout: 'newLine',
  actionWrapperClass: 'mt-3',
  actionPosition: 'center',
  compact: true,
  actionButtonsReverse: true,
  schema: [
    {
      component: 'Textarea',
      fieldName: 'videoUrl',
      label: $t('page.videoDownloader.videoUrl.label'),
      formItemClass: 'lg:col-span-3',
      componentProps: {
        placeholder: $t('page.videoDownloader.videoUrl.placeholder'),
        rows: 4,
      },
      rules: z
        .string()
        .min(1, $t('page.videoDownloader.videoUrl.ruleRequired')),
    },
    {
      component: 'Checkbox',
      fieldName: 'downloadPlaylist',
      renderComponentContent: () => ({
        default: () => $t('page.videoDownloader.downloadPlaylist'),
      }),
    },
    {
      component: 'Checkbox',
      fieldName: 'useCookieFile',
      renderComponentContent: () => ({
        default: () => $t('page.videoDownloader.useCookieFile'),
      }),
    },
    {
      component: 'InputSearch',
      fieldName: 'cookieFilePath',
      label: $t('page.videoDownloader.cookieFilePath.label'),
      componentProps: {
        placeholder: $t('page.videoDownloader.cookieFilePath.placeholder'),
        enterButton: $t('page.videoDownloader.browse'),
        onSearch: handleSelectCookieFile,
      },
      dependencies: {
        show: (values) => !!values.useCookieFile,
        triggerFields: ['useCookieFile'],
      },
      rules: z.string().min(1, $t('page.videoDownloader.cookieFilePath.rule')),
    },
    {
      component: 'Checkbox',
      fieldName: 'isAudioOnly',
      renderComponentContent: () => ({
        default: () => $t('page.videoDownloader.audioOnly'),
      }),
    },
    {
      component: 'InputNumber',
      fieldName: 'concurrentDownloads',
      label: $t('page.videoDownloader.concurrentDownloads.label'),
      componentProps: {
        min: 1,
        max: 10,
        class: 'w-full',
      },
      help: $t('page.videoDownloader.concurrentDownloads.help'),
      rules: z.number().min(1),
    },
    {
      component: 'InputSearch',
      fieldName: 'outputPath',
      label: $t('page.videoDownloader.outputPath.label'),
      componentProps: {
        placeholder: $t('page.videoDownloader.outputPath.placeholder'),
        enterButton: $t('page.videoDownloader.browse'),
        onSearch: handleSelectOutput,
      },
      rules: z.string().min(1, $t('page.videoDownloader.outputPath.rule')),
    },
  ],
  submitButtonOptions: {
    innerText: $t('page.videoDownloader.startDownload'),
    slots: {
      icon: () => h(SendOutlined),
    },
  },
  resetButtonOptions: {
    innerText: $t('page.videoDownloader.resetForm'),
  },
  handleValuesChange(values) {
    formState.value = values as typeof defaultFormState;
  },
};

const gridOptions: VxeGridProps<DownloadJob> = {
  autoResize: true,
  border: true,
  columns: [
    {
      field: 'thumbnail',
      title: ' ', // Header trống cho cột thumbnail
      slots: { default: 'thumbnail' },
      width: 80,
      align: 'center',
    },
    {
      field: 'video',
      slots: {
        default: 'video',
      },
      title: $t('page.videoDownloader.table.video'),
    },
    {
      field: 'status',
      slots: {
        default: 'status',
      },
      title: $t('page.videoDownloader.table.status'),
    },
    {
      field: 'action',
      slots: {
        default: 'action',
      },
      title: $t('page.videoDownloader.table.action'),
    },
  ],
  data: [],
  height: 'auto',
  pagerConfig: { enabled: false },
  size: 'small',
  rowConfig: {
    keyField: 'id',
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions, formOptions });

const { addJobs, removeJob, retryJob } = useVideoDownloadManager(formState, {
  onJobAdded: async (job) => {
    await gridApi.grid?.insert(job);
  },
  onJobRemoved: async (jobId) => {
    const row = await gridApi.grid?.getRowById(jobId);
    if (row) {
      gridApi.grid?.remove(row);
    }
  },
  onJobUpdated: async (data) => {
    const row = await gridApi.grid?.getRowById(data.id);
    if (row) {
      Object.assign(row, data);
    }
  },
  onPlaylistExpanded: async (placeholderId, newJobs) => {
    const row = await gridApi.grid?.getRowById(placeholderId);
    if (row) {
      const index = gridApi.grid?.getRowIndex(row);
      gridApi.grid?.remove(row);
      gridApi.grid?.insertAt(newJobs, index);
    }
  },
});

onMounted(() => {
  ensureBinaries(['yt-dlp', 'ffmpeg']);
  gridApi.formApi.setValues(formState.value);
});

async function handleSelectOutput() {
  const path = await ipc.invoke('dialog:select-directory');
  if (path) {
    await gridApi.formApi.setValues({ outputPath: path });
  }
}

async function handleSelectCookieFile() {
  const path = await ipc.invoke('video:select-cookie-file');
  if (path) {
    await gridApi.formApi.setValues({ cookieFilePath: path });
  }
}

async function handleReset() {
  formState.value = { ...defaultFormState };
  await gridApi.formApi.setValues(formState.value);
  message.success($t('page.videoDownloader.resetSuccess'));
}

async function handleSubmit() {
  const values = await gridApi.formApi.getValues();
  const urls = values.videoUrl
    .split('\n')
    .map((url: string) => url.trim())
    .filter(Boolean);
  addJobs(urls, values as DownloadSettings);
}

async function stopJob(job: DownloadJob) {
  // Gửi yêu cầu dừng download đến tiến trình main
  await ipc.invoke('video:stop-download', job.id);
}

async function handleRemoveJob(job: DownloadJob) {
  const performRemove = async () => {
    // Nếu có file đã tải, thì xóa file trước
    if (job.filePath) {
      try {
        await ipc.invoke('video:delete-file', job.filePath);
        message.success($t('page.videoDownloader.notifications.fileDeleted'));
      } catch (error: any) {
        message.error(
          $t('page.videoDownloader.notifications.fileDeleteFailed', {
            error: error.message,
          }),
        );
        // Nếu xóa file thất bại, không xóa job khỏi danh sách để người dùng có thể thử lại
        return;
      }
    }
    // Xóa job khỏi danh sách
    removeJob(job.id);
  };

  // Nếu có file, hỏi xác nhận trước khi xóa
  if (job.filePath) {
    Modal.confirm({
      title: $t('page.videoDownloader.confirmDelete.title'),
      content: $t('page.videoDownloader.confirmDelete.content'),
      okText: $t('page.videoDownloader.confirmDelete.okText'),
      okType: 'danger',
      cancelText: $t('common.later'),
      onOk: performRemove,
    });
  } else {
    // Nếu không có file (chưa tải xong, lỗi...), xóa luôn không cần hỏi
    removeJob(job.id);
  }
}

const getStatusColor = (status: DownloadJob['status']) => {
  switch (status) {
    case 'downloading': {
      return 'processing';
    }
    case 'failed': {
      return 'error';
    }
    case 'fetching': {
      return 'processing';
    }
    case 'pending': {
      return 'default';
    }
    case 'success': {
      return 'success';
    }
    default: {
      return 'default';
    }
  }
};

const openFilePath = (filePath: string) => {
  ipc.send('shell:open-path', filePath);
};

const showItemInFolder = (filePath: string) => {
  ipc.send('shell:show-item-in-folder', filePath);
};
</script>

<template>
  <Page
    :title="$t('page.videoDownloader.title')"
    :description="$t('page.videoDownloader.description')"
    :auto-content-height="true"
  >
    <Grid>
      <template #thumbnail="{ row: record }">
        <Avatar
          v-if="record.thumbnail"
          shape="square"
          :size="48"
          :src="record.thumbnail"
        />
      </template>
      <template #video="{ row: record }">
        <div>
          <p v-if="record.title" class="font-semibold" :title="record.title">
            {{ record.title }}
          </p>
          <p
            v-if="record.url"
            class="text-xs text-gray-500"
            :title="record.url"
          >
            {{ record.url }}
          </p>
        </div>
      </template>
      <template #status="{ row: record }">
        <div v-if="record.status === 'downloading'">
          <Progress :percent="record.progress" />
        </div>
        <div v-else-if="record.status === 'failed'">
          <Alert type="error" :message="record.error" />
        </div>
        <Tag v-else :color="getStatusColor(record.status)">
          {{ $t(`page.videoDownloader.status.${record.status}`) }}
        </Tag>
      </template>
      <template #action="{ row: record }">
        <div class="flex flex-wrap items-center gap-2">
          <Button
            v-if="['downloading', 'fetching'].includes(record.status)"
            danger
            size="small"
            @click="stopJob(record)"
          >
            {{ $t('page.videoDownloader.actions.stop') }}
          </Button>

          <Button
            v-if="record.status === 'success' && record.filePath"
            type="primary"
            size="small"
            @click="openFilePath(record.filePath)"
          >
            {{ $t('page.videoDownloader.notifications.openFile') }}
          </Button>
          <Button
            v-if="record.status === 'success'"
            size="small"
            @click="
              record.filePath
                ? showItemInFolder(record.filePath)
                : openFilePath(record.outputPath)
            "
          >
            {{ $t('page.videoDownloader.notifications.openFolder') }}
          </Button>
          <Button
            v-if="record.status === 'failed'"
            size="small"
            @click="retryJob(record)"
          >
            {{ $t('page.videoDownloader.actions.retry') }}
          </Button>
          <Button
            v-if="record.status === 'success'"
            size="small"
            @click="retryJob(record)"
          >
            {{ $t('page.videoDownloader.actions.redownload') }}
          </Button>
          <Button
            v-if="['pending', 'success', 'failed'].includes(record.status)"
            type="dashed"
            danger
            size="small"
            @click="handleRemoveJob(record)"
          >
            {{ $t('page.videoDownloader.actions.remove') }}
          </Button>
        </div>
      </template>
    </Grid>
    <template #footer>
      <BinaryManagerModal
        :title="$t('page.binaryManager.preparing')"
        :show-confirm-button="binaryManagerState.status === 'error'"
        :confirm-text="$t('page.common.ok')"
        @confirm="() => binaryManagerModalApi.close()"
      >
        <div class="p-4 text-center">
          <p>{{ binaryManagerState.message }}</p>
          <Progress
            v-if="binaryManagerState.status === 'downloading'"
            :percent="binaryManagerState.percent"
            class="mt-4"
            status="active"
          />
        </div>
      </BinaryManagerModal>
    </template>
  </Page>
</template>
