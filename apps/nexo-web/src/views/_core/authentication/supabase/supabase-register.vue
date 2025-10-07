<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, ref } from 'vue';

import { AuthenticationRegister, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useSupabaseAuthStore } from '#/store/auth-supabase';

defineOptions({ name: 'SupabaseRegister' });

const authStore = useSupabaseAuthStore();
const loading = ref(false);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.fullName') || 'Full Name',
      },
      fieldName: 'fullName',
      label: $t('authentication.fullName') || 'Full Name',
      rules: z
        .string()
        .min(1, { message: $t('authentication.fullNameRequired') }),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.email') || 'Email',
        type: 'email',
      },
      fieldName: 'email',
      label: $t('authentication.email') || 'Email',
      rules: z
        .string()
        .min(1, { message: $t('authentication.emailRequired') })
        .email($t('authentication.validEmailRequired')),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z
        .string()
        .min(6, { message: $t('authentication.passwordLengthRequired') }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.confirmPassword') || 'Confirm Password',
      },
      fieldName: 'confirmPassword',
      label: $t('authentication.confirmPassword') || 'Confirm Password',
      rules: 'required|confirmed:password',
    },
  ];
});

async function handleSubmit(values: Record<string, any>) {
  loading.value = true;

  // Add minimum loading duration for better UX
  const startTime = Date.now();
  const minLoadingDuration = 800; // 800ms minimum loading time

  try {
    const result = await authStore.signUp(values.email, values.password, {
      full_name: values.fullName,
    });

    if (result.success) {
      // Show success message and redirect to login or verify email page
      // You might want to show a message about checking email for verification
    } else {
      console.error('Registration failed:', result.error);
      // Show error message to user
    }
  } catch (error) {
    console.error('Registration error:', error);
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

async function handleOAuthRegister(provider: 'facebook' | 'github' | 'google') {
  loading.value = true;

  // Add minimum loading duration for better UX
  const startTime = Date.now();
  const minLoadingDuration = 600; // 600ms for OAuth (typically faster)

  try {
    const result = await authStore.signInWithOAuth(provider);

    if (!result.success) {
      console.error('OAuth registration failed:', result.error);
    }
  } catch (error) {
    console.error('OAuth registration error:', error);
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
    <AuthenticationRegister
      :form-schema="formSchema"
      :loading="loading"
      @submit="handleSubmit"
    />

    <!-- OAuth Register Buttons -->
    <div class="mt-6 space-y-3">
      <div class="text-muted-foreground text-center text-sm">
        {{ $t('authentication.orRegisterWith') || 'Or register with' }}
      </div>

      <div class="grid grid-cols-3 gap-3">
        <button
          type="button"
          class="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
          @click="handleOAuthRegister('google')"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span class="sr-only">Google</span>
        </button>

        <button
          type="button"
          class="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
          @click="handleOAuthRegister('github')"
        >
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="sr-only">GitHub</span>
        </button>

        <button
          type="button"
          class="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm hover:bg-gray-50"
          @click="handleOAuthRegister('facebook')"
        >
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="sr-only">Facebook</span>
        </button>
      </div>
    </div>
  </div>
</template>
