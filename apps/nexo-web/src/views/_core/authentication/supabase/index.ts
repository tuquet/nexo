/**
 * Supabase Authentication Components
 */

// Component names for dynamic imports
export const SUPABASE_COMPONENTS = {
  AUTH_CALLBACK: 'auth-callback',
  FORGET_PASSWORD: 'supabase-forget-password',
  LOGIN: 'supabase-login',
  MAGIC_LINK: 'magic-link-login',
  REGISTER: 'supabase-register',
  RESET_PASSWORD: 'reset-password',
} as const;

// Types
export type SupabaseComponentName =
  (typeof SUPABASE_COMPONENTS)[keyof typeof SUPABASE_COMPONENTS];
