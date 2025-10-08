<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useI18n } from '@vben/locales';

import { useSupabaseAuthStore } from '#/store/auth-supabase';

/**
 * AuthCallback Component
 *
 * Centralized handler for all Supabase authentication callbacks:
 * - Magic Link authentication
 * - OAuth authentication (Facebook, Google, GitHub)
 * - Email confirmation callbacks
 *
 * This component handles both:
 * 1. Direct callbacks to /auth/callback with token in URL hash
 * 2. Redirected callbacks with token in redirect parameter
 */
defineOptions({ name: 'AuthCallback' });

const { t } = useI18n();
const authStore = useSupabaseAuthStore();
const router = useRouter();
const loading = ref(true);
const error = ref<null | string>(null);

onMounted(async () => {
  try {
    loading.value = true;

    // Clean URL hash immediately to prevent Vue Router warnings
    const originalHash = window.location.hash;
    const originalSearch = window.location.search;

    // Clear the URL hash to prevent router warnings about invalid selectors
    if (originalHash && originalHash.includes('access_token')) {
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.search,
      );
    }

    // Handle both URL hash and search params for Supabase callback
    const urlHash = originalHash;
    const urlParams = new URLSearchParams(originalSearch);

    // Check for errors first (expired tokens, etc.)
    if (urlHash.includes('error=')) {
      const hashParams = new URLSearchParams(urlHash.slice(1));
      const errorDescription = hashParams.get('error_description');
      const errorCode = hashParams.get('error_code');

      if (errorCode === 'otp_expired') {
        error.value = 'Reset link has expired. Please request a new one.';
      } else if (errorDescription) {
        error.value = decodeURIComponent(errorDescription.replaceAll('+', ' '));
      } else {
        error.value = 'Authentication link is invalid or has expired.';
      }

      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
      return;
    }

    // Check if there's an access token in URL hash (direct callback)
    let hasToken = false;
    if (urlHash && urlHash.includes('access_token')) {
      hasToken = true;
    }

    // Check if there's an access token in redirect param (redirected callback)
    const redirectParam = urlParams.get('redirect');
    if (redirectParam && redirectParam.includes('access_token')) {
      hasToken = true;
    }

    if (hasToken) {
      // Check if this is a password reset callback (has type=recovery)
      const isPasswordReset =
        urlHash.includes('type=recovery') ||
        (redirectParam && redirectParam.includes('type=recovery'));

      if (isPasswordReset) {
        // Redirect to reset password page with the token
        const resetUrl = `/auth/reset-password${window.location.hash}`;
        await router.push(resetUrl);
        return;
      }

      // Get session after OAuth/Magic Link callback
      const session = await authStore.getCurrentSession();

      if (session) {
        // Integrate with VBen auth system
        const authResult = await authStore.authenticateWithVBen();

        if (authResult.success) {
          // Successful authentication - redirect to dashboard or intended route
          const redirectTo =
            urlParams.get('redirect') &&
            !urlParams.get('redirect')?.includes('access_token')
              ? decodeURIComponent(urlParams.get('redirect')!)
              : '/dashboard';
          await router.push(redirectTo);
        } else {
          error.value = authResult.error || 'Authentication failed';
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        }
      } else {
        error.value = t('authentication.noSessionFound');
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    } else {
      // No token found, redirect to login
      error.value = 'No authentication token found';
      setTimeout(() => {
        router.push('/auth/login');
      }, 1000);
    }
  } catch (error_: any) {
    console.error('Auth callback error:', error_);
    error.value = error_.message || 'Authentication failed';
    setTimeout(() => {
      router.push('/auth/login');
    }, 3000);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="flex h-screen items-center justify-center">
    <div class="text-center">
      <div v-if="loading" class="mb-4">
        <div
          class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"
        ></div>
        <p class="mt-4 text-gray-600">Processing authentication...</p>
      </div>

      <div v-else-if="error" class="text-red-600">
        <div class="mb-4">
          <svg
            class="mx-auto h-12 w-12 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 48 48"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 class="mb-2 text-lg font-medium text-red-900">
          Authentication Failed
        </h3>
        <p class="text-sm text-red-600">{{ error }}</p>
        <p class="mt-2 text-sm text-gray-500">Redirecting to login...</p>
      </div>

      <div v-else class="text-green-600">
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
        <h3 class="mb-2 text-lg font-medium text-green-900">
          Authentication Successful
        </h3>
        <p class="text-sm text-green-600">Redirecting to dashboard...</p>
      </div>
    </div>
  </div>
</template>
