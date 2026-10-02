import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { invalidateRemoteSyncSession } from '@moneykai/domain/syncSession';
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
  onboardedUserId: string | null;
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

const discardSplashUnlock = async () => {
  const { clearDeviceOwnerVerification, consumeSplashAppLockResult } = await import('@/services/deviceOwnerAuthentication');
  clearDeviceOwnerVerification();
  await consumeSplashAppLockResult().catch(() => undefined);
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isOnboarded: false,
      onboardedUserId: null,
      isHydratingSession: true,

      setUser: (user) => {
        invalidateRemoteSyncSession();
        set((state) => ({
          user,
          isAuthenticated: !!user,
          isOnboarded: user?.id === state.onboardedUserId && state.isOnboarded,
        }));
      },

      hydrateSession: async () => {
        invalidateRemoteSyncSession();
        set({ isHydratingSession: true });
        try {
          const { waitForHomeStateHydration, waitForLocalStateHydration, waitForPersistedStore } = await import('@/services/localStateHydration');
          const homeStateReady = Promise.all([
            waitForPersistedStore(useAuthStore),
            waitForHomeStateHydration(),
          ]);
          const localStateReady = Promise.all([
            waitForPersistedStore(useAuthStore),
            waitForLocalStateHydration(),
          ]);

          if (isDemoModeEnabled()) {
            await homeStateReady;
            if (!get().user) await discardSplashUnlock();
            set((state) => ({ isAuthenticated: !!state.user }));
            return;
          }

          if (!isFirebaseConfigured()) {
            await homeStateReady;
            await discardSplashUnlock();
            set({ user: null, isAuthenticated: false });
            return;
          }

          const sessionUserPromise = waitForAuthState();
          await homeStateReady;
          const sessionUser = await sessionUserPromise;
          if (sessionUser) {
            const sameAccount = get().user?.id === sessionUser.uid;
            if (!sameAccount) {
              await localStateReady;
              const { resetLocalAppState } = await import('@/services/remoteSync');
              resetLocalAppState();
              await discardSplashUnlock();
            }
            set({ user: toAppUser(sessionUser), isAuthenticated: true });
            // Local stores are ready; a cloud refresh must not hold the opening screen.
            void localStateReady.then(() => import('@/services/remoteSync'))
              .then(({ syncRemoteState }) => syncRemoteState({ force: true, keepLocalData: sameAccount }))
              .catch(() => undefined);
          } else {
            await localStateReady;
            await discardSplashUnlock();
            const { resetLocalAppState } = await import('@/services/remoteSync');
            resetLocalAppState();
            set({ user: null, isAuthenticated: false });
          }
        } catch {
          // Never expose a persisted account that Firebase could not verify.
          await discardSplashUnlock();
          set({ user: null, isAuthenticated: false });
        } finally {
          set({ isHydratingSession: false });
        }
      },

      signIn: async (email: string, password: string) => {
        invalidateRemoteSyncSession();
        set({ isLoading: true });
        try {
          if (isDemoModeEnabled()) {
            await new Promise<void>((resolve) => setTimeout(() => resolve(), 600));
            await discardSplashUnlock();
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
              onboardedUserId: null,
            });
            return;
          }

          if (!isFirebaseConfigured()) {
            throw new Error('Firebase is not configured. Add Firebase auth keys to enable sign in.');
          }

          const credentials = await signInWithEmail(email, password);
          await discardSplashUnlock();
          set({
            user: toAppUser(credentials.user),
            isAuthenticated: true,
            isLoading: false,
            isOnboarded: false,
            onboardedUserId: null,
          });

          const { syncRemoteState } = await import('@/services/remoteSync');
          await syncRemoteState();
        } catch (err) {
          set({ isLoading: false });
          throw err instanceof Error ? err : new Error('Sign in failed');
        }
      },

      signUp: async (email: string, password: string, fullName: string) => {
        invalidateRemoteSyncSession();
        set({ isLoading: true });
        try {
          if (isDemoModeEnabled()) {
            await new Promise<void>((resolve) => setTimeout(() => resolve(), 800));
            await discardSplashUnlock();
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
              onboardedUserId: null,
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

          await discardSplashUnlock();
          set({
            user: {
              ...toAppUser(credentials.user),
              full_name: fullName.trim(),
            },
            isAuthenticated: true,
            isLoading: false,
            isOnboarded: false,
            onboardedUserId: null,
          });

          const { syncRemoteState } = await import('@/services/remoteSync');
          await syncRemoteState();
        } catch (err) {
          set({ isLoading: false });
          throw err instanceof Error ? err : new Error('Sign up failed');
        }
      },

      signInWithGoogle: async () => {
        invalidateRemoteSyncSession();
        set({ isLoading: true });
        try {
          if (isDemoModeEnabled()) {
            await new Promise<void>((resolve) => setTimeout(() => resolve(), 800));
            await discardSplashUnlock();
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
              onboardedUserId: null,
            });
            return;
          }

          if (!isFirebaseConfigured()) {
            throw new Error('Firebase is not configured. Add Firebase auth keys to enable Google sign in.');
          }

          const { signInWithGoogleAsync } = await import('@/services/googleAuth');
          const user = await signInWithGoogleAsync();

          await discardSplashUnlock();
          set({
            user: toAppUser(user),
            isAuthenticated: true,
            isLoading: false,
            isOnboarded: false,
            onboardedUserId: null,
          });

          const { syncRemoteState } = await import('@/services/remoteSync');
          await syncRemoteState();
        } catch (err) {
          set({ isLoading: false });
          throw err instanceof Error ? err : new Error('Google sign-in failed');
        }
      },

      signOut: async () => {
        invalidateRemoteSyncSession();
        const cleanup = async () => {
          if (isFirebaseConfigured()) {
            await signOutFromFirebase().catch(() => {
              // Local sign-out already happened; ignore network cleanup failures.
            });
          }

          const { clearTransientSessionState, resetLocalAppState } = await import('@/services/remoteSync');
          await clearTransientSessionState();
          resetLocalAppState();
          const { syncSplashAppLockEnabled } = await import('@/services/deviceOwnerAuthentication');
          await syncSplashAppLockEnabled(false);
        };

        await cleanup().catch(() => {
          // Best effort cleanup only.
        });
        set({ user: null, isAuthenticated: false, isLoading: false, isOnboarded: false, onboardedUserId: null });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setOnboarded: (onboarded) =>
        set((state) => ({
          isOnboarded: onboarded,
          onboardedUserId: onboarded ? state.user?.id ?? null : null,
        })),

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
        onboardedUserId: state.onboardedUserId,
      }),
    }
  )
);
