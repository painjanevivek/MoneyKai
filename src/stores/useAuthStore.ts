import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase, isSupabaseConfigured } from '../services/supabase';

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  auth_provider?: 'email' | 'google';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;

  // Actions
  setUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setOnboarded: (onboarded: boolean) => void;
  updateProfile: (updates: Partial<User>) => void;
  /** Called on app start to hydrate session from Supabase (or AsyncStorage). */
  hydrateSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isOnboarded: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      hydrateSession: async () => {
        if (!isSupabaseConfigured()) return;
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        if (session?.user) {
          set({
            user: {
              id: session.user.id,
              email: session.user.email ?? '',
              full_name:
                (session.user.user_metadata?.full_name as string | undefined) ??
                session.user.email ??
                '',
              avatar_url: session.user.user_metadata?.avatar_url as
                | string
                | undefined,
              auth_provider: (session.user.app_metadata?.provider as 'email' | 'google' | undefined) ?? 'email',
            },
            isAuthenticated: true,
          });
        } else {
          set({ user: null, isAuthenticated: false });
        }
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          if (!isSupabaseConfigured()) {
            // ── Demo mode ───────────────────────────────────────────────────
            await new Promise((resolve) => setTimeout(resolve, 600));
            set({
              user: {
                id: 'demo-user-001',
                email,
                full_name: 'Demo User',
                auth_provider: 'email',
              },
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw new Error(error.message);

          const sbUser = data.user;
          set({
            user: {
              id: sbUser.id,
              email: sbUser.email ?? email,
              full_name:
                (sbUser.user_metadata?.full_name as string | undefined) ??
                email,
              avatar_url: sbUser.user_metadata?.avatar_url as
                | string
                | undefined,
              auth_provider: 'email',
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false });
          throw err instanceof Error ? err : new Error('Sign in failed');
        }
      },

      signUp: async (email: string, password: string, fullName: string) => {
        set({ isLoading: true });
        try {
          if (!isSupabaseConfigured()) {
            // ── Demo mode ───────────────────────────────────────────────────
            await new Promise((resolve) => setTimeout(resolve, 800));
            set({
              user: {
                id: 'demo-user-001',
                email,
                full_name: fullName,
                auth_provider: 'email',
              },
              isAuthenticated: true,
              isLoading: false,
              isOnboarded: true,
            });
            return;
          }

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
          });
          if (error) throw new Error(error.message);

          const sbUser = data.user;
          const session = data.session;
          if (!sbUser) {
            set({ isLoading: false });
            throw new Error('Could not create your account.');
          }

          if (!session) {
            set({ isLoading: false });
            throw new Error('Please check your email to confirm your account before signing in.');
          }

          set({
            user: {
              id: sbUser.id,
              email: sbUser.email ?? email,
              full_name: fullName,
              auth_provider: 'email',
            },
            isAuthenticated: true,
            isLoading: false,
            isOnboarded: true,
          });
        } catch (err) {
          set({ isLoading: false });
          throw err instanceof Error ? err : new Error('Sign up failed');
        }
      },

      signInWithGoogle: async () => {
        set({ isLoading: true });
        try {
          if (!isSupabaseConfigured()) {
            // ── Demo mode ───────────────────────────────────────────────────
            // In production wire @react-native-google-signin/google-signin here,
            // obtain the idToken, then call:
            //   supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })
            await new Promise((resolve) => setTimeout(resolve, 800));
            set({
              user: {
                id: 'demo-google-001',
                email: 'demo.google@example.com',
                full_name: 'Google Demo User',
                auth_provider: 'google',
              },
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }

          const redirectTo = Linking.createURL('auth/callback');
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo,
              skipBrowserRedirect: true,
            },
          });
          if (error) throw new Error(error.message);
          if (!data?.url) throw new Error('Could not start Google sign-in.');

          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
          if (result.type !== 'success' || !result.url) {
            throw new Error('Google sign-in was cancelled.');
          }

          const url = new URL(result.url);
          const code = url.searchParams.get('code');
          if (!code) {
            throw new Error('Google sign-in did not return an authorization code.');
          }

          const exchange = await supabase.auth.exchangeCodeForSession(code);
          if (exchange.error) throw new Error(exchange.error.message);

          const sbUser = exchange.data.user;
          if (!sbUser) throw new Error('Google sign-in did not return a user session.');

          set({
            user: {
              id: sbUser.id,
              email: sbUser.email ?? 'google-user@example.com',
              full_name:
                (sbUser.user_metadata?.full_name as string | undefined) ??
                sbUser.email ??
                'Google User',
              avatar_url: sbUser.user_metadata?.avatar_url as string | undefined,
              auth_provider: 'google',
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false });
          throw err instanceof Error ? err : new Error('Google Sign-In failed');
        }
      },

      signOut: async () => {
        if (isSupabaseConfigured()) {
          await supabase.auth.signOut().catch(() => {
            // Ignore network errors during sign-out; local state is cleared regardless.
          });
        }
        // Clear demo seed data from both stores so it doesn't bleed into the next session.
        const { useTransactionStore } = await import('./useTransactionStore');
        const { useNotesStore } = await import('./useNotesStore');
        const { useGroupStore } = await import('./useGroupStore');
        const { useChallengeStore } = await import('./useChallengeStore');
        const { useBadgeStore } = await import('./useBadgeStore');
        const { useNotificationStore } = await import('./useNotificationStore');
        useTransactionStore.getState().clearSeedData();
        useNotesStore.getState().clearSeedData();
        useGroupStore.setState({ groups: [], expenses: [] });
        useChallengeStore.setState({ challenges: [], totalXP: 0 });
        useBadgeStore.setState({ badges: [], recentUnlock: null });
        useNotificationStore.getState().clearNotifications();
        set({ user: null, isAuthenticated: false });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setOnboarded: (onboarded) => set({ isOnboarded: onboarded }),

      updateProfile: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'smartpaisa-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isOnboarded: state.isOnboarded,
      }),
    }
  )
);
