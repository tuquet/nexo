/**
 * Supabase Error Code Mapping
 * Maps Supabase error codes to i18n translation keys
 */

export interface SupabaseError {
  code: string;
  message: string;
  details?: string;
}

export const SUPABASE_ERROR_CODES = {
  // Authentication Errors
  INVALID_CREDENTIALS: 'invalid_login_credentials',
  EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
  TOO_MANY_REQUESTS: 'too_many_enrollment_requests',
  WEAK_PASSWORD: 'weak_password',
  USER_ALREADY_REGISTERED: 'user_already_registered',
  USER_NOT_FOUND: 'user_not_found',

  // Email Rate Limiting
  OVER_EMAIL_SEND_RATE_LIMIT: 'over_email_send_rate_limit',
  OVER_SMS_SEND_RATE_LIMIT: 'over_sms_send_rate_limit',

  // Session Errors
  SESSION_NOT_FOUND: 'session_not_found',
  REFRESH_TOKEN_NOT_FOUND: 'refresh_token_not_found',
  INVALID_REFRESH_TOKEN: 'invalid_refresh_token',

  // Password Reset
  RESET_PASSWORD_NOT_FOUND: 'reset_password_not_found',
  SAME_PASSWORD: 'same_password',

  // OAuth Errors
  OAUTH_PROVIDER_NOT_SUPPORTED: 'oauth_provider_not_supported',
  EXTERNAL_PROVIDER_ERROR: 'external_provider_error',

  // Database Errors
  DUPLICATE_EMAIL: 'duplicate_email',
  DUPLICATE_PHONE: 'duplicate_phone',

  // Security
  CAPTCHA_FAILED: 'captcha_failed',
  IP_ADDRESS_NOT_AUTHORIZED: 'ip_address_not_authorized',

  // General
  NETWORK_ERROR: 'network_error',
  INTERNAL_ERROR: 'internal_error',
  VALIDATION_FAILED: 'validation_failed',
} as const;

/**
 * Get i18n translation key for Supabase error code
 */
export function getSupabaseErrorKey(errorCode: string): string {
  const errorKey = Object.entries(SUPABASE_ERROR_CODES).find(
    ([, code]) => code === errorCode,
  )?.[0];

  if (errorKey) {
    return `authentication.errors.${errorCode}`;
  }

  // Fallback to generic error
  return 'authentication.errors.unknown_error';
}

/**
 * Extract rate limit seconds from error message
 */
export function extractRateLimitSeconds(message: string): null | number {
  // Debug log to see actual message pattern
  if (import.meta.env.DEV && message.includes('security purposes')) {
    console.warn('Rate limit message:', message);
  }

  // Try multiple patterns for Supabase rate limit messages
  const patterns = [
    /this after (\d+) seconds?/i, // "you can only request this after X seconds"
    /after (\d+) seconds?/i, // "after X seconds"
    /(\d+) seconds?/i, // "X seconds" (more general)
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      const seconds = Number.parseInt(match[1], 10);
      if (import.meta.env.DEV) {
        console.warn(`Extracted ${seconds} seconds from pattern:`, pattern);
      }
      return seconds;
    }
  }

  return null;
}

/**
 * Format error message with rate limit information
 */
export function formatRateLimitMessage(
  baseMessage: string,
  seconds: number,
): string {
  // If no seconds provided or invalid, remove the placeholder
  if (!seconds || seconds <= 0) {
    return baseMessage
      .replace(' {seconds} giây nữa', '')
      .replace('{seconds}', '');
  }

  return baseMessage.replace('{seconds}', seconds.toString());
}

/**
 * Smart error message translation for common Supabase errors
 * This helps handle cases where errors aren't properly wrapped in SupabaseAuthError
 */
export function getTranslatedErrorMessage(
  error: any,
  $t: (key: string) => string,
): string {
  // If it's already a SupabaseAuthError, use its i18n key and rate limit info
  if (error?.i18nKey) {
    let description = $t(error.i18nKey);

    // Handle rate limit with seconds from SupabaseAuthError
    if (error.rateLimitSeconds) {
      description = formatRateLimitMessage(description, error.rateLimitSeconds);
    }

    return description;
  }

  // Check raw error message patterns
  const message = error?.message || '';

  if (
    message === 'Invalid login credentials' ||
    message === 'Invalid credentials'
  ) {
    return $t('authentication.errors.invalid_credentials');
  }

  if (message.includes('Email not confirmed')) {
    return $t('authentication.errors.email_not_confirmed');
  }

  if (message.includes('User already registered')) {
    return $t('authentication.errors.user_already_registered');
  }

  if (message.includes('User not found')) {
    return $t('authentication.errors.user_not_found');
  }

  if (message.includes('Weak password')) {
    return $t('authentication.errors.weak_password');
  }

  // Rate limit pattern
  if (message.includes('security purposes') && message.includes('seconds')) {
    const seconds = extractRateLimitSeconds(message);
    const baseMessage = $t('authentication.errors.over_email_send_rate_limit');
    return seconds ? formatRateLimitMessage(baseMessage, seconds) : baseMessage;
  }

  // Fallback to original message or generic error
  return message || $t('authentication.errors.unknown_error');
}
