/**
 * Demo file showing Supabase error handling with i18n integration
 * This demonstrates how the error mapping system works
 */

import { SupabaseAuthError } from '#/lib/supabase/auth';

import { formatRateLimitMessage, getSupabaseErrorKey } from './supabase-errors';

/**
 * Example of how Supabase errors are handled throughout the application
 */
export function demonstrateErrorHandling() {
  // Example 1: Rate limit error
  const rateLimitError = new SupabaseAuthError({
    code: 'over_email_send_rate_limit',
    message:
      'For security purposes, you can only request this after 60 seconds.',
  });

  console.warn('Rate limit error:', {
    code: rateLimitError.code,
    i18nKey: rateLimitError.i18nKey,
    rateLimitSeconds: rateLimitError.rateLimitSeconds,
  });

  // Example 2: Invalid credentials error
  const invalidCredsError = new SupabaseAuthError({
    code: 'invalid_login_credentials',
    message: 'Invalid login credentials',
  });

  console.warn('Invalid credentials error:', {
    code: invalidCredsError.code,
    i18nKey: invalidCredsError.i18nKey,
  });

  // Example 3: Format rate limit message
  const baseMessage = 'Please wait {seconds} seconds before trying again.';
  const formattedMessage = formatRateLimitMessage(baseMessage, 60);
  console.warn('Formatted message:', formattedMessage);

  // Example 4: Get i18n key for error code
  const i18nKey = getSupabaseErrorKey('user_already_registered');
  console.warn('I18n key for user_already_registered:', i18nKey);
}

/**
 * Example of error handling in a component or store
 */
export async function handleAuthOperation() {
  try {
    // Simulated Supabase operation that could fail
    throw new SupabaseAuthError({
      code: 'over_email_send_rate_limit',
      message:
        'For security purposes, you can only request this after 45 seconds.',
    });
  } catch (error) {
    if (error instanceof SupabaseAuthError) {
      // Handle with i18n support
      let description = error.i18nKey; // Would be passed to $t() in component

      if (error.rateLimitSeconds) {
        description = formatRateLimitMessage(
          description,
          error.rateLimitSeconds,
        );
      }

      // In real component, this would be:
      // notification.error({
      //   message: $t('authentication.operationFailed'),
      //   description: $t(description),
      //   duration: error.rateLimitSeconds ? 10 : 5,
      // });

      console.warn('Would show error notification:', {
        message: 'authentication.operationFailed',
        description,
        duration: error.rateLimitSeconds ? 10 : 5,
      });
    }
  }
}
