import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase environment variables. Supabase features will be disabled.',
  );
}

// Create Supabase client (will be null if env vars missing)
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Types for auth
export type User = {
  email?: string;
  id: string;
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
  };
};

export type Session = {
  access_token: string;
  refresh_token: string;
  user: User;
};
