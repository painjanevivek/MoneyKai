import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmail,
  isFirebaseConfigured,
  signInWithEmail,
  signOutFromFirebase,
  updateFirebaseUserProfile,
  waitForAuthState,
  type NativeFirebaseUser,
} from '@/services/authService';
import { isDemoModeEnabled } from '@/config/environment';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  auth_provider?: 'email' | 'google';
  dob?: string;
  gender?: 'female' | 'male' | 'non_binary' | 'prefer_not_to_say' | 'self_describe';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  isHydratingSession: boolean;
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

const toAppUser = (user: NativeFirebaseUser): User => {
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isOnboarded: false,
      isHydratingSession: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      hydrateSession: async () => {
        set({ isHydratingSession: true });

        if (isDemoModeEnabled()) {
          set((state) => ({
            isAuthenticated: !!state.user,
            isHydratingSession: false,
          }));
          return;
        }

        if (!isFirebaseConfigured()) {
          set({ isHydratingSession: false });
          return;
        }

        try {
          const sessionUser = await waitForAuthState();
          if (sessionUser) {
            set({ user: toAppUser(sessionUser), isAuthenticated: true });
            const { syncRemoteState } = await import('@/services/remoteSync');
            await syncRemoteState();
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } finally {
          set({ isHydratingSession: false });
        }
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          if (isDemoModeEnabled()) {
            await new Promise<void>((resolve) => setTimeout(() => resolve(), 600));
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

          if (!isFirebaseConfigured()) {
            throw new Error('Firebase is not configured. Add Firebase auth keys to enable sign in.');
          }

          const credentials = await signInWithEmail(email, password);
          set({
            user: toAppUser(credentials.user),
            isAuthenticated: true,
            isLoading: false,
          });

          const { syncRemoteState } = await import('@/services/remoteSync');
          await syncRemoteState();
        } catch (err) {
          set({ isLoading: false });
          throw err instanceof Error ? err : new Error('Sign in failed');
        }
      },

      signUp: async (email: string, password: string, fullName: string) => {
        set({ isLoading: true });
        try {
          if (isDemoModeEnabled()) {
            await new Promise<void>((resolve) => setTimeout(() => resolve(), 800));
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

          if (!isFirebaseConfigured()) {
            throw new Error('Firebase is not configured. Add Firebase auth keys to enable sign up.');
          }

          const credentials = await createUserWithEmail(email, password, fullName);
          await updateFirebaseUserProfile(credentials.user, {
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

          const { syncRemoteState } = await import('@/services/remoteSync');
          await syncRemoteState();
        } catch (err) {
          set({ isLoading: false });
          throw err instanceof Error ? err : new Error('Sign up failed');
        }
      },

      signInWithGoogle: async () => {
        set({ isLoading: true });
        try {
          if (isDemoModeEnabled()) {
            await new Promise<void>((resolve) => setTimeout(() => resolve(), 800));
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

          if (!isFirebaseConfigured()) {
            throw new Error('Firebase is not configured. Add Firebase auth keys to enable Google sign in.');
          }

          const { signInWithGoogleAsync } = await import('@/services/googleAuth');
          const user = await signInWithGoogleAsync();

          set({
            user: toAppUser(user),
            isAuthenticated: true,
            isLoading: false,
          });

          const { syncRemoteState } = await import('@/services/remoteSync');
          await syncRemoteState();
        } catch (err) {
          set({ isLoading: false });
          throw err instanceof Error ? err : new Error('Google sign-in failed');
        }
      },

      signOut: async () => {
        const cleanup = async () => {
          if (isFirebaseConfigured()) {
            await signOutFromFirebase().catch(() => {
              // Local sign-out already happened; ignore network cleanup failures.
            });
          }

          const { clearTransientSessionState, resetLocalAppState } = await import('@/services/remoteSync');
          await clearTransientSessionState();
          resetLocalAppState();
        };

        await cleanup().catch(() => {
          // Best effort cleanup only.
        });
        set({ user: null, isAuthenticated: false, isLoading: false, isOnboarded: false });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setOnboarded: (onboarded) => set({ isOnboarded: onboarded }),

      updateProfile: (updates) =>
        set((state) => {
          const nextUser = state.user ? { ...state.user, ...updates } : null;
          if (nextUser) {
            void import('@/services/backupService')
              .then(({ requestAutomaticBackup }) => requestAutomaticBackup('profile updated'))
              .catch(() => undefined);
          }
          return { user: nextUser };
        }),
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
