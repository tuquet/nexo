<script setup lang="ts" name="BinaryManagerModal">
import { onMounted, onUnmounted, reactive } from 'vue';

import { $t } from '@vben/locales';

import { Button, Modal, Progress } from 'ant-design-vue';

const { ipcRenderer } = window.electron;

// Trạng thái của modal
const binaryStatus = reactive({
  visible: false,
  message: '',
  percent: 0,
  status: 'idle', // idle, verifying, downloading, error, complete
});

// Hàm xử lý sự kiện IPC từ tiến trình Main
const handleBinaryStatus = (
  _event: any,
  payload: { args?: any; key: string; percent?: number; status: string },
) => {
  const { status, key, args, percent } = payload;
  binaryStatus.status = status;
  // Sử dụng $t để lấy chuỗi dịch thuật. Backend sẽ gửi key đầy đủ, ví dụ: 'page.binaryManager.status.downloading'
  binaryStatus.message = $t(key, args || {});
  binaryStatus.percent = percent || 0;

  // Chỉ hiển thị modal khi thực sự cần tải xuống hoặc có lỗi
  if (status === 'downloading' || status === 'error') {
    binaryStatus.visible = true;
  }

  // Ẩn modal sau một khoảng trễ khi hoàn tất
  if (status === 'complete') {
    setTimeout(() => {
      if (binaryStatus.status === 'complete') {
        binaryStatus.visible = false;
        binaryStatus.status = 'idle';
      }
    }, 2000); // Hiển thị thông báo "hoàn thành" trong 2 giây
  }
};

// Đăng ký và hủy đăng ký listener
onMounted(() => {
  ipcRenderer.on('binary-manager:status', handleBinaryStatus);
});

onUnmounted(() => {
  ipcRenderer.removeAllListeners('binary-manager:status');
});

// Hàm để đóng modal khi có lỗi
const handleCloseOnError = () => {
  binaryStatus.visible = false;
  binaryStatus.status = 'idle';
};
</script>

<template>
  <Modal
    v-model:open="binaryStatus.visible"
    :title="$t('page.binaryManager.preparing')"
    :closable="true"
    :mask-closable="false"
    :footer="null"
    centered
  >
    <div class="text-center">
      <p>{{ binaryStatus.message }}</p>

      <!-- Thanh tiến trình khi đang tải -->
      <Progress
        class="mt-4"
        v-if="binaryStatus.status === 'downloading'"
        :percent="binaryStatus.percent"
        status="active"
      />

      <!-- Nút OK khi có lỗi -->
      <Button
        v-if="binaryStatus.status === 'error'"
        type="primary"
        danger
        @click="handleCloseOnError"
        class="mt-4"
      >
        {{ $t('page.common.ok') }}
      </Button>
    </div>
  </Modal>
</template>

<style scoped></style>
