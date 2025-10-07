import type { Session, User } from '#/lib/supabase';

import { defineStore } from 'pinia';

import { getUserInfoApi } from '#/api';
import { authService } from '#/lib/supabase';

interface AuthState {
  isAuthenticated: boolean;
  session: null | Session;
  user: null | User;
}

interface AuthResult {
  error?: string;
  success: boolean;
  userInfo?: any;
}

export const useSupabaseAuthStore = defineStore('supabase-auth', {
  actions: {
    /**
     * Authenticate with VBen system using Supabase session
     * This replaces the VBen authLogin flow for Supabase users
     */
    async authenticateWithVBen(): Promise<AuthResult> {
      if (!this.session || !this.user) {
        return { error: 'No active Supabase session', success: false };
      }

      try {
        const { useAccessStore, useUserStore } = await import('@vben/stores');
        const accessStore = useAccessStore();
        const userStore = useUserStore();

        // Prepare user info for VBen
        const userInfo = {
          avatar:
            this.user.user_metadata?.avatar_url ||
            `https://api.dicebear.com/7.x/miniavs/svg?seed=${this.user.email}`,
          desc: this.user.user_metadata?.full_name || this.user.email || 'User',
          homePath: '/dashboard',
          realName:
            this.user.user_metadata?.full_name || this.user.email || 'User',
          roles: ['user'],
          token: this.session.access_token,
          userId: this.user.id,
          username: this.user.email || 'user',
        };

        // Set user info first to avoid issues
        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(['AC_100100', 'AC_100110', 'AC_100120']); // Default Supabase access codes

        // Set the Supabase access token in VBen system
        accessStore.setAccessToken(this.session.access_token);

        return { success: true, userInfo };
      } catch (error: any) {
        console.error('VBen auth integration error:', error);
        return {
          error: error.message || 'Failed to authenticate with system',
          success: false,
        };
      }
    },

    /**
     * Get current session
     */
    async getCurrentSession() {
      try {
        const session = await authService.getSession();
        this.setSession(session);
        return session;
      } catch (error) {
        console.error('Error getting session:', error);
        this.clearAuth();
        return null;
      }
    },

    /**
     * Initialize auth listener
     */
    initializeAuth() {
      // Listen for auth state changes
      authService.onAuthStateChange((session, user) => {
        this.setSession(session);
        this.setUser(user);
      });

      // Get initial session
      this.getCurrentSession();
    },

    /**
     * Reset password
     */
    async resetPassword(email: string) {
      try {
        await authService.resetPassword(email);
        return { success: true };
      } catch (error: any) {
        return { error: error.message, success: false };
      }
    },

    /**
     * Sign in with email and password
     */
    async signIn(email: string, password: string) {
      try {
        const { session, user } = await authService.signIn(email, password);
        this.setSession(session);
        this.setUser(user);

        // Authenticate with VBen system
        const vbenAuthResult = await this.authenticateWithVBen();
        if (!vbenAuthResult.success) {
          return {
            error: vbenAuthResult.error || 'Failed to authenticate with system',
            success: false,
          };
        }

        return {
          session,
          success: true,
          user,
          userInfo: vbenAuthResult.userInfo,
        };
      } catch (error: any) {
        return { error: error.message, success: false };
      }
    },

    /**
     * Sign in with Magic Link
     */
    async signInWithMagicLink(email: string) {
      try {
        await authService.signInWithMagicLink(email);
        return { success: true };
      } catch (error: any) {
        return { error: error.message, success: false };
      }
    },

    /**
     * Sign in with OAuth
     */
    async signInWithOAuth(provider: 'facebook' | 'github' | 'google') {
      try {
        await authService.signInWithOAuth(provider);
        return { success: true };
      } catch (error: any) {
        return { error: error.message, success: false };
      }
    },

    /**
     * Sign out
     */
    async signOut() {
      try {
        await authService.signOut();
        this.clearAuth();
        return { success: true };
      } catch (error: any) {
        return { error: error.message, success: false };
      }
    },

    /**
     * Sign up with email and password
     */
    async signUp(
      email: string,
      password: string,
      metadata?: Record<string, any>,
    ) {
      try {
        const result = await authService.signUp(email, password, metadata);
        return { result, success: true };
      } catch (error: any) {
        return { error: error.message, success: false };
      }
    },

    /**
     * Update password
     */
    async updatePassword(newPassword: string) {
      try {
        await authService.updatePassword(newPassword);
        return { success: true };
      } catch (error: any) {
        return { error: error.message, success: false };
      }
    },

    /**
     * Fetch user info for Supabase authenticated users
     * This replaces the need to call VBen API /user/info
     */
    async fetchUserInfo() {
      try {
        if (!this.session?.access_token) {
          throw new Error('No access token available');
        }

        if (!this.user?.email) {
          throw new Error('User email not found');
        }

        // For Supabase users, create user info from session/user data
        const userInfo = {
          avatar:
            this.user.user_metadata?.avatar_url ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${this.user.email}`,
          desc: 'Supabase User',
          email: this.user.email,
          homePath: '/dashboard',
          realName: this.user.email.split('@')[0] || 'User',
          roles: ['user'],
          token: this.session.access_token,
          userId: this.user.id,
          username: this.user.email,
        };

        return userInfo;
      } catch (error: any) {
        console.error('Supabase fetchUserInfo error:', error);
        // Return fallback user info from token if possible
        return this.getUserInfoFromToken();
      }
    },

    /**
     * Extract user info from Supabase token
     * Can work with token from either Supabase session or VBen accessStore
     */
    async getUserInfoFromToken() {
      try {
        let token = this.session?.access_token;

        // If no token in Supabase session, try VBen accessStore
        if (!token) {
          const { useAccessStore } = await import('@vben/stores');
          const accessStore = useAccessStore();
          token = accessStore.accessToken || undefined;
        }

        if (!token) {
          throw new Error('No token available');
        }

        const parts = token.split('.');
        if (parts.length === 3 && parts[1]) {
          const payload = JSON.parse(atob(parts[1]));

          return {
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${
              payload.email || payload.sub
            }`,
            desc: 'Supabase User',
            email: payload.email || '',
            homePath: '/dashboard',
            realName: payload.email?.split('@')[0] || 'User',
            roles: ['user'],
            token,
            userId: payload.sub || payload.user_id || '1',
            username: payload.email || `user_${payload.sub}`,
          };
        }

        throw new Error('Invalid token format');
      } catch (error) {
        console.error('Error extracting user info from token:', error);

        // Ultimate fallback
        return {
          avatar: '',
          desc: 'Supabase User',
          email: 'user@example.com',
          homePath: '/dashboard',
          realName: 'User',
          roles: ['user'],
          token: this.session?.access_token || '',
          userId: '1',
          username: 'user',
        };
      }
    },

    /**
     * Smart fetchUserInfo that works for both Supabase and VBen users
     * This should be used in router guards and other places instead of VBen fetchUserInfo
     */
    async fetchUserInfoSmart() {
      try {
        // Check if current user is Supabase authenticated
        if (this.isAuthenticated && this.session?.access_token) {
          // Use Supabase fetchUserInfo
          return await this.fetchUserInfo();
        } else {
          // Check if there's a token in VBen accessStore that might be Supabase
          const { useAccessStore } = await import('@vben/stores');
          const accessStore = useAccessStore();
          const token = accessStore.accessToken;

          if (token?.startsWith('eyJ')) {
            // This looks like a Supabase token, try to decode it
            return this.getUserInfoFromToken();
          } else {
            // Fallback to VBen API
            const vbenUserInfo = await getUserInfoApi();
            const { useUserStore } = await import('@vben/stores');
            const userStore = useUserStore();

            userStore.setUserInfo(vbenUserInfo);
            return vbenUserInfo;
          }
        }
      } catch (error) {
        console.error('Smart fetchUserInfo error:', error);
        // If everything fails, try to get from stored userInfo
        const { useUserStore } = await import('@vben/stores');
        const userStore = useUserStore();
        return userStore.userInfo;
      }
    },

    /**
     * Check if current token/user is from Supabase
     */
    isSupabaseUser() {
      return (
        this.isAuthenticated &&
        !!this.session?.access_token &&
        !!this.user?.email
      );
    },

    // Internal methods
    clearAuth() {
      this.isAuthenticated = false;
      this.session = null;
      this.user = null;
    },

    setSession(session: null | Session) {
      this.session = session;
      this.isAuthenticated = !!session;
    },

    setUser(user: null | User) {
      this.user = user;
    },
  },

  getters: {
    userEmail: (state) => state.user?.email || '',
    userFullName: (state) => state.user?.user_metadata?.full_name || '',
    userAvatar: (state) => state.user?.user_metadata?.avatar_url || '',
  },

  state: (): AuthState => ({
    isAuthenticated: false,
    session: null,
    user: null,
  }),
});
