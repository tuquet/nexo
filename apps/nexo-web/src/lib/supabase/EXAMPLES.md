# Supabase Authentication Usage Examples

This file contains practical code examples for using the Supabase authentication system.

## Basic Setup

```typescript
// Required imports
import { useSupabaseAuthStore } from '#/store/auth-supabase';
import { authService } from '#/lib/supabase';
import { useRouter } from 'vue-router';
import { notification } from 'ant-design-vue';
import { storeToRefs } from 'pinia';

// Initialize store
const supabaseStore = useSupabaseAuthStore();
const router = useRouter();
```

## 1. Basic Authentication

### Email/Password Login

```typescript
async function handleLogin(email: string, password: string) {
  try {
    const result = await supabaseStore.signIn(email, password);

    if (result.success) {
      console.log('✅ Login successful');
      console.log('User info:', result.userInfo);
      router.push('/dashboard');
    } else {
      console.error('❌ Login failed:', result.error);
      notification.error({
        message: 'Login Failed',
        description: result.error,
      });
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}
```

### User Registration

```typescript
async function handleRegister(email: string, password: string) {
  try {
    const result = await supabaseStore.signUp(email, password, {
      full_name: 'John Doe',
      avatar_url: 'https://example.com/avatar.jpg',
    });

    if (result.success) {
      notification.success({
        message: 'Registration Successful',
        description: 'Please check your email to confirm your account',
      });
    }
  } catch (error) {
    console.error('❌ Registration failed:', error);
  }
}
```

### Magic Link Authentication

```typescript
async function handleMagicLink(email: string) {
  try {
    const result = await supabaseStore.signInWithMagicLink(email);

    if (result.success) {
      notification.success({
        message: 'Magic Link Sent',
        description: 'Check your email for the login link',
      });
    }
  } catch (error) {
    console.error('❌ Magic link failed:', error);
  }
}
```

## 2. OAuth Authentication

### Google OAuth

```typescript
async function handleGoogleLogin() {
  try {
    await supabaseStore.signInWithOAuth('google');
    // User will be redirected to Google, then back to /auth/callback
  } catch (error) {
    console.error('❌ Google login failed:', error);
  }
}
```

### GitHub OAuth

```typescript
async function handleGitHubLogin() {
  try {
    await supabaseStore.signInWithOAuth('github');
    // User will be redirected to GitHub, then back to /auth/callback
  } catch (error) {
    console.error('❌ GitHub login failed:', error);
  }
}
```

## 3. Session Management

### Check Authentication Status

```typescript
function checkAuthStatus() {
  const { isAuthenticated, user, session } = storeToRefs(supabaseStore);

  if (isAuthenticated.value) {
    console.log('✅ User is authenticated');
    console.log('User email:', user.value?.email);
    console.log('Session expires:', new Date(session.value?.expires_at || 0));
  } else {
    console.log('❌ User is not authenticated');
  }
}
```

### Listen for Auth Changes

```typescript
import { watch } from 'vue';

function setupAuthListener() {
  supabaseStore.initializeAuth();

  // Watch for auth state changes
  watch(
    () => supabaseStore.isAuthenticated,
    (isAuth: boolean) => {
      if (isAuth) {
        console.log('✅ User logged in');
        router.push('/dashboard');
      } else {
        console.log('❌ User logged out');
        router.push('/auth/login');
      }
    },
  );
}
```

### Manual Session Refresh

```typescript
async function refreshSession() {
  try {
    const session = await authService.refreshSession();
    console.log('✅ Session refreshed:', session);
  } catch (error) {
    console.error('❌ Session refresh failed:', error);
    // Session might be invalid, redirect to login
    router.push('/auth/login');
  }
}
```

## 4. Password Management

### Password Reset

```typescript
async function handlePasswordReset(email: string) {
  try {
    const result = await supabaseStore.resetPassword(email);

    if (result.success) {
      notification.success({
        message: 'Password Reset Email Sent',
        description: 'Check your email for reset instructions',
      });
    }
  } catch (error) {
    console.error('❌ Password reset failed:', error);
  }
}
```

### Update Password

```typescript
async function handlePasswordUpdate(newPassword: string) {
  try {
    const result = await supabaseStore.updatePassword(newPassword);

    if (result.success) {
      notification.success({
        message: 'Password Updated',
        description: 'Your password has been successfully changed',
      });
    }
  } catch (error) {
    console.error('❌ Password update failed:', error);
  }
}
```

## 5. Advanced Usage

### Smart User Info Fetching

```typescript
async function getSmartUserInfo() {
  try {
    // This works for both Supabase and VBen users
    const userInfo = await supabaseStore.fetchUserInfoSmart();
    console.log('User info:', userInfo);

    // Check if user is from Supabase
    if (supabaseStore.isSupabaseUser()) {
      console.log('✅ User authenticated via Supabase');
    } else {
      console.log('✅ User authenticated via VBen');
    }
  } catch (error) {
    console.error('❌ Failed to fetch user info:', error);
  }
}
```

### Logout with Cleanup

```typescript
import { resetAllStores } from '@vben/stores';

async function handleLogout() {
  try {
    const result = await supabaseStore.signOut();

    if (result.success) {
      // Clear any additional app state
      resetAllStores();

      // Redirect to login
      router.push('/auth/login');

      notification.success({
        message: 'Logged Out',
        description: 'You have been successfully logged out',
      });
    }
  } catch (error) {
    console.error('❌ Logout failed:', error);
  }
}
```

## 6. Error Handling

### Comprehensive Error Handling

```typescript
import { $t } from '#/locales';

async function robustLogin(email: string, password: string) {
  try {
    const result = await supabaseStore.signIn(email, password);

    if (result.success) {
      return { success: true, data: result };
    } else {
      // Handle different error types
      const errorMessage = result.error || 'Unknown error';

      if (errorMessage.includes('Invalid login credentials')) {
        return {
          success: false,
          error: 'Invalid email or password. Please try again.',
        };
      } else if (errorMessage.includes('Email not confirmed')) {
        return {
          success: false,
          error: 'Please check your email and confirm your account first.',
        };
      } else if (errorMessage.includes('too_many_requests')) {
        return {
          success: false,
          error: 'Too many login attempts. Please try again later.',
        };
      } else {
        return {
          success: false,
          error: errorMessage,
        };
      }
    }
  } catch (error: any) {
    console.error('Login error:', error);

    // Handle structured Supabase errors
    if (error.i18nKey) {
      const translatedMessage = $t(error.i18nKey);
      return { success: false, error: translatedMessage };
    }

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}
```

## 7. Vue Component Integration

### Complete Authentication Component

```vue
<template>
  <div>
    <div v-if="!isAuthenticated">
      <form @submit.prevent="handleLogin">
        <input v-model="email" type="email" placeholder="Email" required />
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          required
        />
        <button type="submit" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <button @click="handleMagicLink">Send Magic Link</button>

      <button @click="handleGoogleLogin">Sign in with Google</button>
    </div>

    <div v-else>
      <h2>Welcome, {{ user?.email }}!</h2>
      <button @click="handleLogout">Logout</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useSupabaseAuthStore } from '#/store/auth-supabase';

const supabaseStore = useSupabaseAuthStore();
const { isAuthenticated, user } = storeToRefs(supabaseStore);

const email = ref('');
const password = ref('');
const loading = ref(false);

// Initialize auth on component mount
onMounted(() => {
  supabaseStore.initializeAuth();
});

const handleLogin = async () => {
  loading.value = true;
  try {
    const result = await supabaseStore.signIn(email.value, password.value);
    if (!result.success) {
      console.error('Login failed:', result.error);
    }
  } finally {
    loading.value = false;
  }
};

const handleMagicLink = async () => {
  if (email.value) {
    await supabaseStore.signInWithMagicLink(email.value);
  }
};

const handleGoogleLogin = async () => {
  await supabaseStore.signInWithOAuth('google');
};

const handleLogout = async () => {
  await supabaseStore.signOut();
};
</script>
```

## 8. Debugging Utilities

### Debug Auth State

```typescript
function debugSupabaseAuth() {
  console.log('=== Supabase Auth Debug Info ===');
  console.log('Is authenticated:', supabaseStore.isAuthenticated);
  console.log('Current user:', supabaseStore.user);
  console.log('Current session:', supabaseStore.session);
  console.log('User email:', supabaseStore.userEmail);
  console.log('User full name:', supabaseStore.userFullName);
  console.log('User avatar:', supabaseStore.userAvatar);

  // Check localStorage
  const storageKeys = Object.keys(localStorage).filter((key) =>
    key.startsWith('sb-'),
  );
  console.log('Supabase localStorage keys:', storageKeys);
}
```

### Clear Auth Data

```typescript
function clearAuthData() {
  // Clear Supabase storage
  authService.clearSupabaseStorage();

  // Clear store state
  supabaseStore.clearAuth();

  console.log('✅ Auth data cleared');
}
```

## 9. Router Guards

### Authentication Guard

```typescript
import type { RouteLocationNormalized } from 'vue-router';

async function authGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
) {
  const supabaseStore = useSupabaseAuthStore();

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    // Try to get user info smartly
    try {
      await supabaseStore.fetchUserInfoSmart();

      if (!supabaseStore.isAuthenticated) {
        // Redirect to login
        return '/auth/login';
      }
    } catch (error) {
      console.error('Auth guard error:', error);
      return '/auth/login';
    }
  }

  return true;
}
```

## 10. Testing Helpers

### Mock Authentication for Testing

```typescript
// For unit tests
export const mockSupabaseAuth = {
  signIn: vi.fn().mockResolvedValue({ success: true }),
  signOut: vi.fn().mockResolvedValue({ success: true }),
  signUp: vi.fn().mockResolvedValue({ success: true }),
  isAuthenticated: true,
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
  },
};
```
