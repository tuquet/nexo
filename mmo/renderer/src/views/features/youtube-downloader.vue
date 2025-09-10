<script setup lang="ts">
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import { Fragment, h, reactive, ref } from 'vue';

import { LoadingOutlined, SendOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  message,
  notification,
  Progress,
  Select,
} from 'ant-design-vue';

import { useLoggerStore } from '#/store';

interface FormatInfo {
  format_id: string;
  label: string;
}

interface DownloadStartedPayload {
  key: string;
  title: string;
}

interface DownloadProgressPayload {
  key: string;
  percent: number;
  title: null | string;
}

interface DownloadCompletePayload {
  filePath: string;
  key: string;
  title: null | string;
}

const formRef = ref<FormInstance>();
const loading = ref(false);
const fetchingFormats = ref(false);
const availableFormats = ref<FormatInfo[]>([]);

// Use a ref to track the URL of the download in progress.
// This is more reliable than `formState.youtubeUrl` which can be changed by the user or reset.
const activeDownloadUrl = ref<null | string>(null);

const formState = reactive({
  youtubeUrl: 'https://www.youtube.com/watch?v=4cSTibyaG8A',
  outputPath: String.raw`C:\Users\Admin\Videos\youtube-download`,
  selectedFormat: undefined as string | undefined,
  isAudioOnly: false,
});

const rules: Record<string, Rule[]> = {
  youtubeUrl: [
    { required: true, message: 'Please enter a YouTube video URL!' },
    { type: 'url', message: 'The URL is invalid!' },
  ],
  outputPath: [{ required: true, message: 'Please select an output path!' }],
};

const handleSelectOutput = async () => {
  const path = await window.electron.ipcRenderer.invoke('dialog:openDirectory');
  if (path) {
    formState.outputPath = path;
    formRef.value?.validateFields('outputPath');
  }
};

const handleUrlBlur = async () => {
  // A simple regex to check if it looks like a YouTube URL
  const youtubeRegex =
    /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.?be)\/.+$/;
  if (formState.youtubeUrl && youtubeRegex.test(formState.youtubeUrl)) {
    fetchingFormats.value = true;
    availableFormats.value = []; // Clear old formats
    formState.selectedFormat = undefined; // Reset selection
    try {
      const formats = (await window.electron.ipcRenderer.invoke(
        'youtube:get-formats',
        formState.youtubeUrl,
      )) as FormatInfo[];
      // Filter for unique formats based on the label
      availableFormats.value = formats.filter(
        (format: FormatInfo, index: number, self: FormatInfo[]) =>
          index === self.findIndex((f) => f.label === format.label),
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      message.error(`Error fetching video info: ${errorMessage}`);
    } finally {
      fetchingFormats.value = false;
    }
  }
};

const onFinish = async (values: { outputPath: string; youtubeUrl: string }) => {
  loading.value = true;
  const key = values.youtubeUrl;
  activeDownloadUrl.value = key;

  // --- Listener Setup ---
  // Thiết lập listener ngay trước khi bắt đầu và dọn dẹp ngay sau khi kết thúc.
  // Đây là một pattern mạnh mẽ để quản lý các sự kiện tạm thời.
  const unlistenStarted = window.electron.ipcRenderer.on(
    'youtube:download-started',
    (_event: any, { key, title }: DownloadStartedPayload) => {
      message.info(`Download started for: ${title} (${key})`);
    },
  );

  const unlistenProgress = window.electron.ipcRenderer.on(
    'youtube:download-progress',
    (_event: any, { key, percent, title }: DownloadProgressPayload) => {
      if (activeDownloadUrl.value === key) {
        updateProgressNotification(key, percent, title);
      }
    },
  );

  const unlistenComplete = window.electron.ipcRenderer.on(
    'youtube:download-complete',
    (_event: any, payload: DownloadCompletePayload) => {
      handleDownloadComplete(payload);
    },
  );

  notification.open({
    key,
    message: 'Preparing Download',
    description: () =>
      h('div', [
        h(Progress, { percent: 0, status: 'active' }),
        h('p', { style: { marginTop: '8px' } }, 'Fetching video info...'),
      ]),
    duration: 0,
    placement: 'bottomRight',
  });

  const cleanup = () => {
    unlistenStarted();
    unlistenProgress();
    unlistenComplete();
    if (activeDownloadUrl.value === key) {
      activeDownloadUrl.value = null;
    }
    loading.value = false;
  };

  try {
    await window.electron.ipcRenderer.invoke('youtube:download-video', {
      videoUrl: values.youtubeUrl,
      outputPath: values.outputPath,
      formatCode: formState.selectedFormat,
      isAudioOnly: formState.isAudioOnly,
    });
  } catch {
    // Đóng thông báo "Preparing" trước khi hiển thị lỗi.
    notification.close(key);

    const loggerStore = useLoggerStore();
    notification.error({
      message: 'Download Failed',
      description: () =>
        h(Fragment, null, [
          h(
            'p',
            'An error occurred during download. Check the logs for more details.',
          ),
          h(
            Button,
            {
              type: 'primary',
              size: 'small',
              class: 'mt-2',
              onClick: () => loggerStore.toggleLogViewer(true),
            },
            () => 'View Logs',
          ),
        ]),
      placement: 'bottomRight',
    });
  } finally {
    // Dọn dẹp listener và trạng thái bất kể thành công hay thất bại.
    cleanup();
  }
};

function updateProgressNotification(
  key: string,
  percent: number,
  title: null | string,
) {
  notification.open({
    key,
    message: title ? `Downloading: ${title}` : 'Starting download...',
    description: () =>
      h('div', [
        h(Progress, { percent: Math.round(percent), status: 'active' }),
      ]),
    duration: 0,
    placement: 'bottomRight',
  });
}

function handleDownloadComplete({
  key,
  filePath,
  title,
}: DownloadCompletePayload) {
  if (activeDownloadUrl.value === key) {
    notification.close(key);
    notification.success({
      message: `Download successful: ${title}`,
      description: `Video saved at: ${filePath}`,
      placement: 'bottomRight',
    });
    formRef.value?.resetFields();
  }
}
</script>

<template>
  <div class="m-4">
    <Card size="small" title="YouTube Downloader">
      <Form
        ref="formRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
        @finish="onFinish"
      >
        <Form.Item label="YouTube Video URL" name="youtubeUrl">
          <Input
            v-model:value="formState.youtubeUrl"
            placeholder="https://www.youtube.com/watch?v=..."
            @blur="handleUrlBlur"
          >
            <template #suffix>
              <LoadingOutlined v-if="fetchingFormats" spin />
            </template>
          </Input>
        </Form.Item>

        <Form.Item v-if="availableFormats.length > 0" label="Video Quality">
          <Select
            v-model:value="formState.selectedFormat"
            placeholder="Select quality (default is best)"
            :loading="fetchingFormats"
            allow-clear
          >
            <Select.Option
              v-for="format in availableFormats"
              :key="format.format_id"
              :value="format.format_id"
            >
              {{ format.label }}
            </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Checkbox v-model:checked="formState.isAudioOnly">
            Audio only (MP3)
          </Checkbox>
        </Form.Item>

        <Form.Item label="Save Location" name="outputPath">
          <Input
            v-model:value="formState.outputPath"
            placeholder="Select a folder to save the video"
            readonly
          >
            <template #addonAfter>
              <Button size="small" type="link" @click="handleSelectOutput">
                Browse...
              </Button>
            </template>
          </Input>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            html-type="submit"
            :loading="loading"
            block
            size="large"
          >
            <template #icon>
              <SendOutlined />
            </template>
            Start Download
          </Button>
        </Form.Item>
      </Form>
    </Card>
  </div>
</template>
