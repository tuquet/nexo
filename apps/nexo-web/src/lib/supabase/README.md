# Supabase Authentication Integration

A comprehensive Supabase authentication system integrated with VBen Admin framework.

## 📋 Table of Contents

- [Features](#features)
- [Quick Setup](#quick-setup)
- [Environment Configuration](#environment-configuration)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Error Handling](#error-handling)
- [Troubleshooting](#troubleshooting)

## ✨ Features

- **Multiple Authentication Methods**: Email/password, Magic Links, OAuth (Google, GitHub, Facebook)
- **Seamless VBen Integration**: Works alongside existing VBen authentication
- **Enhanced Error Handling**: Comprehensive error mapping with i18n support
- **Auto Session Management**: Handles refresh tokens, invalid sessions, rate limits
- **Multi-language Support**: Full i18n coverage (English, Vietnamese, Chinese)
- **Type Safety**: Full TypeScript support with proper typing
- **Production Ready**: Graceful degradation, environment validation, security best practices

## 🚀 Quick Setup

### 1. Environment Configuration

Create `.env.local` in your project root:

```bash
# Copy from example
cp .env.example .env.local

# Add your Supabase credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Initialize Supabase Store

````typescript
// In your main app setup
import { useSupabaseAuthStore } from '#/store/auth-supabase';

const supabaseStore = useSupabaseAuthStore();
supabaseStore.initializeAuth();
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
````

### 2. Supabase Project Configuration

In your Supabase dashboard:

1. **Authentication Settings**:
   - Enable email authentication
   - Configure OAuth providers (Google, GitHub, Facebook)
   - Set redirect URLs:
     - Development: `http://localhost:5173/auth/callback`
     - Production: `https://your-domain.com/auth/callback`

2. **Database Setup** (optional): Create custom user profiles table if needed:
   ```sql
   CREATE TABLE profiles (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     full_name TEXT,
     avatar_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

## Components

### Authentication Views

- `supabase-login.vue` - Email/password + OAuth login
- `supabase-register.vue` - User registration
- `supabase-forget-password.vue` - Password reset
- `auth-callback.vue` - OAuth callback handler

### Core Services

- `lib/supabase/client.ts` - Supabase client configuration
- `lib/supabase/auth.ts` - Authentication service methods
- `stores/auth-supabase.ts` - Pinia store for auth state

### API Integration

- `api/core/auth.ts` - Updated to use Supabase with fallback to original API

## Usage

### Basic Authentication

```typescript
import { useSupabaseAuthStore } from '#/stores/auth-supabase';

const authStore = useSupabaseAuthStore();

// Sign in
const result = await authStore.signIn(email, password);

// Sign up
const result = await authStore.signUp(email, password, {
  full_name: 'John Doe',
});

// Sign out
await authStore.signOut();

// OAuth login
await authStore.signInWithOAuth('google');
```

### Accessing User Data

```typescript
const authStore = useSupabaseAuthStore();

// Check authentication status
console.log(authStore.isAuthenticated);

// Get user info
console.log(authStore.user);
console.log(authStore.userEmail);
console.log(authStore.userFullName);
```

### Route Protection

```typescript
// In route guards
const authStore = useSupabaseAuthStore();

if (!authStore.isAuthenticated) {
  return { name: 'Login' };
}
```

## Routes

Add these routes to your router:

```typescript
{
  path: '/auth/login',
  component: () => import('#/views/_core/authentication/supabase/supabase-login.vue'),
},
{
  path: '/auth/register',
  component: () => import('#/views/_core/authentication/supabase/supabase-register.vue'),
},
{
  path: '/auth/forgot-password',
  component: () => import('#/views/_core/authentication/supabase/supabase-forget-password.vue'),
},
{
  path: '/auth/callback',
  component: () => import('#/views/_core/authentication/supabase/auth-callback.vue'),
},
```

## Features

### ✅ Implemented

- Email/password authentication
- User registration with metadata
- Password reset functionality
- OAuth integration (Google, GitHub, Facebook)
- Session management
- Auth state persistence
- Integration with existing API structure

### 🔄 Planned

- Email verification flow
- Role-based access control
- User profile management
- Multi-factor authentication
- Session timeout handling

## Security Notes

1. **Environment Variables**: Never commit `.env.local` files
2. **Row Level Security**: Enable RLS in Supabase for data protection
3. **OAuth Redirects**: Whitelist only trusted domains
4. **API Keys**: Use anon key for client-side, never service role key

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check Supabase URL configuration
2. **OAuth Redirect**: Verify callback URLs in Supabase dashboard
3. **Environment Variables**: Ensure all required vars are set
4. **Session Persistence**: Check localStorage/sessionStorage permissions

### Debug Mode

Enable debug logs:

```typescript
// In development
console.log('Auth state:', authStore.$state);
```

## Migration from Existing Auth

To migrate from the existing auth system:

1. Update login components to use Supabase components
2. Replace auth store calls with Supabase auth store
3. Update route guards to use new auth state
4. Migrate user data to Supabase if needed

## Support

For issues specific to Supabase integration, check:

- [Supabase Documentation](https://supabase.com/docs)
- [Vue.js Integration Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-vue-3)
