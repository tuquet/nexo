import { ref } from 'vue';

import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';
import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', () => {
  const apiKeys = ref({
    openAI: '',
    gemini: '',
  });

  const loading = ref({
    openAI: true,
    gemini: true,
  });

  /**
   * Lấy tất cả API key từ tiến trình Main và cập nhật vào store.
   */
  async function fetchApiKeys() {
    loading.value.openAI = true;
    loading.value.gemini = true;
    try {
      const [savedOpenAIKey, savedGeminiKey] = await Promise.all([
        window.electron.ipcRenderer.invoke(
          'settings:get',
          'userApiKeys.openAI',
        ),
        window.electron.ipcRenderer.invoke(
          'settings:get',
          'userApiKeys.gemini',
        ),
      ]);

      apiKeys.value.openAI = savedOpenAIKey || '';
      apiKeys.value.gemini = savedGeminiKey || '';
    } catch (error) {
      console.error('Failed to load API keys:', error);
      message.error('Could not load settings.');
    } finally {
      loading.value.openAI = false;
      loading.value.gemini = false;
    }
  }

  /**
   * Lưu các API key hiện tại từ store vào tiến trình Main.
   */
  function saveApiKeys() {
    window.electron.ipcRenderer.send('settings:set', {
      key: 'userApiKeys.openAI',
      value: apiKeys.value.openAI,
    });

    window.electron.ipcRenderer.send('settings:set', {
      key: 'userApiKeys.gemini',
      value: apiKeys.value.gemini,
    });

    message.success($t('page.settings.saveSuccess'));
  }

  /**
   * Lấy lại một key cụ thể khi nhận được thông báo từ tiến trình Main.
   * @param key - Key đã được cập nhật, ví dụ: 'userApiKeys.openAI'
   */
  async function fetchSingleApiKey(key: string) {
    const keyParts = key.split('.');
    if (keyParts[0] !== 'userApiKeys' || keyParts.length < 2) return;

    const apiKeyName = keyParts[1] as keyof typeof apiKeys.value;
    if (!(apiKeyName in apiKeys.value)) return;

    try {
      const savedValue = await window.electron.ipcRenderer.invoke(
        'settings:get',
        key,
      );
      apiKeys.value[apiKeyName] = savedValue || '';
    } catch (error) {
      console.error(`Failed to fetch updated key ${key}:`, error);
    }
  }

  return { apiKeys, loading, fetchApiKeys, saveApiKeys, fetchSingleApiKey };
});
