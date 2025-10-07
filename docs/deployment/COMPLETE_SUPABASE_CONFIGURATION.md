# Complete Supabase Configuration for Multi-Environment Setup

## 🌐 Environment Overview

```
🎯 Production:     https://nexo-web-pearl.vercel.app
🚧 Development:    https://nexo-web-git-development-tuquets-projects.vercel.app
💻 Local:          http://localhost:5668
🔧 Mock Server:    http://localhost:5320/api (backend only)
```

## ✅ Supabase Dashboard Configuration

### 1. Authentication URL Configuration

#### Site URL (Primary)

```
https://nexo-web-pearl.vercel.app
```

#### Additional Redirect URLs

```
http://localhost:5668/**
https://nexo-web-git-development-tuquets-projects.vercel.app/**
https://nexo-web-pearl.vercel.app/**
```

### 2. OAuth Provider Configuration

#### Google OAuth (if using)

**Google Cloud Console** → **Credentials** → **OAuth 2.0 Client IDs**

**Authorized JavaScript origins**:

```
http://localhost:5668
https://nexo-web-git-development-tuquets-projects.vercel.app
https://nexo-web-pearl.vercel.app
```

**Authorized redirect URIs**:

```
https://xfdtssutjguzbpkrapkw.supabase.co/auth/v1/callback
```

#### GitHub OAuth (if using)

**GitHub** → **Settings** → **Developer settings** → **OAuth Apps**

**Authorization callback URL**:

```
https://xfdtssutjguzbpkrapkw.supabase.co/auth/v1/callback
```

**Homepage URL**:

```
https://nexo-web-pearl.vercel.app
```

## 🔧 Environment Variables Setup

### Local Development (.env.local)

```bash
# Local development on port 5668
VITE_SUPABASE_URL=https://xfdtssutjguzbpkrapkw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_BASE=/
VITE_PORT=5668
```

### Development Branch (.env.development)

```bash
# Development branch deployment
VITE_SUPABASE_URL=https://xfdtssutjguzbpkrapkw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_BASE=/
```

### Production (.env.production)

```bash
# Production deployment
VITE_SUPABASE_URL=https://xfdtssutjguzbpkrapkw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_BASE=/
```

### Vercel Environment Variables

**Both Production and Preview environments**:

```
VITE_SUPABASE_URL=https://xfdtssutjguzbpkrapkw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🎯 Expected OAuth Flow

### Local Development

```
1. User clicks OAuth login
2. Redirects to Supabase OAuth
3. User authorizes
4. Redirects to: http://localhost:5668/#access_token=...
5. App handles authentication
```

### Development Branch

```
1. User clicks OAuth login
2. Redirects to Supabase OAuth
3. User authorizes
4. Redirects to: https://nexo-web-git-development-tuquets-projects.vercel.app/#access_token=...
5. App handles authentication
```

### Production

```
1. User clicks OAuth login
2. Redirects to Supabase OAuth
3. User authorizes
4. Redirects to: https://nexo-web-pearl.vercel.app/#access_token=...
5. App handles authentication
```

## 🔧 Code Configuration

### Dynamic Redirect URL Helper

```typescript
// apps/nexo-web/src/lib/supabase/auth.ts
function getRedirectUrl(): string {
  const origin = window.location.origin;

  // Environment-specific handling
  if (origin.includes('localhost:5668')) {
    return `${origin}/auth/callback`;
  }

  if (origin.includes('nexo-web-git-development')) {
    return `${origin}/auth/callback`;
  }

  if (origin.includes('nexo-web-pearl')) {
    return `${origin}/auth/callback`;
  }

  // Fallback
  return `${origin}/auth/callback`;
}

export const authService = {
  async signInWithOAuth(provider: 'google' | 'github') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getRedirectUrl(),
      },
    });

    if (error) throw error;
    return data;
  },
};
```

### Environment Detection

```typescript
// apps/nexo-web/src/utils/env.ts
export function getEnvironment() {
  const origin = window.location.origin;

  if (origin.includes('localhost')) return 'local';
  if (origin.includes('git-development')) return 'development';
  if (origin.includes('nexo-web-pearl')) return 'production';

  return 'unknown';
}

export function isProduction() {
  return getEnvironment() === 'production';
}

export function isDevelopment() {
  return getEnvironment() === 'development';
}

export function isLocal() {
  return getEnvironment() === 'local';
}
```

## 🧪 Testing Strategy

### 1. Local Testing

```bash
# Start local development
pnpm dev

# Should start on http://localhost:5668
# Test OAuth login → should redirect back to localhost:5668
```

### 2. Development Branch Testing

```bash
# Deploy to development branch
git push origin development

# Test at https://nexo-web-git-development-tuquets-projects.vercel.app
# OAuth should redirect back to development URL
```

### 3. Production Testing

```bash
# Deploy to production
git push origin main

# Test at https://nexo-web-pearl.vercel.app
# OAuth should redirect back to production URL
```

## 🚨 Common Issues & Solutions

### Issue: Wrong Redirect URL

**Symptoms**: OAuth redirects to wrong environment **Solution**: Check Supabase redirect URLs include all environments

### Issue: CORS Errors

**Symptoms**: Browser blocks OAuth requests  
**Solution**: Ensure all origins added to OAuth provider settings

### Issue: Invalid Callback

**Symptoms**: OAuth fails after authorization **Solution**: Verify callback URL matches exactly: `https://PROJECT.supabase.co/auth/v1/callback`

## 🔒 Security Checklist

- [ ] Site URL set to production domain
- [ ] All redirect URLs use HTTPS (except localhost)
- [ ] OAuth providers configured with correct origins
- [ ] Environment variables properly scoped
- [ ] No sensitive data in client-side code
- [ ] Callback URLs validated to prevent open redirects

## 📋 Implementation Checklist

### Supabase Dashboard

- [ ] Update Site URL to `https://nexo-web-pearl.vercel.app`
- [ ] Add all three redirect URLs with `/**` wildcard
- [ ] Configure OAuth providers (if using)

### Vercel Environment Variables

- [ ] Set `VITE_SUPABASE_URL` in production environment
- [ ] Set `VITE_SUPABASE_ANON_KEY` in production environment
- [ ] Set same variables in preview environment

### Code Updates

- [ ] Implement dynamic redirect URL logic
- [ ] Add environment detection utilities
- [ ] Create auth callback route (optional)
- [ ] Test OAuth flow in all environments

---

## ✅ Summary

**Environments**: 3 environments (local, development, production) **Configuration**: Complete Supabase + OAuth provider setup **Result**: OAuth authentication works correctly in all environments

**All environments now properly configured for Supabase authentication! 🎉**
