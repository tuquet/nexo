<script setup lang="ts">
import type { FormInstance } from 'ant-design-vue';
import type { Rule } from 'ant-design-vue/es/form';

import { computed, h, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { SendOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  notification,
  Progress,
} from 'ant-design-vue';

const formRef = ref<FormInstance>();
const loading = ref(false);

const formState = reactive({
  videoPath: '',
  outputPath: String.raw`C:\Users\Admin\Videos\youtube-download\cutter`,
  segmentDuration: 5,
});

const rules = computed((): Record<string, Rule[]> => {
  return {
    videoPath: [
      { required: true, message: $t('page.videoCutter.videoPath.rule') },
    ],
    outputPath: [
      { required: true, message: $t('page.videoCutter.outputPath.rule') },
    ],
    segmentDuration: [
      {
        required: true,
        type: 'number',
        min: 1,
        message: $t('page.videoCutter.segmentDuration.rule'),
      },
    ],
  };
});

const handleSelectVideo = async () => {
  // Gọi IPC để mở hộp thoại chọn file từ tiến trình chính
  const path = await window.electron.ipcRenderer.invoke('dialog:openFile');
  if (path) {
    formState.videoPath = path;
    formRef.value?.validateFields('videoPath');
  }
};

const handleSelectOutput = async () => {
  // Gọi IPC để mở hộp thoại chọn thư mục từ tiến trình chính
  const path = await window.electron.ipcRenderer.invoke('dialog:openDirectory');
  if (path) {
    formState.outputPath = path;
    formRef.value?.validateFields('outputPath');
  }
};

const onFinish = async () => {
  loading.value = true;
  const key = `progress-${Date.now()}`;
  const progress = ref(0);
  const progressMessage = ref($t('page.videoCutter.notifications.preparing'));

  // Lắng nghe sự kiện cập nhật tiến trình từ main process
  const unlistenProgress = window.electron.ipcRenderer.on(
    'video-cutter:progress',
    (
      _event: any,
      { percent, message: msg }: { message: string; percent: number },
    ) => {
      progress.value = percent;
      progressMessage.value = msg;
    },
  );

  // Mở thông báo một lần, nó sẽ tự cập nhật nhờ vào reactivity của Vue
  notification.open({
    key,
    message: $t('page.videoCutter.notifications.processing'),
    description: () =>
      h('div', [
        h(Progress, { percent: progress.value, status: 'active' }),
        h('p', { style: { marginTop: '8px' } }, progressMessage.value),
      ]),
    duration: 0,
    placement: 'bottomRight',
  });

  try {
    await window.electron.ipcRenderer.invoke('video:cut', {
      videoPath: formState.videoPath,
      outputPath: formState.outputPath,
      segmentDuration: formState.segmentDuration,
    });

    notification.success({
      message: $t('page.videoCutter.notifications.complete'),
      description: $t('page.videoCutter.notifications.completeDescription', {
        path: formState.outputPath,
      }),
      placement: 'bottomRight',
    });
    formRef.value?.resetFields();
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : $t('page.videoCutter.notifications.unknownError');
    notification.error({
      message: $t('page.videoCutter.notifications.failed'),
      description: errorMessage,
      placement: 'bottomRight',
    });
  } finally {
    loading.value = false;
    notification.close(key);
    unlistenProgress(); // Dọn dẹp listener
  }
};
</script>

<template>
  <Page
    :title="$t('page.videoCutter.title')"
    :description="$t('page.videoCutter.description')"
  >
    <Card :title="$t('page.videoCutter.cardTitle')">
      <Form
        ref="formRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
        @finish="onFinish"
      >
        <Form.Item
          :label="$t('page.videoCutter.videoPath.label')"
          name="videoPath"
        >
          <Input
            v-model:value="formState.videoPath"
            :placeholder="$t('page.videoCutter.videoPath.placeholder')"
            readonly
          >
            <template #addonAfter>
              <Button size="small" type="link" @click="handleSelectVideo">
                {{ $t('page.videoCutter.browse') }}
              </Button>
            </template>
          </Input>
        </Form.Item>

        <Form.Item
          :label="$t('page.videoCutter.outputPath.label')"
          name="outputPath"
        >
          <Input
            v-model:value="formState.outputPath"
            :placeholder="$t('page.videoCutter.outputPath.placeholder')"
            readonly
          >
            <template #addonAfter>
              <Button size="small" type="link" @click="handleSelectOutput">
                {{ $t('page.videoCutter.browse') }}
              </Button>
            </template>
          </Input>
        </Form.Item>

        <Form.Item
          :label="$t('page.videoCutter.segmentDuration.label')"
          name="segmentDuration"
        >
          <InputNumber
            v-model:value="formState.segmentDuration"
            :placeholder="$t('page.videoCutter.segmentDuration.placeholder')"
            class="w-full"
            :min="1"
            :addon-after="$t('page.videoCutter.segmentDuration.addon')"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            html-type="submit"
            :loading="loading"
            size="large"
            block
          >
            <template #icon>
              <SendOutlined />
            </template>
            {{ $t('page.videoCutter.startCutting') }}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  </Page>
</template>

<style scoped></style>
