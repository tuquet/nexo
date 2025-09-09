<script setup lang="ts">
import type { LogEntry } from '#/store/ui';

import { nextTick, ref, watch } from 'vue';

import { CloseOutlined } from '@ant-design/icons-vue';
import { Button, Card, Checkbox, List, ListItem, Space } from 'ant-design-vue';
import { storeToRefs } from 'pinia';

import { useUiStore } from '#/store/ui';

const uiStore = useUiStore();
const { logs } = storeToRefs(uiStore);
const logContainer = ref<HTMLElement | null>(null);
const isAutoScrollEnabled = ref(true);

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
</script>

<template>
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
        <Checkbox v-model:checked="isAutoScrollEnabled">Auto-scroll</Checkbox>
        <Button type="primary" danger size="small" @click="uiStore.clearLogs()">
          Clear
        </Button>
        <Button
          shape="circle"
          size="small"
          title="Close"
          danger
          @click="uiStore.toggleLogViewer(false)"
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
</template>
