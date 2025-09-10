<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

import { CloseOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Checkbox,
  CheckboxGroup,
  Drawer,
  Empty,
  List,
  ListItem,
  Space,
} from 'ant-design-vue';
import { storeToRefs } from 'pinia';

import { ALL_LOG_LEVELS, useLoggerStore } from '#/store';

const loggerStore = useLoggerStore();
// Sử dụng filteredLogs để hiển thị và selectedLevels để điều khiển bộ lọc
const { filteredLogs, selectedLevels } = storeToRefs(loggerStore);
const logContainer = ref<HTMLElement | null>(null);
const isAutoScrollEnabled = ref(true);
const logViewerHeight = 300;

const getLevelColor = (level: any) => {
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
  // Theo dõi danh sách log đã được lọc để tự động cuộn
  filteredLogs,
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
          <!-- Bộ lọc theo cấp độ log -->
          <CheckboxGroup
            :value="selectedLevels"
            :options="ALL_LOG_LEVELS"
            @update:value="loggerStore.updateSelectedLevels"
          />
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
        <List
          v-if="filteredLogs.length > 0"
          :data-source="filteredLogs"
          :split="false"
          item-layout="horizontal"
        >
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
        <!-- Hiển thị thông báo khi không có log nào khớp với bộ lọc -->
        <div v-else class="flex h-full items-center justify-center">
          <Empty description="Không có log nào để hiển thị." />
        </div>
      </div>
    </Card>
  </Drawer>
</template>
