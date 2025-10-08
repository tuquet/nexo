# Supabase Error Handling System

## Overview

Hệ thống error handling cho Supabase authentication đã được tổ chức để hỗ trợ i18n và cung cấp thông báo lỗi nhất quán cho người dùng.

## Components

### 1. Error Mapping (`supabase-errors.ts`)

Định nghĩa mapping giữa error codes của Supabase và i18n keys:

```typescript
export const SUPABASE_ERROR_CODES = {
  INVALID_CREDENTIALS: 'invalid_login_credentials',
  EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
  TOO_MANY_REQUESTS: 'too_many_enrollment_requests',
  OVER_EMAIL_SEND_RATE_LIMIT: 'over_email_send_rate_limit',
  // ... other error codes
};
```

### 2. Enhanced Error Class (`SupabaseAuthError`)

Class mở rộng để xử lý lỗi từ Supabase với hỗ trợ i18n:

```typescript
export class SupabaseAuthError extends Error {
  public readonly code: string;
  public readonly i18nKey: string;
  public readonly rateLimitSeconds?: number;

  constructor(error: any) {
    super(error.message);
    this.code = error.code || 'unknown_error';
    this.i18nKey = getSupabaseErrorKey(this.code);

    // Extract rate limit information if present
    if (this.code === 'over_email_send_rate_limit') {
      this.rateLimitSeconds = extractRateLimitSeconds(error.message);
    }
  }
}
```

### 3. Updated Authentication Service

Service layer (`auth.ts`) giờ ném `SupabaseAuthError` thay vì `Error` thông thường:

```typescript
async signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new SupabaseAuthError(error); // Enhanced error with i18n support
  }

  return data;
}
```

### 4. Component-level Error Handling

Các components authentication giờ có helper functions để xử lý errors:

```typescript
function handleSupabaseError(error: unknown) {
  if (error instanceof SupabaseAuthError) {
    let description = $t(error.i18nKey);

    // Handle rate limit errors with time information
    if (error.rateLimitSeconds) {
      description = formatRateLimitMessage(description, error.rateLimitSeconds);
    }

    notification.error({
      message: $t('authentication.operationFailed'),
      description,
      duration: error.rateLimitSeconds ? 10 : 5,
    });
  }
  // ... handle other error types
}
```

## Supported Error Types

### Authentication Errors

- `invalid_login_credentials` - Sai thông tin đăng nhập
- `email_not_confirmed` - Email chưa được xác nhận
- `user_already_registered` - Email đã được đăng ký
- `user_not_found` - Không tìm thấy user
- `weak_password` - Mật khẩu yếu

### Rate Limiting

- `over_email_send_rate_limit` - Vượt quá giới hạn gửi email
- `over_sms_send_rate_limit` - Vượt quá giới hạn gửi SMS

Với rate limiting, hệ thống tự động extract thời gian chờ và hiển thị cho user.

### Session & Security

- `session_not_found` - Không tìm thấy session
- `refresh_token_not_found` - Không tìm thấy refresh token
- `captcha_failed` - CAPTCHA thất bại

## Usage Example

```typescript
try {
  await authStore.signIn(email, password);
} catch (error) {
  handleSupabaseError(error); // Automatically shows localized error
}
```

## Benefits

1. **Consistent Error Messages**: Tất cả lỗi từ Supabase được hiển thị nhất quán
2. **i18n Support**: Hỗ trợ đa ngôn ngữ cho tất cả error messages
3. **Rate Limit Handling**: Tự động extract và hiển thị thời gian chờ
4. **Type Safety**: TypeScript support đầy đủ
5. **Centralized Management**: Tất cả error codes được quản lý ở một chỗ

## Files Updated

- `apps/nexo-web/src/utils/supabase-errors.ts` - Error mapping utility
- `apps/nexo-web/src/lib/supabase/auth.ts` - Enhanced authentication service
- `apps/nexo-web/src/views/_core/authentication/supabase/supabase-login.vue` - Main login component
- `apps/nexo-web/src/views/_core/authentication/supabase/magic-link-login.vue` - Magic link component
- `apps/nexo-web/src/views/_core/authentication/reset-password.vue` - Password reset component
- All locale files with new error message translations

## Translation Keys Added

Đã thêm 20+ translation keys mới cho error messages trong các file:

- `packages/locales/langs/en-US.json`
- `packages/locales/langs/vi-VN.json`
- `packages/locales/langs/zh-CN.json`
