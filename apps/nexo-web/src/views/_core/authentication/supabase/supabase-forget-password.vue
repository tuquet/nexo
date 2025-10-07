<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, ref } from 'vue';

import { AuthenticationForgetPassword, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useSupabaseAuthStore } from '#/store/auth-supabase';

defineOptions({ name: 'SupabaseForgetPassword' });

const authStore = useSupabaseAuthStore();
const loading = ref(false);
const success = ref(false);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.email') || 'Email',
        type: 'email',
        autocomplete: 'username',
      },
      fieldName: 'email',
      label: $t('authentication.email') || 'Email',
      rules: z
        .string()
        .min(1, { message: $t('authentication.emailRequired') })
        .email($t('authentication.validEmailRequired')),
    },
  ];
});

async function handleSubmit(values: Record<string, any>) {
  loading.value = true;

  // Add minimum loading duration for better UX
  const startTime = Date.now();
  const minLoadingDuration = 800; // 800ms minimum loading time

  try {
    const result = await authStore.resetPassword(values.email);

    if (result.success) {
      success.value = true;
      // Show success message
    } else {
      console.error('Password reset failed:', result.error);
      // Show error message to user
    }
  } catch (error) {
    console.error('Password reset error:', error);
  } finally {
    // Ensure minimum loading duration for smooth UX
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, minLoadingDuration - elapsedTime);

    if (remainingTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingTime));
    }

    loading.value = false;
  }
}
</script>

<template>
  <div class="w-full">
    <div v-if="success" class="text-center">
      <div class="mb-4">
        <svg
          class="mx-auto h-12 w-12 text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 48 48"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 class="mb-2 text-lg font-medium text-gray-900">
        {{ $t('authentication.resetEmailSent') || 'Reset email sent!' }}
      </h3>
      <p class="text-sm text-gray-500">
        {{
          $t('authentication.checkEmailForResetLink') ||
          'Please check your email for a password reset link.'
        }}
      </p>
      <div class="mt-6">
        <router-link
          to="/auth/login"
          class="bg-primary hover:bg-primary/90 inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm"
        >
          {{ $t('authentication.backToLogin') || 'Back to Login' }}
        </router-link>
      </div>
    </div>

    <div v-else>
      <AuthenticationForgetPassword
        :form-schema="formSchema"
        :loading="loading"
        @submit="handleSubmit"
      />
    </div>
  </div>
</template>
