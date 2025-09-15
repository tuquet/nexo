<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

import { Button, Card, Input, Spin } from 'ant-design-vue';
import { storeToRefs } from 'pinia';

import { useChatStore } from '#/store/chat';

const chatStore = useChatStore();
const { messages, isLoading } = storeToRefs(chatStore);
const { sendMessage } = chatStore;

const prompt = ref('');
const chatContainer = ref<HTMLElement | null>(null);

async function handleSend() {
  if (prompt.value.trim()) {
    await sendMessage(prompt.value);
    prompt.value = '';
  }
}

watch(
  messages,
  async () => {
    await nextTick();
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  },
  { deep: true },
);
</script>

<template>
  <Card title="AI Assistant" :bordered="false">
    <div
      ref="chatContainer"
      class="mb-4 h-64 overflow-y-auto rounded border border-gray-300 p-4 dark:border-gray-600"
    >
      <div v-for="(message, index) in messages" :key="index" class="mb-2">
        <div
          :class="{
            'text-right': message.role === 'user',
            'text-left': message.role !== 'user',
          }"
        >
          <span
            class="inline-block rounded-lg px-3 py-2"
            :class="{
              'bg-blue-500 text-white': message.role === 'user',
              'bg-gray-200 dark:bg-gray-700': message.role === 'assistant',
              'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200':
                message.role === 'error',
            }"
          >
            {{ message.content }}
          </span>
        </div>
      </div>
      <div v-if="isLoading" class="text-center">
        <Spin />
      </div>
    </div>
    <div class="flex gap-2">
      <Input.TextArea
        v-model:value="prompt"
        placeholder="Ask something..."
        :auto-size="{ minRows: 1, maxRows: 3 }"
        @press-enter.prevent="handleSend"
      />
      <Button type="primary" :loading="isLoading" @click="handleSend">
        Send
      </Button>
    </div>
  </Card>
</template>
