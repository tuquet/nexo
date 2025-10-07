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
  const match = message.match(/after (\d+) seconds?/);
  return match?.[1] ? Number.parseInt(match[1], 10) : null;
}

/**
 * Format error message with rate limit information
 */
export function formatRateLimitMessage(
  baseMessage: string,
  seconds: number,
): string {
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
  // If it's already a SupabaseAuthError, use its i18n key
  if (error?.i18nKey) {
    return $t(error.i18nKey);
  }

  // Check raw error message patterns
  const message = error?.message || '';

  if (message === 'Invalid login credentials') {
    return $t('authentication.errors.invalid_login_credentials');
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
