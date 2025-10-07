# Supabase OAuth Callback Configuration Fix

## 🚨 Problem Identified

### Current Issue

Supabase OAuth callback redirecting to localhost instead of production domain:

```
http://localhost:3000/#access_token=eyJhbGciOiJIUzI1NiIs...
```

**Should redirect to**:

```
https://nexo-web-git-development-tuquets-projects.vercel.app/#access_token=...
```

### Root Cause

Supabase project authentication settings configured with localhost URLs for development but not updated for production deployment.

## ✅ Supabase Dashboard Configuration

### Step 1: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project: `xfdtssutjguzbpkrapkw`
3. Navigate to: **Authentication** → **URL Configuration**

### Step 2: Update Site URL

```
Site URL: https://nexo-web-pearl.vercel.app
```

### Step 3: Configure Redirect URLs

Add all environment URLs:

```
Additional Redirect URLs:
http://localhost:5668/**
https://nexo-web-git-development-tuquets-projects.vercel.app/**
https://nexo-web-pearl.vercel.app/**
```

**Important**: Use `/**` wildcard to handle different routes

### Step 4: OAuth Provider Settings (if using)

For each OAuth provider (Google, GitHub, etc.), update:

#### Google OAuth

- **Authorized JavaScript origins**:
  - `http://localhost:5668`
  - `https://nexo-web-git-development-tuquets-projects.vercel.app`
  - `https://nexo-web-pearl.vercel.app`

- **Authorized redirect URIs**:
  - `https://xfdtssutjguzbpkrapkw.supabase.co/auth/v1/callback`

#### GitHub OAuth

- **Authorization callback URL**:
  - `https://xfdtssutjguzbpkrapkw.supabase.co/auth/v1/callback`

## 🔧 Code Configuration

### Environment-Specific Redirect URLs

#### Update Supabase Auth Service

```typescript
// apps/nexo-web/src/lib/supabase/auth.ts
export const authService = {
  async signInWithOAuth(provider: 'google' | 'github' | 'facebook') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getRedirectUrl(), // Dynamic redirect based on environment
      },
    });
    // ...
  },
};

function getRedirectUrl(): string {
  // Development
  if (import.meta.env.DEV) {
    return `${window.location.origin}/auth/callback`;
  }

  // Production
  return `${window.location.origin}/auth/callback`;
}
```

### Environment Variables

Ensure proper environment variables are set:

```bash
# .env.production
VITE_SUPABASE_URL=https://xfdtssutjguzbpkrapkw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Vercel Environment Variables (set in dashboard)
VITE_SUPABASE_URL=https://xfdtssutjguzbpkrapkw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🎯 Redirect URL Strategy

### Multi-Environment Setup

```
Local Development:
- http://localhost:5668/** (Vite dev server)

Development Branch:
- https://nexo-web-git-development-tuquets-projects.vercel.app/**

Production:
- https://nexo-web-pearl.vercel.app/**

Additional Services:
- Nitro Mock Server: http://localhost:5320/api (backend only, no auth)
```

### Environment Priority

```
1. Production (Primary): https://nexo-web-pearl.vercel.app
2. Development Branch: https://nexo-web-git-development-tuquets-projects.vercel.app
3. Local Development: http://localhost:5668
```

## 🔧 Auth Callback Handling

### Create Auth Callback Route

```typescript
// apps/nexo-web/src/views/auth/callback.vue
<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="loading-spinner"></div>
      <p>Processing authentication...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '#/lib/supabase';

const router = useRouter();

onMounted(async () => {
  try {
    // Handle the OAuth callback
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Auth callback error:', error);
      router.push('/login?error=auth_callback_failed');
      return;
    }

    if (data.session) {
      // Successful authentication
      router.push('/dashboard');
    } else {
      // No session found
      router.push('/login');
    }
  } catch (error) {
    console.error('Callback processing error:', error);
    router.push('/login?error=callback_error');
  }
});
</script>
```

### Add Route Configuration

```typescript
// apps/nexo-web/src/router/routes/core.ts
{
  path: '/auth/callback',
  name: 'AuthCallback',
  component: () => import('#/views/auth/callback.vue'),
  meta: {
    title: 'Auth Callback',
  },
}
```

## 📊 Testing Different Environments

### Local Development Test

```bash
# Start dev server
pnpm dev

# Should run on: http://localhost:5668
# Test OAuth flow
# Should redirect to: http://localhost:5668/auth/callback
```

### Development Branch Test

```bash
# Deploy to development branch
# Test at: https://nexo-web-git-development-tuquets-projects.vercel.app
# Should redirect to: https://nexo-web-git-development-tuquets-projects.vercel.app/auth/callback
```

### Production Test

```bash
# Deploy to production
# Test at: https://nexo-web-pearl.vercel.app
# Should redirect to: https://nexo-web-pearl.vercel.app/auth/callback
```

### Debugging Redirect Issues

```javascript
// Check current URL configuration
console.log('Current origin:', window.location.origin);
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

// Test redirect URL generation
function getRedirectUrl() {
  const baseUrl = window.location.origin;
  const callbackPath = '/auth/callback';
  const redirectUrl = `${baseUrl}${callbackPath}`;
  console.log('Redirect URL:', redirectUrl);
  return redirectUrl;
}
```

## 🚀 Implementation Steps

### Immediate Fix (Production)

1. **Update Supabase Dashboard**:
   - Site URL: `https://nexo-web-git-development-tuquets-projects.vercel.app`
   - Add production URL to redirect URLs

2. **Test OAuth Flow**:
   - Try login with email/magic link
   - Should redirect to production domain

### Long-term Setup (Multi-Environment)

1. **Add all environment URLs** to Supabase
2. **Create auth callback route** in app
3. **Implement dynamic redirect** logic
4. **Test all environments** thoroughly

## 🔒 Security Considerations

### URL Validation

```typescript
// Validate redirect URLs to prevent open redirects
const ALLOWED_DOMAINS = [
  'localhost:5668',
  'nexo-web-git-development-tuquets-projects.vercel.app',
  'nexo-web-pearl.vercel.app',
];

function isValidRedirectUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ALLOWED_DOMAINS.some(
      (domain) => urlObj.host === domain || urlObj.host.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}
```

### Environment-Specific Settings

```bash
# Local Development
VITE_ALLOWED_REDIRECT_DOMAINS=localhost:5668

# Development Branch
VITE_ALLOWED_REDIRECT_DOMAINS=nexo-web-git-development-tuquets-projects.vercel.app

# Production
VITE_ALLOWED_REDIRECT_DOMAINS=nexo-web-pearl.vercel.app
```

---

## ✅ Summary

**Problem**: Supabase OAuth redirecting to localhost instead of production domain **Root Cause**: Supabase dashboard not configured with production URLs **Solution**: Update Supabase URL configuration + implement auth callback handling **Result**: Proper OAuth flow in both development and production

## 📋 Quick Fix Checklist

- [ ] Update Supabase Site URL to production domain
- [ ] Add production URL to Additional Redirect URLs
- [ ] Test OAuth flow in production
- [ ] Create auth callback route (optional, for better UX)
- [ ] Verify environment variables in Vercel

**OAuth callbacks will now work correctly in production! 🎉**
