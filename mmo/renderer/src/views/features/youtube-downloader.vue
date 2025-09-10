<script setup lang="ts">
import type { FormInstance, Rule } from 'ant-design-vue/es/form';

import { computed, Fragment, h, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

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

const rules = computed((): Record<string, Rule[]> => {
  return {
    youtubeUrl: [
      {
        required: true,
        message: $t('page.youtubeDownloader.youtubeUrl.ruleRequired'),
      },
      {
        type: 'url',
        message: $t('page.youtubeDownloader.youtubeUrl.ruleInvalid'),
      },
    ],
    outputPath: [
      { required: true, message: $t('page.youtubeDownloader.outputPath.rule') },
    ],
  };
});

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
      message.error(
        $t('page.youtubeDownloader.notifications.fetchError', {
          error: errorMessage,
        }),
      );
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
      message.info(
        $t('page.youtubeDownloader.notifications.started', { title, key }),
      );
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
    message: $t('page.youtubeDownloader.notifications.preparing'),
    description: () =>
      h('div', [
        h(Progress, { percent: 0, status: 'active' }),
        h(
          'p',
          { style: { marginTop: '8px' } },
          $t('page.youtubeDownloader.notifications.fetching'),
        ),
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
      message: $t('page.youtubeDownloader.notifications.failed'),
      description: () =>
        h(Fragment, null, [
          h('p', $t('page.youtubeDownloader.notifications.failedDescription')),
          h(
            Button,
            {
              type: 'primary',
              size: 'small',
              class: 'mt-2',
              onClick: () => loggerStore.toggleLogViewer(true),
            },
            () => $t('page.youtubeDownloader.viewLogs'),
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
    message: title
      ? $t('page.youtubeDownloader.notifications.downloading', { title })
      : $t('page.youtubeDownloader.notifications.starting'),
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
      message: $t('page.youtubeDownloader.notifications.success', {
        title: title || '',
      }),
      description: $t(
        'page.youtubeDownloader.notifications.successDescription',
        { filePath },
      ),
      placement: 'bottomRight',
    });
    formRef.value?.resetFields();
  }
}
</script>

<template>
  <Page
    :title="$t('page.youtubeDownloader.title')"
    :description="$t('page.youtubeDownloader.description')"
  >
    <Card :title="$t('page.youtubeDownloader.cardTitle')">
      <Form
        ref="formRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
        @finish="onFinish"
      >
        <Form.Item
          :label="$t('page.youtubeDownloader.youtubeUrl.label')"
          name="youtubeUrl"
        >
          <Input
            v-model:value="formState.youtubeUrl"
            :placeholder="$t('page.youtubeDownloader.youtubeUrl.placeholder')"
            @blur="handleUrlBlur"
          >
            <template #suffix>
              <LoadingOutlined v-if="fetchingFormats" spin />
            </template>
          </Input>
        </Form.Item>

        <Form.Item
          v-if="availableFormats.length > 0"
          :label="$t('page.youtubeDownloader.quality.label')"
        >
          <Select
            v-model:value="formState.selectedFormat"
            :placeholder="$t('page.youtubeDownloader.quality.placeholder')"
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
            {{ $t('page.youtubeDownloader.audioOnly') }}
          </Checkbox>
        </Form.Item>

        <Form.Item
          :label="$t('page.youtubeDownloader.outputPath.label')"
          name="outputPath"
        >
          <Input
            v-model:value="formState.outputPath"
            :placeholder="$t('page.youtubeDownloader.outputPath.placeholder')"
            readonly
          >
            <template #addonAfter>
              <Button size="small" type="link" @click="handleSelectOutput">
                {{ $t('page.youtubeDownloader.browse') }}
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
            {{ $t('page.youtubeDownloader.startDownload') }}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  </Page>
</template>
