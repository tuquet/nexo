<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { CarbonEmail, CarbonMagicWand, CarbonSecurity } from '@vben/icons';
import { $t } from '@vben/locales';

import { Alert, Button, notification } from 'ant-design-vue';

import { SupabaseAuthError } from '#/lib/supabase/auth';
import { useSupabaseAuthStore } from '#/store/auth-supabase';
import {
  extractRateLimitSeconds,
  formatRateLimitMessage,
} from '#/utils/supabase-errors';

import MagicLinkLogin from './magic-link-login.vue';

defineOptions({ name: 'SupabaseLogin' });

const authStore = useSupabaseAuthStore();
const router = useRouter();
const loading = ref(false);
const processingCallback = ref(false);
const mode = ref<'forgot' | 'login' | 'magic' | 'register'>('login');
const resetEmailSent = ref(false);
const hasShownLoginSuccess = ref(false); // Prevent duplicate login notifications

/**
 * Handle Supabase authentication errors with i18n support
 */
function handleSupabaseError(error: unknown) {
  console.error('Full error details:', error);

  if (error instanceof SupabaseAuthError) {
    let description = $t(error.i18nKey);

    // Handle rate limit errors with time information
    if (error.rateLimitSeconds) {
      description = formatRateLimitMessage(description, error.rateLimitSeconds);
    }

    notification.error({
      message: $t('authentication.operationFailed'),
      description,
      duration: error.rateLimitSeconds ? 10 : 5, // Longer duration for rate limits
    });
  } else if (error instanceof Error) {
    // Check if this is a rate limit error message that wasn't properly caught
    const rateLimitSeconds = extractRateLimitSeconds(error.message);

    if (rateLimitSeconds && error.message.includes('security purposes')) {
      // This is a rate limit error, use proper i18n
      const description = formatRateLimitMessage(
        $t('authentication.errors.over_email_send_rate_limit'),
        rateLimitSeconds,
      );

      notification.error({
        message: $t('authentication.operationFailed'),
        description,
        duration: 10,
      });
    } else {
      // Generic error fallback
      notification.error({
        message: $t('authentication.unexpectedError'),
        description:
          error.message || $t('authentication.unexpectedErrorDescription'),
        duration: 5,
      });
    }
  } else {
    notification.error({
      message: $t('authentication.unexpectedError'),
      description: $t('authentication.unexpectedErrorDescription'),
      duration: 5,
    });
  }
}

/**
 * Handle Magic Link callback if redirected to login page
 * This occurs when Supabase redirects back to login instead of callback
 */
onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const redirectParam = urlParams.get('redirect');

  // Check if this is a password reset callback with errors
  if (redirectParam && redirectParam.includes('reset-password')) {
    const decodedParam = decodeURIComponent(redirectParam);

    if (
      decodedParam.includes('error=access_denied') &&
      decodedParam.includes('error_code=otp_expired')
    ) {
      notification.error({
        message: $t('authentication.resetLinkExpired'),
        description: $t('authentication.resetLinkExpiredMessage'),
        duration: 6,
      });

      // Clean up URL and switch to forgot password mode
      await router.replace('/auth/login');
      mode.value = 'forgot';
      return;
    }
  }

  // Check if this is a Magic Link callback (has access_token in redirect param)
  if (redirectParam && redirectParam.includes('access_token')) {
    await handleMagicLinkCallback();
  }
});

/**
 * Process Magic Link authentication callback
 */
async function handleMagicLinkCallback() {
  processingCallback.value = true;
  loading.value = true;

  try {
    // Get session after Magic Link callback
    const session = await authStore.getCurrentSession();

    if (!session) {
      throw new Error($t('authentication.authenticationSessionNotFound'));
    }

    const authResult = await authStore.authenticateWithVBen();

    if (!authResult.success) {
      throw new Error(
        authResult.error || $t('authentication.authenticationFailed'),
      );
    }

    // Success - redirect to dashboard
    window.location.href = '/dashboard';
  } catch (error: any) {
    console.error('Magic Link callback error:', error);
    handleSupabaseError(error);

    // Reset URL to clean state
    await router.replace('/auth/login');
  } finally {
    processingCallback.value = false;
    loading.value = false;
  }
}

const formSchema = computed((): VbenFormSchema[] => {
  const baseFields = [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.email') || 'Enter your email',
        type: 'email',
        // Use 'username' for login mode to improve password manager compatibility
        autocomplete: mode.value === 'login' ? 'username' : 'email',
      },
      fieldName: 'email',
      label: $t('authentication.email'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.emailRequired') })
        .email($t('authentication.validEmailRequired')),
    },
  ];

  if (mode.value === 'forgot') {
    return baseFields;
  }

  return [
    ...baseFields,
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder:
          mode.value === 'register'
            ? $t('authentication.createPasswordPlaceholder')
            : $t('authentication.password'),
        autocomplete:
          mode.value === 'register' ? 'new-password' : 'current-password',
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules:
        mode.value === 'register'
          ? z
              .string()
              .min(6, { message: $t('authentication.passwordLengthRequired') })
          : z
              .string()
              .min(1, { message: $t('authentication.passwordRequired') }),
    },
  ];
});

const formTitle = computed(() => {
  switch (mode.value) {
    case 'forgot': {
      return $t('authentication.resetPasswordTitle');
    }
    case 'register': {
      return $t('authentication.createAccountTitle');
    }
    default: {
      return $t('page.auth.title') || $t('authentication.signInTitle');
    }
  }
});

const formSubTitle = computed(() => {
  switch (mode.value) {
    case 'forgot': {
      return (
        $t('authentication.forgotPasswordSubtitle') ||
        'Enter your email to receive reset instructions'
      );
    }
    case 'register': {
      return (
        $t('authentication.registerSubtitle') ||
        'Sign up with your email to get started'
      );
    }
    default: {
      return (
        $t('page.auth.subTitle') ||
        $t('authentication.loginSubtitle') ||
        'Welcome back! Please sign in to continue'
      );
    }
  }
});

const submitButtonText = computed(() => {
  if (loading.value) {
    switch (mode.value) {
      case 'forgot': {
        return $t('authentication.sendingResetEmail') || 'Sending...';
      }
      case 'register': {
        return $t('authentication.creatingAccount') || 'Creating Account...';
      }
      default: {
        return $t('authentication.signingIn') || 'Signing In...';
      }
    }
  }

  switch (mode.value) {
    case 'forgot': {
      return $t('authentication.sendResetEmail') || 'Send Reset Email';
    }
    case 'register': {
      return $t('authentication.createAccountTitle');
    }
    default: {
      return $t('authentication.signInTitle');
    }
  }
});

async function handleSubmit(values: Record<string, any>) {
  loading.value = true;

  // Add minimum loading duration for better UX
  const startTime = Date.now();
  const minLoadingDuration = 800; // 800ms minimum loading time

  try {
    let result: any;

    switch (mode.value) {
      case 'forgot': {
        result = await authStore.resetPassword(values.email);
        if (result.success) {
          resetEmailSent.value = true;
          notification.success({
            message: 'Password Reset Email Sent!',
            description:
              'Please check your email for password reset instructions.',
            duration: 5,
          });
          // Delay mode switch to allow user to see the notification and success state
          setTimeout(() => {
            resetEmailSent.value = false;
            mode.value = 'login';
          }, 2500); // 2.5 second delay for smooth transition
        }
        break;
      }
      case 'register': {
        result = await authStore.signUp(values.email, values.password);
        if (result.success) {
          // Show success message for email confirmation
          notification.success({
            message: $t('authentication.registrationSuccessful'),
            description: $t('authentication.checkEmailForConfirmation'),
            duration: 5,
          });
        }
        break;
      }
      default: {
        result = await authStore.signIn(values.email, values.password);

        if (result.success && result.userInfo && !hasShownLoginSuccess.value) {
          hasShownLoginSuccess.value = true;

          notification.success({
            message: $t('authentication.loginSuccess'),
            description: `${$t('authentication.loginSuccessDesc')}: ${result.userInfo.realName || result.userInfo.username}`,
            duration: 3,
          });

          // Redirect after a short delay to ensure stores are updated
          setTimeout(async () => {
            try {
              // Use the user's home path or default - but avoid dynamic routes that might fail
              // Use static routes that are more likely to work
              const homePath = '/dashboard';
              await router.push(homePath);
            } catch (error) {
              console.error('Redirect error:', error);
              // Try alternative static paths
              try {
                await router.push('/');
              } catch {
                // Last resort - force page redirect to a simple page
                window.location.href = '/dashboard';
              }
            }
          }, 1000);
        } else if (result.success && !result.userInfo) {
          // Success but no userInfo - this might be the issue
          notification.warning({
            message: $t('authentication.loginPartiallySuccessful'),
            description: $t('authentication.loginPartiallySuccessfulDesc'),
            duration: 5,
          });
        }
        break;
      }
    }

    if (!result.success) {
      console.error('Operation failed:', result.error);
      notification.error({
        message: $t('authentication.operationFailed'),
        description: result.error || $t('authentication.errorOccurred'),
        duration: 5,
      });
    }
  } catch (error) {
    console.error('Error:', error);
    handleSupabaseError(error);
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

function switchMode(newMode: 'forgot' | 'login' | 'register') {
  // Reset success states when switching modes
  resetEmailSent.value = false;
  hasShownLoginSuccess.value = false;
  mode.value = newMode;
}

function switchToMagicLink() {
  mode.value = 'magic';
}

function handleMagicLinkSuccess() {
  mode.value = 'login';
}
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <!-- Processing Magic Link Callback Overlay -->
    <div
      v-if="processingCallback"
      class="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90"
    >
      <div class="text-center">
        <div class="mb-4">
          <div
            class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-purple-600"
          ></div>
        </div>
        <h3 class="mb-2 text-lg font-medium text-gray-900">
          {{ $t('authentication.processingAuthentication') }}
        </h3>
        <p class="text-sm text-gray-600">
          <CarbonMagicWand class="mr-1 inline" />
          {{ $t('authentication.magicLinkInProgress') }}
        </p>
      </div>
    </div>

    <!-- Magic Link Login Component -->
    <MagicLinkLogin
      v-if="mode === 'magic'"
      :loading="loading"
      @success="handleMagicLinkSuccess"
      @switch-to-login="switchMode('login')"
    />

    <!-- Regular Login Forms -->
    <div v-else>
      <!-- Password Reset Success State -->
      <div v-if="mode === 'forgot' && resetEmailSent" class="text-center">
        <div class="mb-6">
          <div class="mb-4">
            <svg
              class="mx-auto h-16 w-16 text-green-500"
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
          <h3 class="text-xl font-semibold text-gray-900">
            {{ $t('authentication.emailSent') }}
          </h3>
          <p class="mt-2 text-sm text-gray-600">
            {{ $t('authentication.checkEmailForInstructions') }}
          </p>
          <p class="mt-2 text-xs text-gray-500">
            {{ $t('authentication.returningToLogin') }}
          </p>
        </div>
      </div>

      <!-- Normal Forms -->
      <div v-else>
        <AuthenticationLogin
          :form-schema="formSchema"
          :loading="loading"
          :show-code-login="false"
          :show-forget-password="false"
          :show-qrcode-login="false"
          :show-register="false"
          :show-remember-me="false"
          :show-third-party-login="false"
          :submit-button-text="submitButtonText"
          :sub-title="formSubTitle"
          :title="formTitle"
          @submit="handleSubmit"
        />
      </div>

      <!-- Magic Link Call-to-Action (Prominent) -->
      <div v-if="mode === 'login'" class="mt-4">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="bg-white px-2 text-gray-500">{{
              $t('authentication.or')
            }}</span>
          </div>
        </div>

        <Button
          type="dashed"
          size="large"
          block
          :loading="loading"
          :disabled="loading"
          class="mt-4"
          @click="switchToMagicLink"
        >
          <div v-if="!loading" class="flex items-center justify-center gap-2">
            <CarbonMagicWand class="text-lg" />
            <span class="font-semibold">{{
              $t('authentication.useMagicLinkInstead')
            }}</span>
          </div>
          <span v-else>{{ $t('authentication.loading') }}</span>
        </Button>
      </div>

      <!-- Mode Switch Links -->
      <div class="mt-6 space-y-2 text-center">
        <div v-if="mode === 'login'" class="text-sm">
          <span class="text-gray-600">
            {{ $t('authentication.accountTip') }}
          </span>
          <Button
            type="link"
            size="small"
            :disabled="loading"
            class="p-0 font-medium"
            @click="switchMode('register')"
          >
            {{ $t('authentication.signUp') }}
          </Button>
        </div>

        <div v-if="mode === 'login'" class="text-sm">
          <Button
            type="link"
            size="small"
            :disabled="loading"
            class="p-0 font-medium"
            @click="switchMode('forgot')"
          >
            {{ $t('authentication.forgetPassword') }}
          </Button>
        </div>

        <div v-if="mode === 'register'" class="text-sm">
          <span class="text-gray-600">
            {{ $t('authentication.alreadyHaveAccount') }}
          </span>
          <Button
            type="link"
            size="small"
            :disabled="loading"
            class="p-0 font-medium"
            @click="switchMode('login')"
          >
            {{ $t('authentication.goToLogin') }}
          </Button>
        </div>

        <div v-if="mode === 'forgot'" class="text-sm">
          <span class="text-gray-600">
            {{ $t('authentication.rememberPassword') }}
          </span>
          <Button
            type="link"
            size="small"
            :disabled="loading"
            class="p-0 font-medium"
            @click="switchMode('login')"
          >
            {{ $t('authentication.goToLogin') }}
          </Button>
        </div>
      </div>

      <!-- Info Messages -->
      <Alert
        v-if="mode === 'register'"
        type="info"
        show-icon
        class="mt-4"
        :message="$t('authentication.emailConfirmationRequired')"
      >
        <template #description>
          <CarbonEmail class="mr-1 inline" />
          {{ $t('authentication.emailConfirmationDescription') }}
        </template>
      </Alert>

      <Alert
        v-if="mode === 'forgot'"
        type="warning"
        show-icon
        class="mt-4"
        :message="$t('authentication.passwordResetInfo')"
      >
        <template #description>
          <CarbonSecurity class="mr-1 inline" />
          {{ $t('authentication.passwordResetDescription') }}
        </template>
      </Alert>
    </div>
  </div>
</template>

<style scoped>
/* Clean component using only Ant Design built-in styles */
</style>
