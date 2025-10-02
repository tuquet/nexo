<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

// import type { BasicOption } from '@vben/types';
import { computed } from 'vue';

import { AuthenticationLogin } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const formSchema = computed((): VbenFormSchema[] => {
  return [];
});

async function fakeLogin() {
  await authStore.authLogin({
    username: 'admin',
    password: '123456',
  });
}
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    @submit="fakeLogin"
    :show-code-login="false"
    :show-qrcode-login="false"
    :show-register="false"
    :show-forget-password="false"
    :show-remember-me="false"
    :show-third-party-login="false"
    :title="$t('page.auth.launch.title')"
    :sub-title="$t('page.auth.launch.subTitle')"
    :submit-button-text="$t('page.auth.launch.getStarted')"
  />
</template>
