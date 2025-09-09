<script setup lang="ts">
import type { LogEntry } from '#/store/logger';

import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { CloseOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Checkbox,
  Drawer,
  List,
  ListItem,
  Space,
} from 'ant-design-vue';
import { storeToRefs } from 'pinia';

import { useLoggerStore } from '#/store';

const loggerStore = useLoggerStore();
const { logs } = storeToRefs(loggerStore);
const logContainer = ref<HTMLElement | null>(null);
const isAutoScrollEnabled = ref(true);
const logViewerHeight = 300;

const getLevelColor = (level: LogEntry['level']) => {
  switch (level) {
    case 'debug': {
      return 'text-gray-500';
    }
    case 'error': {
      return 'text-red-500';
    }
    case 'info': {
      return 'text-blue-400';
    }
    case 'warn': {
      return 'text-yellow-500';
    }
    default: {
      return 'text-gray-300';
    }
  }
};

watch(
  logs,
  async () => {
    if (isAutoScrollEnabled.value) {
      await nextTick();
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight;
      }
    }
  },
  { deep: true },
);

const handleScroll = () => {
  if (logContainer.value) {
    const { scrollTop, scrollHeight, clientHeight } = logContainer.value;
    isAutoScrollEnabled.value = scrollTop + clientHeight >= scrollHeight - 20;
  }
};

let removeLogListener: (() => void) | undefined;

onMounted(() => {
  // Thiết lập listener cho log ở cấp component để đảm bảo log được thu thập
  // ngay cả khi LogViewer không hiển thị. Log sẽ được lưu trong store.
  if (window.electron?.ipcRenderer) {
    removeLogListener = window.electron.ipcRenderer.on(
      'app-log',
      (_event: any, logEntry: LogEntry) => {
        loggerStore.addLog(logEntry);
      },
    );
  } else {
    // Fallback cho môi trường không phải Electron hoặc khi preload thất bại
    console.warn(
      'window.electron.ipcRenderer is not available. Cannot receive logs from main process.',
    );
    loggerStore.addLog({
      level: 'warn',
      message:
        'window.electron.ipcRenderer is not available. Cannot receive logs from main process.',
      date: new Date(),
    });
  }
});

onUnmounted(() => {
  removeLogListener?.();
});
</script>

<template>
  <!-- Drawer để hiển thị LogViewer, có thể thò ra thụt vào -->
  <Drawer
    v-model:open="loggerStore.logViewerVisible"
    placement="bottom"
    :height="logViewerHeight"
    :body-style="{ padding: 0 }"
    :mask="false"
    :destroy-on-close="true"
    :header-style="{ display: 'none' }"
  >
    <Card
      title="Application Logs"
      class="flex h-full flex-col"
      :body-style="{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }"
      :bordered="false"
      size="small"
    >
      <template #extra>
        <Space>
          <Checkbox v-model:checked="isAutoScrollEnabled">
            Auto-scroll
          </Checkbox>
          <Button
            type="primary"
            danger
            size="small"
            @click="loggerStore.clearLogs()"
          >
            Clear
          </Button>
          <Button
            shape="circle"
            size="small"
            title="Close"
            danger
            @click="loggerStore.toggleLogViewer(false)"
          >
            <template #icon><CloseOutlined /></template>
          </Button>
        </Space>
      </template>

      <div
        ref="logContainer"
        class="flex-1 overflow-y-auto font-mono text-xs"
        @scroll="handleScroll"
      >
        <List :data-source="logs" :split="false" item-layout="horizontal">
          <template #renderItem="{ item, index }">
            <ListItem :key="index" class="!p-1 font-mono text-xs">
              <div class="flex items-start gap-2">
                <span class="w-20 shrink-0 text-gray-500">{{
                  new Date(item.date).toLocaleTimeString()
                }}</span>
                <span
                  class="w-12 shrink-0 font-bold"
                  :class="getLevelColor(item.level)"
                >
                  [{{ item.level.toUpperCase() }}]
                </span>
                <pre class="whitespace-pre-wrap break-all text-gray-300">{{
                  item.message
                }}</pre>
              </div>
            </ListItem>
          </template>
        </List>
      </div>
    </Card>
  </Drawer>
</template>
