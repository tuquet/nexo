<script setup lang="ts">
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import { h, onUnmounted, reactive, ref } from 'vue';

import { SendOutlined } from '@ant-design/icons-vue';
import {
  Alert,
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

  try {
    await window.electron.ipcRenderer.invoke('youtube:download-video', {
      videoUrl: values.youtubeUrl,
      outputPath: values.outputPath,
      formatCode: formState.selectedFormat,
      isAudioOnly: formState.isAudioOnly,
    });
  } catch (error: unknown) {
    notification.close(key);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    notification.error({
      message: 'Download Failed',
      description: errorMessage,
      placement: 'bottomRight',
    });
    if (activeDownloadUrl.value === key) {
      activeDownloadUrl.value = null;
    }
    loading.value = false;
  }
};

// Listen for when the download has a title and can start showing progress
const unlistenStarted = window.electron.ipcRenderer.on(
  'youtube:download-started',
  (_event: any, { key, title }: DownloadStartedPayload) => {
    // The 'youtube:download-progress' event will handle the notification update
    // once we have a title. This listener is now mainly for logging or future use.
    message.info(`Download started for: ${title} (${key})`);
  },
);

// Listen for progress updates
const unlistenProgress = window.electron.ipcRenderer.on(
  'youtube:download-progress',
  (_event: any, { key, percent, title }: DownloadProgressPayload) => {
    if (activeDownloadUrl.value === key) {
      notification.open({
        key,
        message: title ? `Downloading: ${title}` : 'Starting download...',
        description: () =>
          h('div', [
            // Use a standard percentage-based progress bar
            h(Progress, { percent: Math.round(percent), status: 'active' }),
          ]),
        duration: 0,
        placement: 'bottomRight',
      });
    }
  },
);

// Listen for completion
const unlistenComplete = window.electron.ipcRenderer.on(
  'youtube:download-complete',
  (_event: any, { key, filePath, title }: DownloadCompletePayload) => {
    if (activeDownloadUrl.value === key) {
      notification.close(key);
      notification.success({
        message: `Download successful: ${title}`,
        description: `Video saved at: ${filePath}`,
        placement: 'bottomRight',
      });
      loading.value = false;
      formRef.value?.resetFields();
      activeDownloadUrl.value = null;
    }
  },
);

onUnmounted(() => {
  unlistenStarted();
  unlistenProgress();
  unlistenComplete();
});
</script>

<template>
  <div class="mx-auto max-w-4xl p-5">
    <Card title="YouTube Downloader">
      <div>
        <Alert
          type="info"
          show-icon
          class="mb-5"
          message="How to Download"
          description="Paste the YouTube video URL into the field below and choose a save location to start downloading."
          closable
        />
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
            />
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
      </div>
    </Card>
  </div>
</template>
