import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured, waitForAuthState } from '../services/firebase';
import { isBackendConfigured } from '@/services/backendApi';

export interface User {
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
  setUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setOnboarded: (onboarded: boolean) => void;
  updateProfile: (updates: Partial<User>) => void;
  hydrateSession: () => Promise<void>;
}

const toAppUser = (user: import('firebase/auth').User): User => {
  const providerId = user.providerData.find((provider) => provider.providerId === 'google.com')
    ? 'google'
    : 'email';

  return {
    id: user.uid,
    email: user.email ?? '',
    full_name: user.displayName ?? user.email ?? 'User',
    avatar_url: user.photoURL ?? undefined,
    auth_provider: providerId,
  };
};

const hydrateBackendSnapshot = async () => {
  if (!isBackendConfigured()) {
    return;
  }

  try {
    const { syncRemoteState } = await import('@/services/remoteSync');
    await syncRemoteState();
  } catch (error) {
    if (__DEV__) {
      console.warn('[MoneyKai] backend sync failed:', error);
    }
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isOnboarded: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      hydrateSession: async () => {
        if (!isFirebaseConfigured()) {
          return;
        }

        const sessionUser = await waitForAuthState();
        if (sessionUser) {
          set({ user: toAppUser(sessionUser), isAuthenticated: true });
          await hydrateBackendSnapshot();
        } else {
          set({ user: null, isAuthenticated: false });
        }
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          if (!isFirebaseConfigured()) {
            await new Promise((resolve) => setTimeout(resolve, 600));
          set({
            user: {
              id: 'sample-user-001',
              email,
              full_name: 'Sample User',
              auth_provider: 'email',
            },
            isAuthenticated: true,
            isLoading: false,
            isOnboarded: false,
          });
          return;
        }

          const credentials = await signInWithEmailAndPassword(firebaseAuth, email, password);
          set({
            user: toAppUser(credentials.user),
            isAuthenticated: true,
            isLoading: false,
          });

          await hydrateBackendSnapshot();
        } catch (err) {
          set({ isLoading: false });
          throw err instanceof Error ? err : new Error('Sign in failed');
        }
      },

      signUp: async (email: string, password: string, fullName: string) => {
        set({ isLoading: true });
        try {
          if (!isFirebaseConfigured()) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          set({
            user: {
              id: 'sample-user-001',
              email,
              full_name: fullName,
              auth_provider: 'email',
            },
            isAuthenticated: true,
            isLoading: false,
            isOnboarded: false,
          });
          return;
        }

          const credentials = await createUserWithEmailAndPassword(firebaseAuth, email, password);
          await updateFirebaseProfile(credentials.user, {
            displayName: fullName.trim(),
          });

          set({
            user: {
              ...toAppUser(credentials.user),
              full_name: fullName.trim(),
            },
            isAuthenticated: true,
            isLoading: false,
            isOnboarded: true,
          });

          await hydrateBackendSnapshot();
        } catch (err) {
          set({ isLoading: false });
          throw err instanceof Error ? err : new Error('Sign up failed');
        }
      },

      signInWithGoogle: async () => {
        set({ isLoading: true });
        try {
          if (!isFirebaseConfigured()) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          set({
            user: {
              id: 'sample-google-001',
              email: 'sample.google@example.com',
              full_name: 'Google User',
              auth_provider: 'google',
            },
            isAuthenticated: true,
            isLoading: false,
            isOnboarded: false,
          });
          return;
        }

          if (Platform.OS !== 'web') {
            throw new Error('Google sign-in is only enabled on web right now. Use email login on mobile until native Google auth is configured.');
          }

          const provider = new GoogleAuthProvider();
          const credentials = await signInWithPopup(firebaseAuth, provider);

          set({
            user: toAppUser(credentials.user),
            isAuthenticated: true,
            isLoading: false,
          });

          await hydrateBackendSnapshot();
        } catch (err) {
          set({ isLoading: false });
          throw err instanceof Error ? err : new Error('Google sign-in failed');
        }
      },

      signOut: async () => {
        set({ user: null, isAuthenticated: false, isLoading: false, isOnboarded: false });

        const cleanup = async () => {
          const { resetLocalAppState } = await import('@/services/remoteSync');
          resetLocalAppState();

          if (isFirebaseConfigured()) {
            await firebaseSignOut(firebaseAuth).catch(() => {
              // Local sign-out already happened; ignore network cleanup failures.
            });
          }
        };

        await cleanup().catch(() => {
          // Best effort cleanup only.
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setOnboarded: (onboarded) => set({ isOnboarded: onboarded }),

      updateProfile: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'moneykai-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isOnboarded: state.isOnboarded,
      }),
    }
  )
);
