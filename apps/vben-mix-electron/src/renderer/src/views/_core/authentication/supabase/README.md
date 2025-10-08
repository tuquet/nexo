# Supabase Authentication Components

This folder contains all authentication components related to Supabase integration.

## 📁 Structure

```
supabase/
├── index.ts                     # Exports all components
├── auth-callback.vue            # OAuth & magic link callback handler
├── magic-link-login.vue         # Magic link authentication
├── reset-password.vue           # Password reset form
├── supabase-forget-password.vue # Forgot password form
├── supabase-login.vue          # Standard login form
└── supabase-register.vue       # User registration form
```

## 🔧 Components

### Core Authentication

- **`supabase-login.vue`** - Email/password login with OAuth options
- **`supabase-register.vue`** - User registration with email verification
- **`supabase-forget-password.vue`** - Password reset request form

### Specialized Flows

- **`magic-link-login.vue`** - Passwordless authentication
- **`auth-callback.vue`** - Handles OAuth and magic link callbacks
- **`reset-password.vue`** - New password setting form

## 🚀 Usage

### Import Individual Components

```vue
<script setup>
import { SupabaseLogin } from '@/views/_core/authentication/supabase';
// or
import SupabaseLogin from '@/views/_core/authentication/supabase/supabase-login.vue';
</script>
```

### Import All Components

```typescript
import {
  SupabaseLogin,
  SupabaseRegister,
  MagicLinkLogin,
  AuthCallback,
  SUPABASE_COMPONENTS,
} from '@/views/_core/authentication/supabase';
```

### Dynamic Component Loading

```typescript
import { SUPABASE_COMPONENTS } from '@/views/_core/authentication/supabase';

// Use component names for dynamic imports
const componentName = SUPABASE_COMPONENTS.LOGIN; // 'supabase-login'
```

## 🔄 Integration

All components in this folder:

- ✅ Use `useSupabaseAuthStore()` for state management
- ✅ Handle `SupabaseAuthError` with i18n support
- ✅ Include comprehensive error handling
- ✅ Support retry logic and network resilience
- ✅ Follow consistent UI/UX patterns

## 📋 Dependencies

- **Store**: `#/store/auth-supabase`
- **Service**: `#/lib/supabase/auth`
- **Utils**: `#/utils/supabase-errors`
- **UI**: `@vben/common-ui`, `ant-design-vue`
- **Icons**: `@vben/icons`
- **i18n**: `@vben/locales`

## 🔗 Related

- Authentication service: `src/lib/supabase/auth.ts`
- Error utilities: `src/utils/supabase-errors.ts`
- Auth store: `src/store/auth-supabase.ts`
- Documentation: `src/lib/supabase/README.md`
