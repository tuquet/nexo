<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, ref } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { CarbonMagicWand } from '@vben/icons';
import { $t } from '@vben/locales';

import { Alert, Button, notification } from 'ant-design-vue';

import { SupabaseAuthError } from '#/lib/supabase/auth';
import { useSupabaseAuthStore } from '#/store/auth-supabase';
import {
  extractRateLimitSeconds,
  formatRateLimitMessage,
} from '#/utils/supabase-errors';

interface Props {
  loading?: boolean;
}

interface Emits {
  (e: 'success'): void;
  (e: 'switchToLogin'): void;
}

defineOptions({ name: 'MagicLinkLogin' });

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();

const authStore = useSupabaseAuthStore();
const internalLoading = ref(false);

const isLoading = computed(() => props.loading || internalLoading.value);

/**
 * Handle Supabase authentication errors with i18n support
 */
function handleSupabaseError(error: unknown) {
  console.error('Magic link error details:', error);

  if (error instanceof SupabaseAuthError) {
    let description = $t(error.i18nKey);

    // Handle rate limit errors with time information
    if (error.rateLimitSeconds) {
      description = formatRateLimitMessage(description, error.rateLimitSeconds);
    }

    notification.error({
      message: $t('authentication.magicLinkFailed'),
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
        message: $t('authentication.magicLinkFailed'),
        description,
        duration: 10,
      });
    } else {
      // Generic error fallback
      notification.error({
        message: $t('authentication.error'),
        description:
          error.message || $t('authentication.unexpectedErrorOccurred'),
        duration: 5,
      });
    }
  } else {
    notification.error({
      message: $t('authentication.error'),
      description: $t('authentication.unexpectedErrorOccurred'),
      duration: 5,
    });
  }
}

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.email') || 'Enter your email',
        type: 'email',
        autocomplete: 'email',
      },
      fieldName: 'email',
      label: $t('authentication.email'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.emailRequired') })
        .email($t('authentication.validEmailRequired')),
    },
  ];
});

async function handleSubmit(values: Record<string, any>) {
  internalLoading.value = true;

  // Add minimum loading duration for better UX
  const startTime = Date.now();
  const minLoadingDuration = 800; // 800ms minimum loading time

  try {
    const result = await authStore.signInWithMagicLink(values.email);

    if (result.success) {
      notification.success({
        message: $t('authentication.emailSent'),
        description: $t('authentication.checkEmailForInstructions'),
        duration: 5,
      });
      emit('success');
    } else {
      console.error('Magic link failed:', result.error);
      notification.error({
        message: $t('authentication.magicLinkFailed'),
        description: result.error || $t('authentication.failedToSendMagicLink'),
        duration: 5,
      });
    }
  } catch (error) {
    console.error('Magic link error:', error);
    handleSupabaseError(error);
  } finally {
    // Ensure minimum loading duration for smooth UX
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, minLoadingDuration - elapsedTime);

    if (remainingTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingTime));
    }

    internalLoading.value = false;
  }
}

function switchToLogin() {
  emit('switchToLogin');
}
</script>

<template>
  <div class="mx-auto w-full max-w-md">
    <AuthenticationLogin
      :form-schema="formSchema"
      :loading="isLoading"
      :show-code-login="false"
      :show-forget-password="false"
      :show-qrcode-login="false"
      :show-register="false"
      :show-remember-me="false"
      :show-third-party-login="false"
      :submit-button-text="$t('authentication.sendMagicLink')"
      :sub-title="$t('authentication.magicLinkSubtitle')"
      :title="$t('authentication.magicLinkTitle')"
      @submit="handleSubmit"
    />

    <!-- Switch back to password login -->
    <div class="mt-6 space-y-2 text-center">
      <div class="text-sm">
        <Button
          type="link"
          size="small"
          class="p-0 font-medium text-gray-600 hover:text-blue-600"
          @click="switchToLogin"
        >
          {{ $t('authentication.usePasswordInstead') }}
        </Button>
      </div>
    </div>

    <!-- Info Message -->
    <Alert
      type="info"
      show-icon
      class="mt-4"
      :message="$t('authentication.magicLinkInfo')"
    >
      <template #description>
        <CarbonMagicWand class="mr-1 inline" />
        {{ $t('authentication.magicLinkDescription') }}
      </template>
    </Alert>
  </div>
</template>
