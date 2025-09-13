<!-- eslint-disable unicorn/prefer-ternary -->
<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { h, onMounted, ref } from 'vue';

import { Page, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { SendOutlined } from '@ant-design/icons-vue';
import { useStorage } from '@vueuse/core';
import {
  Alert,
  Button,
  message,
  Modal,
  notification,
  Progress,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { ipc } from '#/api/ipc';
import { useBinaryManager } from '#/store/binary-manager';

interface CutJob {
  error?: string;
  id: string;
  outputPath: string;
  progress: number;
  segmentDuration: number;
  status: 'canceled' | 'cutting' | 'failed' | 'pending' | 'success';
  videoName: string;
  videoPath: string;
}

const {
  binaryManagerState,
  ensureBinaries,
  BinaryManagerModal,
  binaryManagerModalApi,
} = useBinaryManager();

const isProcessing = ref(false);

const defaultFormState = {
  videoPath: '',
  outputMode: 'custom',
  outputPath: '',
  segmentDuration: 5,
};

const formState = useStorage('video-cutter-form-state', {
  ...defaultFormState,
});

async function handleSelectVideo() {
  const path = await ipc.invoke('dialog:select-file');
  if (path) {
    await gridApi.formApi.setValues({ videoPath: path });
  }
}

async function handleSelectOutput() {
  const path = await ipc.invoke('dialog:select-directory');
  if (path) {
    await gridApi.formApi.setValues({ outputPath: path });
  }
}

async function handleReset() {
  formState.value = { ...defaultFormState };
  await gridApi.formApi.setValues(formState.value);
  message.success($t('page.videoDownloader.resetSuccess'));
}

async function handleSubmit() {
  if (isProcessing.value) {
    message.warning($t('page.videoCutter.notifications.processing'));
    return;
  }

  const values = await gridApi.formApi.getValues();
  const videoPath = values.videoPath as string;
  let outputPath = values.outputPath as string;

  if (values.outputMode === 'sameAsVideo') {
    // Validation should prevent this, but as a safeguard.
    if (!videoPath) {
      return;
    }
    const lastDotIndex = videoPath.lastIndexOf('.');
    // Ensure there's an extension and it's not part of a directory name
    if (
      lastDotIndex !== -1 &&
      lastDotIndex >
        Math.max(videoPath.lastIndexOf('/'), videoPath.lastIndexOf('\\'))
    ) {
      outputPath = videoPath.slice(0, Math.max(0, lastDotIndex));
    } else {
      // If no extension is found, use the original path.
      // The main process will create a directory with this name.
      outputPath = videoPath;
    }
  }

  // Check if the output directory already exists before adding the job
  const exists = await ipc.invoke('fs:path-exists', outputPath);
  if (exists) {
    message.error(
      $t('page.videoCutter.notifications.outputDirExists', {
        path: outputPath,
      }),
    );
    return;
  }

  const videoName = videoPath.split(/[/\\]/).pop() || 'Unknown Video';

  const newJob: CutJob = {
    id: `cut-${Date.now()}`,
    videoName,
    videoPath: values.videoPath,
    outputPath,
    segmentDuration: values.segmentDuration,
    status: 'pending',
    progress: 0,
  };

  await gridApi.grid?.insertAt(newJob, -1);
  processJob(newJob);
}

const formOptions: VbenFormProps = {
  handleSubmit,
  handleReset,
  layout: 'vertical',
  wrapperClass: 'grid lg:grid-cols-3 gap-x-4',
  actionLayout: 'newLine',
  actionWrapperClass: 'mt-3',
  actionPosition: 'center',
  compact: true,
  actionButtonsReverse: true,
  schema: [
    {
      component: 'InputSearch',
      fieldName: 'videoPath',
      label: $t('page.videoCutter.videoPath.label'),
      formItemClass: 'lg:col-span-3',
      componentProps: {
        placeholder: $t('page.videoCutter.videoPath.placeholder'),
        enterButton: $t('page.videoCutter.browse'),
        readonly: true,
        onSearch: handleSelectVideo,
      },
      rules: z.string().min(1, $t('page.videoCutter.videoPath.rule')),
    },
    {
      component: 'RadioGroup',
      fieldName: 'outputMode',
      label: $t('page.videoCutter.outputPath.modeLabel'),
      formItemClass: 'lg:col-span-3',
      componentProps: {
        options: [
          {
            label: $t('page.videoCutter.outputPath.options.custom'),
            value: 'custom',
          },
          {
            label: $t('page.videoCutter.outputPath.options.sameAsVideo'),
            value: 'sameAsVideo',
          },
        ],
        optionType: 'button',
        buttonStyle: 'solid',
      },
    },
    {
      component: 'InputSearch',
      fieldName: 'outputPath',
      label: $t('page.videoCutter.outputPath.label'),
      componentProps: {
        placeholder: $t('page.videoCutter.outputPath.placeholder'),
        enterButton: $t('page.videoCutter.browse'),
        readonly: true,
        onSearch: handleSelectOutput,
      },
      dependencies: {
        show: (values) => values.outputMode === 'custom',
        triggerFields: ['outputMode'],
      },
      rules: z.string().min(1, $t('page.videoCutter.outputPath.rule')),
    },
    {
      component: 'InputNumber',
      fieldName: 'segmentDuration',
      label: $t('page.videoCutter.segmentDuration.label'),
      componentProps: {
        min: 1,
        class: 'w-full',
        addonAfter: $t('page.videoCutter.segmentDuration.addon'),
        placeholder: $t('page.videoCutter.segmentDuration.placeholder'),
      },
      rules: z.number().min(1, $t('page.videoCutter.segmentDuration.rule')),
    },
  ],
  submitButtonOptions: {
    innerText: $t('page.videoCutter.startCutting'),
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

const gridOptions: VxeGridProps<CutJob> = {
  autoResize: true,
  border: true,
  columns: [
    {
      field: 'video',
      slots: { default: 'video' },
      title: $t('page.videoCutter.table.video'),
    },
    {
      field: 'outputPath',
      title: $t('page.videoCutter.table.outputPath'),
      slots: { default: 'outputPath' },
      minWidth: 150,
    },
    {
      field: 'status',
      slots: { default: 'status' },
      title: $t('page.videoCutter.table.status'),
      width: 150,
      align: 'center',
    },
    {
      field: 'action',
      slots: { default: 'action' },
      title: $t('page.videoCutter.table.action'),
      width: 200,
      align: 'center',
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

onMounted(() => {
  ensureBinaries(['ffmpeg', 'ffprobe']);
  gridApi.formApi.setValues(formState.value);
});

async function stopJob(job: CutJob) {
  // Gửi yêu cầu dừng cắt đến tiến trình main
  await ipc.invoke('video:stop-cut', job.id);
}

async function processJob(job: CutJob) {
  isProcessing.value = true;

  const updateJob = (data: Partial<CutJob>) => {
    const row = gridApi.grid?.getRowById(job.id);
    if (row) {
      Object.assign(row, data);
    }
  };

  updateJob({ status: 'cutting' });

  const unlistenProgress = ipc.on(
    'video-cutter:progress',
    (
      _event: any,
      { jobId: progressJobId, percent }: { jobId: string; percent: number },
    ) => {
      if (job.id === progressJobId) {
        updateJob({ progress: percent });
      }
    },
  );

  try {
    await ipc.invoke('video:cut', {
      jobId: job.id,
      videoPath: job.videoPath,
      outputPath: job.outputPath,
      segmentDuration: job.segmentDuration,
    });

    updateJob({ status: 'success', progress: 100 });
    notification.success({
      message: $t('page.videoCutter.notifications.complete'),
      description: $t('page.videoCutter.notifications.completeDescription', {
        path: job.outputPath,
      }),
    });
  } catch (error: any) {
    // Kiểm tra xem có phải lỗi do người dùng hủy không
    if (error.code === 'CUT_CANCELED') {
      updateJob({ status: 'canceled', error: error.message });
    } else {
      updateJob({ status: 'failed', error: error.message });
      notification.error({
        message: $t('page.videoCutter.notifications.failed'),
        description: error.message,
      });
    }
  } finally {
    isProcessing.value = false;
    unlistenProgress();
  }
}

function removeJob(job: CutJob) {
  const performRemove = async () => {
    if (job.status === 'success') {
      try {
        await ipc.invoke('fs:delete-directory', job.outputPath);
        message.success($t('page.videoCutter.notifications.directoryDeleted'));
      } catch (error: any) {
        message.error(
          $t('page.videoCutter.notifications.directoryDeleteFailed', {
            error: error.message,
          }),
        );
        // Do not block removing from list if folder deletion fails
      }
    }
    gridApi.grid?.remove(job);
  };

  if (job.status === 'success') {
    Modal.confirm({
      title: $t('page.videoCutter.confirmDelete.title'),
      content: $t('page.videoCutter.confirmDelete.content'),
      okText: $t('page.videoCutter.confirmDelete.okText'),
      okType: 'danger',
      cancelText: $t('common.later'),
      onOk: performRemove,
    });
  } else {
    gridApi.grid?.remove(job);
  }
}

function retryJob(job: CutJob) {
  if (isProcessing.value) {
    message.warning($t('page.videoCutter.notifications.processing'));
    return;
  }
  const row = gridApi.grid?.getRowById(job.id);
  if (row) {
    const newJobState = {
      ...row,
      status: 'pending',
      progress: 0,
      error: undefined,
    };
    // We need to update the row in place before processing
    Object.assign(row, newJobState);
    processJob(row);
  }
}

function openFolder(path: string) {
  ipc.send('shell:open-path', path);
}

const getStatusColor = (status: CutJob['status']) => {
  switch (status) {
    case 'canceled': {
      return 'warning';
    }
    case 'cutting': {
      return 'processing';
    }
    case 'failed': {
      return 'error';
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
</script>

<template>
  <Page
    :title="$t('page.videoCutter.title')"
    :description="$t('page.videoCutter.description')"
    :auto-content-height="true"
  >
    <Grid>
      <template #outputPath="{ row: record }">
        <a
          v-if="record.status === 'success'"
          class="cursor-pointer text-blue-500 hover:underline"
          :title="record.outputPath"
          @click="openFolder(record.outputPath)"
        >
          {{ record.outputPath }}
        </a>
        <span v-else :title="record.outputPath">{{ record.outputPath }}</span>
      </template>
      <template #video="{ row: record }">
        <div>
          <p class="font-semibold" :title="record.videoName">
            {{ record.videoName }}
          </p>
          <p class="text-xs text-gray-500" :title="record.videoPath">
            {{ record.videoPath }}
          </p>
        </div>
      </template>
      <template #status="{ row: record }">
        <div v-if="record.status === 'cutting'">
          <Progress :percent="record.progress" />
        </div>
        <div v-else-if="record.status === 'failed' && record.error">
          <Alert type="error" :message="record.error" />
        </div>
        <Tag v-else :color="getStatusColor(record.status)">
          {{ $t(`page.videoCutter.status.${record.status}`) }}
        </Tag>
      </template>
      <template #action="{ row: record }">
        <div class="flex flex-wrap items-center justify-center gap-2">
          <Button
            v-if="record.status === 'cutting'"
            danger
            size="small"
            @click="stopJob(record)"
          >
            {{ $t('page.videoDownloader.actions.stop') }}
          </Button>
          <Button
            v-if="record.status === 'success'"
            type="primary"
            size="small"
            @click="openFolder(record.outputPath)"
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
            v-if="
              ['pending', 'success', 'failed', 'canceled'].includes(
                record.status,
              )
            "
            type="dashed"
            danger
            size="small"
            @click="removeJob(record)"
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

<style scoped></style>
