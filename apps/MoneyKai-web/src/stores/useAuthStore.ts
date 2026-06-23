import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { queueAutomaticBackup } from '@/services/automaticBackupClient';

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

const getAuthErrorCode = (error: unknown): string => {
  if (typeof error === 'object' && error && 'code' in error) {
    return String((error as { code?: string }).code ?? '');
  }

  return '';
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
        set({ isLoading: true });
        try {
          const { firebaseAuth, isFirebaseConfigured, signInWithEmailAndPassword } = await getFirebaseRuntime();
          if (!isFirebaseConfigured()) {
            throw new Error('Firebase Authentication is not configured for this MoneyKai deployment.');
          }

          const credentials = await signInWithEmailAndPassword(firebaseAuth, email, password);
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
          const {
            createUserWithEmailAndPassword,
            firebaseAuth,
            isFirebaseConfigured,
            updateProfile: updateFirebaseProfile,
          } = await getFirebaseRuntime();
          if (!isFirebaseConfigured()) {
            throw new Error('Firebase Authentication is not configured for this MoneyKai deployment.');
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
          const { firebaseAuth, GoogleAuthProvider, isFirebaseConfigured, signInWithPopup } = await getFirebaseRuntime();
          if (!isFirebaseConfigured()) {
            throw new Error('Firebase Authentication is not configured for this MoneyKai deployment.');
          }

          if (Platform.OS !== 'web') {
            throw new Error('Google sign-in is only enabled on web right now. Use email login on mobile until native Google auth is configured.');
          }

          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });

          try {
            const credentials = await signInWithPopup(firebaseAuth, provider);

            set({
              user: toAppUser(credentials.user),
              isAuthenticated: true,
              isLoading: false,
            });

            const { syncRemoteState } = await import('@/services/remoteSync');
            await syncRemoteState();
          } catch (error) {
            const code = getAuthErrorCode(error);
            if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
              throw new Error(
                'Google sign-in was blocked or cancelled. Allow popups for MoneyKai, then try again, or use email login.'
              );
            }

            if (code === 'auth/unauthorized-domain') {
              throw new Error('Add moneykai.com and www.moneykai.com to Firebase Authentication > Authorized domains in Firebase Console, then retry Google sign-in.');
            }

            throw error;
          }
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
