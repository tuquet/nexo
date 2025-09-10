<script setup lang="ts">
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { SendOutlined } from '@ant-design/icons-vue';
import { useStorage } from '@vueuse/core';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  message,
  Progress,
  Table,
  Tag,
  Textarea,
} from 'ant-design-vue';

import { useBinaryManager } from '#/composables/useBinaryManager';

interface FormatInfo {
  format_id: string;
  label: string;
}

interface FormatsPayload {
  formats: FormatInfo[];
  thumbnail: string;
  title: string;
  url: string;
}

interface DownloadProgressPayload {
  key: string;
  percent: number;
  title: null | string;
}

interface DownloadCompletePayload {
  filePath: null | string;
  key: string;
  outputPath: string;
  title: null | string;
}

interface DownloadJob {
  cookieFilePath?: string;
  downloadPlaylist: boolean;
  error?: string;
  filePath?: null | string;
  id: number;
  isAudioOnly: boolean;
  outputPath: string;
  progress: number;
  status: 'downloading' | 'failed' | 'pending' | 'success';
  thumbnail: string;
  title: string;
  url: string;
  useCookieFile: boolean;
}

const {
  binaryManagerState,
  ensureBinaries,
  BinaryManagerModal,
  binaryManagerModalApi,
} = useBinaryManager();

const formRef = ref<FormInstance>();
const loading = ref(false);
const downloadQueue = ref<DownloadJob[]>([]);

const downloadStats = computed(() => {
  const total = downloadQueue.value.length;
  const downloaded = downloadQueue.value.filter(
    (job) => job.status === 'success',
  ).length;
  return { total, downloaded };
});

// Vô hiệu hóa form khi đang tải công cụ hoặc đang thực hiện một tác vụ
const isFormDisabled = computed(
  () => loading.value || !binaryManagerState.isReady,
);

const defaultFormState = {
  videoUrl: '',
  outputPath: '',
  useCookieFile: false,
  cookieFilePath: '',
  downloadPlaylist: true,
  isAudioOnly: false,
};

const formState = useStorage<typeof defaultFormState>(
  'youtube-downloader-form-state',
  {
    ...defaultFormState,
  },
);

const rules = computed((): Record<string, Rule[]> => {
  return {
    videoUrl: [
      {
        required: true,
        message: $t('page.videoDownloader.videoUrl.ruleRequired'),
      },
    ],
    outputPath: [
      { required: true, message: $t('page.videoDownloader.outputPath.rule') },
    ],
    cookieFilePath: [
      {
        required: formState.value.useCookieFile,
        message: $t('page.videoDownloader.cookieFilePath.rule'),
      },
    ],
  };
});

const handleSelectOutput = async () => {
  const path = await window.electron.ipcRenderer.invoke(
    'dialog:select-directory',
  );
  if (path) {
    formState.value.outputPath = path;
    formRef.value?.validateFields('outputPath');
  }
};

const handleSelectCookieFile = async () => {
  const path = await window.electron.ipcRenderer.invoke(
    'video:select-cookie-file',
  );
  if (path) {
    formState.value.cookieFilePath = path;
    formRef.value?.validateFields('cookieFilePath');
  }
};

const resetForm = () => {
  formState.value = { ...defaultFormState };
  formRef.value?.clearValidate();
  message.success($t('page.videoDownloader.resetSuccess'));
};

const removeJob = (jobId: number) => {
  downloadQueue.value = downloadQueue.value.filter((job) => job.id !== jobId);
};

const retryJob = (job: DownloadJob) => {
  // Reset status to be picked up by the queue processor again
  job.status = 'pending';
  job.error = undefined;
  job.progress = 0;
  // Start processing the queue again
  processQueue();
};

onMounted(() => {
  // Yêu cầu các công cụ cần thiết (yt-dlp và ffmpeg) ngay khi vào màn hình.
  // Composable sẽ tự động xử lý việc hiển thị modal và cập nhật trạng thái.
  ensureBinaries(['yt-dlp', 'ffmpeg']);
});

const onFinish = async (values: { outputPath: string; videoUrl: string }) => {
  const urls = values.videoUrl
    .split('\n')
    .map((url) => url.trim())
    .filter(Boolean);

  if (urls.length === 0) {
    message.warning($t('page.videoDownloader.videoUrl.ruleRequired'));
    return;
  }

  loading.value = true;
  try {
    for (const url of urls) {
      try {
        // Lấy thông tin cho từng URL. Backend sẽ trả về một mảng video.
        const videoInfos = (await window.electron.ipcRenderer.invoke(
          'Video:get-formats',
          url,
          {
            useCookieFile: formState.value.useCookieFile,
            cookieFilePath: formState.value.cookieFilePath,
            downloadPlaylist: formState.value.downloadPlaylist,
          },
        )) as FormatsPayload[];

        // Thêm từng video vào hàng đợi
        videoInfos.forEach((info) => {
          downloadQueue.value.push({
            id: Date.now() + Math.random(),
            url: info.url,
            title: info.title,
            thumbnail: info.thumbnail,
            status: 'pending',
            progress: 0,
            outputPath: values.outputPath,
            isAudioOnly: formState.value.isAudioOnly,
            // QUAN TRỌNG: Đặt là false vì chúng ta đã có URL của từng video riêng lẻ.
            // Nếu để true, yt-dlp sẽ cố tải lại cả playlist cho mỗi video.
            downloadPlaylist: false,
            useCookieFile: formState.value.useCookieFile,
            cookieFilePath: formState.value.useCookieFile
              ? formState.value.cookieFilePath
              : '',
          });
        });
      } catch (error: any) {
        message.error(
          `Lỗi khi lấy thông tin cho URL: ${url}. ${error.message}`,
        );
      }
    }
  } finally {
    loading.value = false;
  }

  if (downloadQueue.value.some((job) => job.status === 'pending')) {
    processQueue();
  }
};

const processQueue = async () => {
  // Prevent multiple concurrent downloads
  if (loading.value) return;
  loading.value = true;

  // Tìm công việc đang chờ đầu tiên
  let nextJob;
  while (
    // eslint-disable-next-line no-cond-assign
    (nextJob = downloadQueue.value.find((job) => job.status === 'pending'))
  ) {
    // Xử lý từng công việc một
    await processJob(nextJob);
  }

  loading.value = false;
};

const processJob = async (job: DownloadJob) => {
  try {
    // Thông tin video (title, thumbnail) đã được lấy trước khi thêm vào hàng đợi.
    // Bắt đầu tải ngay.
    job.status = 'downloading';
    job.progress = 0;

    const unlistenProgress = window.electron.ipcRenderer.on(
      'Video:download-progress',
      (_event: any, { key, percent }: DownloadProgressPayload) => {
        if (job.url === key) {
          job.progress = percent;
        }
      },
    );

    const completePayload = (await window.electron.ipcRenderer.invoke(
      'Video:download-video',
      {
        videoUrl: job.url,
        outputPath: job.outputPath,
        isAudioOnly: job.isAudioOnly,
        downloadPlaylist: job.downloadPlaylist,
        useCookieFile: job.useCookieFile,
        cookieFilePath: job.cookieFilePath,
      },
    )) as DownloadCompletePayload;

    unlistenProgress(); // Dọn dẹp listener

    // Hoàn thành
    job.status = 'success';
    job.progress = 100;
    job.filePath = completePayload.filePath;
  } catch (error: any) {
    job.status = 'failed';
    job.error = error.message || 'Unknown error';
  }
};

const tableColumns = [
  {
    title: 'Video',
    key: 'video',
    width: '40%',
  },
  {
    title: 'Trạng thái',
    key: 'status',
    width: '40%',
  },
  {
    title: 'Hành động',
    key: 'action',
  },
];

const getStatusColor = (status: DownloadJob['status']) => {
  switch (status) {
    case 'downloading': {
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

const getStatusText = (status: DownloadJob['status']) => {
  switch (status) {
    case 'downloading': {
      return 'Đang tải...';
    }
    case 'failed': {
      return 'Thất bại';
    }
    case 'pending': {
      return 'Đang chờ';
    }
    case 'success': {
      return 'Thành công';
    }
    default: {
      return 'Không xác định';
    }
  }
};

const openFilePath = (filePath: string) => {
  window.electron.ipcRenderer.send('shell:open-path', filePath);
};

const showItemInFolder = (filePath: string) => {
  window.electron.ipcRenderer.send('shell:show-item-in-folder', filePath);
};
</script>

<template>
  <Page
    :title="$t('page.videoDownloader.title')"
    :description="$t('page.videoDownloader.description')"
  >
    <Card :title="$t('page.videoDownloader.cardTitle')">
      <Form
        ref="formRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
        :disabled="isFormDisabled"
        @finish="onFinish"
      >
        <Form.Item
          :label="$t('page.videoDownloader.videoUrl.label')"
          name="videoUrl"
        >
          <Textarea
            v-model:value="formState.videoUrl"
            :placeholder="$t('page.videoDownloader.videoUrl.placeholder')"
            :rows="4"
            class="w-full"
          />
        </Form.Item>

        <Form.Item>
          <Checkbox v-model:checked="formState.downloadPlaylist">
            {{ $t('page.videoDownloader.downloadPlaylist') }}
          </Checkbox>
        </Form.Item>

        <Form.Item>
          <Checkbox v-model:checked="formState.useCookieFile">
            {{ $t('page.videoDownloader.useCookieFile') }}
          </Checkbox>
        </Form.Item>

        <Form.Item
          v-if="formState.useCookieFile"
          :label="$t('page.videoDownloader.cookieFilePath.label')"
          name="cookieFilePath"
        >
          <Input.Search
            v-model:value="formState.cookieFilePath"
            :placeholder="$t('page.videoDownloader.cookieFilePath.placeholder')"
            :enter-button="$t('page.videoDownloader.browse')"
            @search="handleSelectCookieFile"
          />
        </Form.Item>

        <Form.Item>
          <Checkbox v-model:checked="formState.isAudioOnly">
            {{ $t('page.videoDownloader.audioOnly') }}
          </Checkbox>
        </Form.Item>

        <Form.Item
          :label="$t('page.videoDownloader.outputPath.label')"
          name="outputPath"
        >
          <Input.Search
            v-model:value="formState.outputPath"
            :placeholder="$t('page.videoDownloader.outputPath.placeholder')"
            :enter-button="$t('page.videoDownloader.browse')"
            @search="handleSelectOutput"
          />
        </Form.Item>

        <Form.Item>
          <div class="flex w-full items-center gap-x-2">
            <Button
              type="primary"
              html-type="submit"
              :loading="loading"
              size="large"
              class="flex-grow"
            >
              <template #icon>
                <SendOutlined />
              </template>
              {{ $t('page.videoDownloader.startDownload') }}
            </Button>
            <Button size="large" @click="resetForm">
              {{ $t('page.videoDownloader.resetForm') }}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Card>

    <Card v-if="downloadQueue.length > 0" class="mt-5" size="small">
      <template #title>
        <span>
          {{ $t('page.videoDownloader.downloadQueueTitle') }}
          <Tag color="blue">
            {{ downloadStats.downloaded }} / {{ downloadStats.total }}
          </Tag>
        </span>
      </template>
      <Table
        :columns="tableColumns"
        :data-source="downloadQueue"
        :row-key="(record) => record.id"
        :pagination="false"
        :bordered="true"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'video'">
            <div class="flex items-center">
              <img
                v-if="record.thumbnail"
                :src="record.thumbnail"
                class="mr-3 h-10 w-16 flex-shrink-0 rounded object-cover"
              />
              <div class="flex-grow">
                <p class="font-semibold" :title="record.title">
                  {{ record.title }}
                </p>
                <p class="text-xs text-gray-500" :title="record.url">
                  {{ record.url }}
                </p>
              </div>
            </div>
          </template>
          <template v-if="column.key === 'status'">
            <div v-if="record.status === 'downloading'">
              <Progress :percent="record.progress" :steps="10" />
            </div>
            <div v-else-if="record.status === 'failed'">
              <Alert type="error" :message="record.error" />
            </div>
            <Tag v-else :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <div class="flex flex-wrap items-center gap-2">
              <!-- Nút này chỉ hiển thị khi có đường dẫn file cụ thể (không phải playlist) -->
              <Button
                v-if="record.status === 'success' && record.filePath"
                type="primary"
                size="small"
                @click="openFilePath(record.filePath)"
              >
                {{ $t('page.videoDownloader.notifications.openFile') }}
              </Button>
              <!-- Nút này hiển thị cho mọi trường hợp thành công -->
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
              <!-- Nút xóa chỉ hiển thị cho các trạng thái không hoạt động để tránh hủy tiến trình đang chạy -->
              <Button
                v-if="['pending', 'success', 'failed'].includes(record.status)"
                type="dashed"
                danger
                size="small"
                @click="removeJob(record.id)"
              >
                {{ $t('page.videoDownloader.actions.remove') }}
              </Button>
            </div>
          </template>
        </template>
      </Table>
    </Card>

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
  </Page>
</template>
