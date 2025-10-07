<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationForgetPassword, z } from '@vben/common-ui';
import { CarbonSecurity } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Alert,
  Button,
  Card,
  notification,
  Result,
  Spin,
} from 'ant-design-vue';

import { SupabaseAuthError } from '#/lib/supabase/auth';
import { useSupabaseAuthStore } from '#/store/auth-supabase';
import {
  extractRateLimitSeconds,
  formatRateLimitMessage,
} from '#/utils/supabase-errors';

defineOptions({ name: 'ResetPassword' });

const authStore = useSupabaseAuthStore();
const router = useRouter();

const loading = ref(false);
const hasValidToken = ref(false);
const errorMessage = ref<string>('');
const successMessage = ref<string>('');

/**
 * Handle Supabase authentication errors with i18n support
 */
function handleSupabaseError(error: unknown) {
  // Only log in development
  if (import.meta.env.DEV) {
    console.error('Reset password error details:', error);
  }

  if (error instanceof SupabaseAuthError) {
    let description = $t(error.i18nKey);

    // Handle rate limit errors with time information
    if (error.rateLimitSeconds) {
      description = formatRateLimitMessage(description, error.rateLimitSeconds);
    }

    notification.error({
      message: $t('authentication.passwordUpdateFailed'),
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
        message: $t('authentication.passwordUpdateFailed'),
        description,
        duration: 10,
      });
    } else {
      // Generic error fallback
      notification.error({
        message: $t('authentication.unexpectedError'),
        description: error.message || $t('authentication.unexpectedErrorDesc'),
        duration: 5,
      });
    }
  } else {
    notification.error({
      message: $t('authentication.unexpectedError'),
      description: $t('authentication.unexpectedErrorDesc'),
      duration: 5,
    });
  }
}

// Parse URL parameters to check for tokens or errors
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const urlHash = window.location.hash;

  // Check for error in URL hash
  if (urlHash.includes('error=')) {
    const hashParams = new URLSearchParams(urlHash.slice(1));
    const error = hashParams.get('error');
    const errorCode = hashParams.get('error_code');
    const errorDescription = hashParams.get('error_description');

    if (error === 'access_denied' && errorCode === 'otp_expired') {
      errorMessage.value = $t('authentication.resetLinkExpiredMessage');
    } else if (errorDescription) {
      errorMessage.value = decodeURIComponent(
        errorDescription.replaceAll('+', ' '),
      );
    } else {
      errorMessage.value = $t('authentication.resetLinkInvalidMessage');
    }
    return;
  }

  // Check for access token (valid reset link)
  if (urlHash.includes('access_token=') || urlParams.get('access_token')) {
    hasValidToken.value = true;
  } else {
    errorMessage.value = $t('authentication.invalidResetLinkMessage');
  }
});

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.enterNewPassword'),
        size: 'large',
        autocomplete: 'new-password',
      },
      fieldName: 'password',
      label: $t('authentication.newPasswordLabel'),
      rules: z
        .string()
        .min(6, { message: $t('authentication.passwordMinLength') })
        .regex(/^(?=.*[a-z])(?=.*\d)/i, {
          message: $t('authentication.passwordPattern'),
        }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.confirmNewPassword'),
        size: 'large',
        autocomplete: 'new-password',
      },
      fieldName: 'confirmPassword',
      label: $t('authentication.confirmNewPasswordLabel'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.confirmPasswordRequired') }),
    },
  ];
});

async function handleSubmit(values: Record<string, any>) {
  if (values.password !== values.confirmPassword) {
    notification.error({
      message: $t('authentication.passwordMismatch'),
      description: $t('authentication.passwordsDoNotMatch'),
      duration: 5,
    });
    return;
  }

  loading.value = true;

  // Add minimum loading duration for better UX
  const startTime = Date.now();
  const minLoadingDuration = 1000; // 1 second for password update

  try {
    const result = await authStore.updatePassword(values.password);

    if (result.success) {
      successMessage.value = $t('authentication.passwordUpdated');
      notification.success({
        message: $t('authentication.passwordUpdated'),
        description: $t('authentication.passwordUpdateSuccess'),
        duration: 6,
      });

      // Redirect to login after success
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } else {
      notification.error({
        message: $t('authentication.passwordUpdateFailed'),
        description: $t('authentication.passwordUpdateFailedDesc'),
        duration: 5,
      });
    }
  } catch (error) {
    console.error('Password update error:', error);
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

function goToLogin() {
  router.push('/auth/login');
}

function requestNewResetLink() {
  router.push('/auth/forgot-password');
}
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <!-- Success State -->
    <Result
      v-if="successMessage"
      status="success"
      :title="$t('authentication.passwordUpdated') || 'Password Updated!'"
      :sub-title="successMessage"
    >
      <template #extra>
        <Alert
          type="info"
          :message="$t('authentication.redirectingToLogin')"
          show-icon
          class="mb-4"
        />
      </template>
    </Result>

    <!-- Error State -->
    <Result
      v-else-if="errorMessage"
      status="error"
      :title="$t('authentication.resetLinkExpired') || 'Reset Link Expired'"
      :sub-title="errorMessage"
    >
      <template #extra>
        <div class="space-y-3">
          <Button
            type="primary"
            size="large"
            block
            @click="requestNewResetLink"
          >
            {{
              $t('authentication.requestNewResetLink') ||
              'Request New Reset Link'
            }}
          </Button>

          <Button type="default" size="large" block @click="goToLogin">
            {{ $t('authentication.backToLogin') || 'Back to Login' }}
          </Button>
        </div>

        <Alert
          type="info"
          show-icon
          class="mt-6"
          :message="$t('authentication.resetLinkSecurity')"
        >
          <template #description>
            <CarbonSecurity class="mr-1 inline" />
            {{ $t('authentication.resetLinkSecurityDescription') }}
          </template>
        </Alert>
      </template>
    </Result>

    <!-- Password Reset Form -->
    <Card v-else-if="hasValidToken" class="shadow-sm">
      <div class="mb-6 text-center">
        <div class="mb-4">
          <CarbonSecurity class="text-primary mx-auto h-12 w-12" />
        </div>
        <h2 class="text-2xl font-bold text-gray-900">
          {{ $t('authentication.setNewPassword') || 'Set New Password' }}
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          {{
            $t('authentication.chooseSecurePassword') ||
            'Choose a strong password for your account'
          }}
        </p>
      </div>

      <AuthenticationForgetPassword
        :form-schema="formSchema"
        :loading="loading"
        :submit-button-text="$t('authentication.updatePassword')"
        title=""
        sub-title=""
        @submit="handleSubmit"
      />

      <div class="mt-4 text-center">
        <Button type="link" size="small" class="text-sm" @click="goToLogin">
          {{ $t('authentication.cancelAndReturnToLogin') }}
        </Button>
      </div>

      <Alert
        type="warning"
        show-icon
        class="mt-6"
        :message="$t('authentication.passwordRequirements')"
      >
        <template #description>
          {{ $t('authentication.passwordRequirementsDescription') }}
        </template>
      </Alert>
    </Card>

    <!-- Loading State -->
    <div v-else class="text-center">
      <Spin size="large" />
      <p class="mt-4 text-gray-600">
        {{ $t('authentication.validatingResetLink') }}
      </p>
    </div>
  </div>
</template>
