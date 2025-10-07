import type { Session, User } from './client';

import {
  extractRateLimitSeconds,
  getSupabaseErrorKey,
} from '#/utils/supabase-errors';

import { supabase } from './client';

/**
 * Enhanced error for Supabase operations with i18n support
 */
export class SupabaseAuthError extends Error {
  public readonly code: string;
  public readonly i18nKey: string;
  public readonly rateLimitSeconds?: number;

  constructor(error: any) {
    super(error.message);

    // Only log error details in development
    if (import.meta.env.DEV) {
      console.error('Supabase error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        status: error.status,
      });
    }

    this.code = error.code || 'unknown_error';
    this.i18nKey = getSupabaseErrorKey(this.code);

    // Extract rate limit information if present
    if (
      this.code === 'over_email_send_rate_limit' ||
      this.code === 'over_sms_send_rate_limit'
    ) {
      this.rateLimitSeconds =
        extractRateLimitSeconds(error.message) ?? undefined;
    }
  }
}

/**
 * Enhanced Supabase Authentication Service with resilience features
 */
export class SupabaseAuthService {
  /**
   * Clear all Supabase localStorage data (useful for debugging)
   */
  clearSupabaseStorage() {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Check if client is available and user is online
   */
  async ensureConnectivity(): Promise<boolean> {
    // Check if client is available
    if (!supabase) {
      throw new Error(
        'Supabase client not initialized. Please check environment variables.',
      );
    }

    // Check network connectivity
    if (!navigator.onLine) {
      throw new Error('No internet connection. Please check your network.');
    }

    return true;
  }

  /**
   * Get Supabase client if available
   */
  getClient() {
    return supabase;
  }

  /**
   * Get current session with retry logic
   */
  async getSession(): Promise<null | Session> {
    return this.withRetry(async () => {
      const client = this.ensureClient();
      const { data, error } = await client.auth.getSession();

      if (error) {
        throw new SupabaseAuthError(error);
      }

      return (data.session as Session) || null;
    });
  }

  /**
   * Get current user with retry logic
   */
  async getUser(): Promise<null | User> {
    return this.withRetry(async () => {
      const client = this.ensureClient();
      const { data, error } = await client.auth.getUser();

      if (error) {
        throw new SupabaseAuthError(error);
      }

      return (data.user as User) || null;
    });
  }

  /**
   * Check if Supabase client is available
   */
  isAvailable(): boolean {
    return supabase !== null;
  }

  /**
   * Listen for auth state changes
   */
  onAuthStateChange(
    callback: (session: null | Session, user: null | User) => void,
  ) {
    if (!supabase) {
      // If Supabase is not available, call callback with null values and return a no-op unsubscribe
      console.warn(
        'Supabase client not available. Auth state change listener disabled.',
      );
      callback(null, null);
      return {
        data: { subscription: { unsubscribe: () => {} } },
        error: null,
      };
    }

    const client = this.ensureClient();
    return client.auth.onAuthStateChange((_event, session) => {
      callback((session as Session) || null, (session?.user as User) || null);
    });
  }

  /**
   * Refresh session with enhanced error handling
   */
  async refreshSession() {
    return this.withRetry(
      async () => {
        const client = this.ensureClient();
        const { data, error } = await client.auth.refreshSession();

        if (error) {
          // If refresh fails with 400, it likely means the refresh token is invalid
          // Clear the session to prevent further failed attempts
          if (error.status === 400) {
            console.warn(
              'Refresh token invalid, clearing session and localStorage',
            );
            // Clear all supabase related localStorage items
            this.clearSupabaseStorage();
            await client.auth.signOut();
          }
          throw new SupabaseAuthError(error);
        }

        return data;
      },
      1, // Only retry once for refresh operations
    );
  }

  /**
   * Reset password with retry logic
   */
  async resetPassword(email: string) {
    return this.withRetry(async () => {
      const client = this.ensureClient();
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw new SupabaseAuthError(error);
      }
    });
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    return this.withRetry(async () => {
      const client = this.ensureClient();
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new SupabaseAuthError(error);
      }

      return data;
    });
  }

  /**
   * Sign in with Magic Link
   */
  async signInWithMagicLink(email: string) {
    return this.withRetry(async () => {
      const client = this.ensureClient();
      const { error } = await client.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw new SupabaseAuthError(error);
      }
    });
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithOAuth(provider: 'facebook' | 'github' | 'google') {
    return this.withRetry(async () => {
      const client = this.ensureClient();
      const { data, error } = await client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw new SupabaseAuthError(error);
      }

      return data;
    });
  }

  /**
   * Sign out with retry logic
   */
  async signOut() {
    return this.withRetry(async () => {
      const client = this.ensureClient();
      const { error } = await client.auth.signOut();

      if (error) {
        throw new SupabaseAuthError(error);
      }
    });
  }

  /**
   * Sign up with email and password
   */
  async signUp(
    email: string,
    password: string,
    metadata?: Record<string, any>,
  ) {
    return this.withRetry(async () => {
      const client = this.ensureClient();
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw new SupabaseAuthError(error);
      }

      return data;
    });
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    return this.withRetry(async () => {
      const client = this.ensureClient();
      const { error } = await client.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new SupabaseAuthError(error);
      }
    });
  }

  /**
   * Execute operation with retry logic for network issues
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delayMs = 1000,
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.ensureConnectivity();
        return await operation();
      } catch (error: any) {
        lastError = error;

        // Don't retry on authentication errors or client-side errors
        if (
          error.code === 'invalid_login_credentials' ||
          error.code === 'email_not_confirmed' ||
          error.status === 400 ||
          error.status === 401 ||
          error.status === 403
        ) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry with exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * 2 ** (attempt - 1)),
        );

        console.warn(
          `Retry attempt ${attempt}/${maxRetries} for operation failed:`,
          error.message,
        );
      }
    }

    throw lastError;
  }

  /**
   * Check if Supabase client is available and throw if not
   */
  private ensureClient() {
    if (!supabase) {
      throw new Error(
        'Supabase client not initialized. Please check environment variables.',
      );
    }
    return supabase;
  }
}

export const authService = new SupabaseAuthService();
