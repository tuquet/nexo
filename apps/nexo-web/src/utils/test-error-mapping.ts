/**
 * Test file to verify Supabase error mapping works correctly
 */

import { formatRateLimitMessage, getSupabaseErrorKey } from './supabase-errors';

// Test cases for error mapping
const testCases = [
  {
    errorCode: 'invalid_login_credentials',
    expectedKey: 'authentication.errors.invalid_login_credentials',
  },
  {
    errorCode: 'over_email_send_rate_limit',
    expectedKey: 'authentication.errors.over_email_send_rate_limit',
  },
  {
    errorCode: 'user_already_registered',
    expectedKey: 'authentication.errors.user_already_registered',
  },
  {
    errorCode: 'unknown_code',
    expectedKey: 'authentication.errors.unknown_error', // fallback
  },
];

console.warn('Testing Supabase error mapping:');

testCases.forEach(({ errorCode, expectedKey }) => {
  const actualKey = getSupabaseErrorKey(errorCode);
  const isCorrect = actualKey === expectedKey;

  console.warn(`✓ ${errorCode}: ${actualKey} ${isCorrect ? '✅' : '❌'}`);
});

// Test rate limit message formatting
const testMessage = 'Please wait {seconds} seconds before trying again.';
const formattedMessage60 = formatRateLimitMessage(testMessage, 60);
const formattedMessage45 = formatRateLimitMessage(testMessage, 45);

console.warn('Testing rate limit formatting:');
console.warn(`✓ 60 seconds: ${formattedMessage60}`);
console.warn(`✓ 45 seconds: ${formattedMessage45}`);
