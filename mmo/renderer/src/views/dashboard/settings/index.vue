<script lang="ts" setup>
import { onMounted } from 'vue';

import { $t } from '@vben/locales';

import { Button, Card, Form, Input } from 'ant-design-vue';
import { storeToRefs } from 'pinia';

import { useSettingsStore } from '#/store/settings';

const settingsStore = useSettingsStore();
// Sử dụng storeToRefs để giữ tính phản ứng (reactivity) cho state
const { apiKeys, loading } = storeToRefs(settingsStore);

// Khi component được mount, gọi IPC để lấy API key đã lưu
onMounted(async () => {
  // Logic lấy dữ liệu đã được chuyển vào trong store action
  await settingsStore.fetchApiKeys();
});

// Hàm được gọi khi người dùng nhấn nút "Lưu"
function handleSaveSettings() {
  // Logic lưu dữ liệu đã được chuyển vào trong store action
  settingsStore.saveApiKeys();
}
</script>

<template>
  <div class="p-5">
    <Card :title="$t('page.settings.title')">
      <Form
        :model="apiKeys"
        layout="vertical"
        @finish="handleSaveSettings"
        class="max-w-xl"
      >
        <Form.Item
          :label="$t('page.settings.apiKeys.openAI.label')"
          name="openAI"
        >
          <Input.Password
            v-model:value="apiKeys.openAI"
            :placeholder="$t('page.settings.apiKeys.openAI.placeholder')"
            :loading="loading.openAI"
          />
        </Form.Item>
        <Form.Item
          :label="$t('page.settings.apiKeys.gemini.label')"
          name="gemini"
        >
          <Input.Password
            v-model:value="apiKeys.gemini"
            :placeholder="$t('page.settings.apiKeys.gemini.placeholder')"
            :loading="loading.gemini"
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" html-type="submit">
            {{ $t('page.settings.saveButton') }}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  </div>
</template>
