import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queueAutomaticBackup } from '@/services/automaticBackupClient';
import {
  assertAuthAttemptAllowed,
  clearAuthRateLimit,
  consumeAuthAttempt,
  recordFailedAuthAttempt,
} from '@/services/authRateLimit';

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
  signOut: (options?: { skipFinalBackup?: boolean }) => Promise<void>;
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

const getFirebaseRuntime = async () => {
  const [authModule, firebaseModule] = await Promise.all([
    import('firebase/auth'),
    import('../services/firebase'),
  ]);

  return {
    ...authModule,
    ...firebaseModule,
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

        const { isFirebaseConfigured, waitForAuthState } = await getFirebaseRuntime();

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
        const normalizedEmail = email.trim().toLowerCase();
        set({ isLoading: true });
        try {
          await assertAuthAttemptAllowed('sign-in', normalizedEmail);
          const { isFirebaseConfigured } = await getFirebaseRuntime();
          if (!isFirebaseConfigured()) {
            throw new Error('Firebase Authentication is not configured for this MoneyKai deployment.');
          }

          let credentials: import('firebase/auth').UserCredential;
          try {
            const { signInWithEmailGateway } = await import('@/services/authGateway');
            credentials = await signInWithEmailGateway(normalizedEmail, password);
          } catch (authError) {
            await recordFailedAuthAttempt('sign-in', normalizedEmail);
            throw authError;
          }

          await clearAuthRateLimit('sign-in', normalizedEmail);
          set({
            user: toAppUser(credentials.user),
            isAuthenticated: true,
            isLoading: false,
          });

          const { syncRemoteState } = await import('@/services/remoteSync');
          await syncRemoteState().catch((syncError) => {
            if (__DEV__) {
              console.warn('[MoneyKai] Sign-in completed but remote sync failed:', syncError);
            }
          });
        } catch (err) {
          set({ isLoading: false });
          throw err instanceof Error ? err : new Error('Sign in failed');
        }
      },

      signUp: async (email: string, password: string, fullName: string) => {
        const normalizedEmail = email.trim().toLowerCase();
        set({ isLoading: true });
        try {
          const { isFirebaseConfigured } = await getFirebaseRuntime();
          if (!isFirebaseConfigured()) {
            throw new Error('Firebase Authentication is not configured for this MoneyKai deployment.');
          }

          await consumeAuthAttempt('sign-up', normalizedEmail);
          const { createUserWithEmailGateway } = await import('@/services/authGateway');
          const credentials = await createUserWithEmailGateway(normalizedEmail, password, fullName);

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
          const { isFirebaseConfigured } = await getFirebaseRuntime();
          if (!isFirebaseConfigured()) {
            throw new Error('Firebase Authentication is not configured for this MoneyKai deployment.');
          }

          await consumeAuthAttempt('google-sign-in', 'google');
          const authGateway = await import('@/services/authGateway');
          let authorizationUrl: string | null = null;

          try {
            authorizationUrl = await authGateway.startGoogleOAuthGateway('/dashboard');
          } catch (gatewayError) {
            if (!authGateway.isRecoverableGoogleAuthGatewayError(gatewayError)) {
              throw gatewayError;
            }

            const { signInWithGoogleFirebase } = await import('@/services/googleWebAuth');
            const credentials = await signInWithGoogleFirebase();

            if (!credentials) {
              set({ isLoading: false });
              return;
            }

            await clearAuthRateLimit('google-sign-in', 'google');
            set({
              user: toAppUser(credentials.user),
              isAuthenticated: true,
              isLoading: false,
            });

            const { syncRemoteState } = await import('@/services/remoteSync');
            await syncRemoteState();
            return;
          }

          set({ isLoading: false });

          if (typeof window === 'undefined') {
            throw new Error('Google sign-in requires a browser window.');
          }

          window.location.assign(authorizationUrl);
        } catch (err) {
          set({ isLoading: false });
          throw err instanceof Error ? err : new Error('Google sign-in failed');
        }
      },

      signOut: async (options) => {
        const cleanup = async () => {
          const { firebaseAuth, isFirebaseConfigured, signOut: firebaseSignOut } = await getFirebaseRuntime();

          if (isFirebaseConfigured()) {
            await firebaseSignOut(firebaseAuth).catch(() => {
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
            queueAutomaticBackup('profile updated');
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
