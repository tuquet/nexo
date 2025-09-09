<script setup lang="ts">
import type { FormInstance } from 'ant-design-vue';
import type { Rule } from 'ant-design-vue/es/form';

import { h, reactive, ref } from 'vue';

import { SendOutlined } from '@ant-design/icons-vue';
import {
  Alert,
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

const rules: Record<string, Rule[]> = {
  videoPath: [{ required: true, message: 'Please select a video path!' }],
  outputPath: [{ required: true, message: 'Please select an output path!' }],
  segmentDuration: [
    {
      required: true,
      type: 'number',
      min: 1,
      message:
        'Please enter the segment duration in seconds (must be greater than 0)!',
    },
  ],
};

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
  const progressMessage = ref('Preparing to cut video...');

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
    message: 'Processing video...',
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
      message: 'Complete',
      description: `Video has been successfully cut and saved in the "${formState.outputPath}" folder.`,
      placement: 'bottomRight',
    });
    formRef.value?.resetFields();
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    notification.error({
      message: 'Processing Failed',
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
  <div class="m-4">
    <Card size="small" title="Video Cutter">
      <div>
        <Alert
          type="info"
          show-icon
          class="mb-5"
          message="How to Cut Video"
          description="Select video > Select save location > Enter the duration for each segment in seconds. The cut videos will be saved directly in the selected location. Example: for a 10-second video, cutting every 2 seconds will result in 5 smaller videos."
          closable
        />
        <Form
          ref="formRef"
          :model="formState"
          :rules="rules"
          layout="vertical"
          @finish="onFinish"
        >
          <Form.Item label="Video Path" name="videoPath">
            <Input
              v-model:value="formState.videoPath"
              placeholder="Select the video file to cut"
              readonly
            >
              <template #addonAfter>
                <Button size="small" type="link" @click="handleSelectVideo">
                  Browse...
                </Button>
              </template>
            </Input>
          </Form.Item>

          <Form.Item label="Save Location" name="outputPath">
            <Input
              v-model:value="formState.outputPath"
              placeholder="Select the folder to save the cut videos"
              readonly
            >
              <template #addonAfter>
                <Button size="small" type="link" @click="handleSelectOutput">
                  Browse...
                </Button>
              </template>
            </Input>
          </Form.Item>

          <Form.Item label="Seconds per segment" name="segmentDuration">
            <InputNumber
              v-model:value="formState.segmentDuration"
              placeholder="Example: 10"
              class="w-full"
              :min="1"
              addon-after="seconds"
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
              Start Cutting
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Card>
  </div>
</template>

<style scoped></style>
