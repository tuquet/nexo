<script setup lang="ts">
import type { FormInstance } from 'ant-design-vue';
import type { Rule } from 'ant-design-vue/es/form';

import { computed, h, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { SendOutlined } from '@ant-design/icons-vue';
import { useStorage } from '@vueuse/core';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  notification,
  Progress,
} from 'ant-design-vue';

import { useBinaryManager } from '#/composables/useBinaryManager';

const {
  binaryManagerState,
  ensureBinaries,
  BinaryManagerModal,
  binaryManagerModalApi,
} = useBinaryManager();

const formRef = ref<FormInstance>();
const loading = ref(false);

// Computed property to disable the form while binaries are not ready
const isFormDisabled = computed(
  () => loading.value || !binaryManagerState.isReady,
);

const defaultFormState = {
  videoPath: '',
  outputPath: '',
  segmentDuration: 5,
};

const formState = useStorage('video-cutter-form-state', {
  ...defaultFormState,
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
  const path = await window.electron.ipcRenderer.invoke('dialog:select-file');
  if (path) {
    formState.value.videoPath = path;
    formRef.value?.validateFields('videoPath');
  }
};

const handleSelectOutput = async () => {
  // Gọi IPC để mở hộp thoại chọn thư mục từ tiến trình chính
  const path = await window.electron.ipcRenderer.invoke(
    'dialog:select-directory',
  );
  if (path) {
    formState.value.outputPath = path;
    formRef.value?.validateFields('outputPath');
  }
};

onMounted(() => {
  // Kích hoạt kiểm tra công cụ khi component được mount.
  // Composable sẽ xử lý modal và cập nhật trạng thái.
  ensureBinaries(['ffmpeg', 'ffprobe']);
});

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
  });

  try {
    await window.electron.ipcRenderer.invoke('video:cut', {
      videoPath: formState.value.videoPath,
      outputPath: formState.value.outputPath,
      segmentDuration: formState.value.segmentDuration,
    });

    // Cập nhật thông báo hiện tại thành trạng thái thành công và tự động đóng
    notification.success({
      key,
      message: $t('page.videoCutter.notifications.complete'),
      description: $t('page.videoCutter.notifications.completeDescription', {
        path: formState.value.outputPath,
      }),
      btn: () =>
        h(
          Button,
          {
            type: 'primary',
            size: 'small',
            onClick: () => {
              // Mở thư mục chứa các file đã cắt
              window.electron.ipcRenderer.send(
                'shell:open-path',
                formState.value.outputPath,
              );
            },
          },
          // Tái sử dụng key dịch thuật từ màn hình video-downloader
          () => $t('page.videoDownloader.notifications.openFolder'),
        ),
      duration: 10, // Cho người dùng 10 giây để nhấn nút trước khi tự đóng
    });
    formState.value = { ...defaultFormState };
    formRef.value?.clearValidate();
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : $t('page.videoCutter.notifications.unknownError');
    // Cập nhật thông báo hiện tại thành trạng thái lỗi và giữ nó lại
    notification.error({
      key,
      message: $t('page.videoCutter.notifications.failed'),
      description: errorMessage,
      duration: 0, // Giữ thông báo lỗi cho đến khi người dùng tự đóng
    });
  } finally {
    loading.value = false;
    unlistenProgress(); // Dọn dẹp listener
  }
};
</script>

<template>
  <Page
    :title="$t('page.videoCutter.title')"
    :description="$t('page.videoCutter.description')"
  >
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
    <Card :title="$t('page.videoCutter.cardTitle')">
      <Form
        ref="formRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
        :disabled="isFormDisabled"
        @finish="onFinish"
      >
        <Form.Item
          :label="$t('page.videoCutter.videoPath.label')"
          name="videoPath"
        >
          <Input.Search
            v-model:value="formState.videoPath"
            :placeholder="$t('page.videoCutter.videoPath.placeholder')"
            :enter-button="$t('page.videoCutter.browse')"
            readonly
            @search="handleSelectVideo"
          />
        </Form.Item>

        <Form.Item
          :label="$t('page.videoCutter.outputPath.label')"
          name="outputPath"
        >
          <Input.Search
            v-model:value="formState.outputPath"
            :placeholder="$t('page.videoCutter.outputPath.placeholder')"
            :enter-button="$t('page.videoCutter.browse')"
            readonly
            @search="handleSelectOutput"
          />
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
