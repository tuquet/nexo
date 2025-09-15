import { ref } from 'vue';

import { defineStore } from 'pinia';

import { ipc } from '#/api/ipc';

interface Message {
  content: string;
  role: 'assistant' | 'error' | 'user';
}

export const useChatStore = defineStore('chat-assistant', () => {
  const messages = ref<Message[]>([]);
  const isLoading = ref(false);

  async function sendMessage(prompt: string) {
    if (!prompt || isLoading.value) return;

    messages.value.push({ role: 'user', content: prompt });
    isLoading.value = true;

    try {
      const result = await ipc.invoke<{ content: string; error?: string }>(
        'chatgpt:generate',
        prompt,
      );

      if (result.error) {
        messages.value.push({ role: 'error', content: result.error });
      } else {
        messages.value.push({ role: 'assistant', content: result.content });
      }
    } catch (error: any) {
      messages.value.push({
        role: 'error',
        content: error.message || 'An unknown error occurred.',
      });
    } finally {
      isLoading.value = false;
    }
  }

  return {
    messages,
    isLoading,
    sendMessage,
  };
});
