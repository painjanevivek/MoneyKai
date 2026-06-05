import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  signOut: () => void;
  setLoading: (loading: boolean) => void;
  setOnboarded: (onboarded: boolean) => void;
  updateProfile: (updates: Partial<User>) => void;
}

// Demo user for offline/demo mode
const DEMO_USER: User = {
  id: 'demo-user-001',
  email: 'aditya@example.com',
  full_name: 'Aditya Sharma',
  avatar_url: undefined,
  auth_provider: 'email',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isOnboarded: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      signIn: async (email: string, _password: string) => {
        set({ isLoading: true });
        try {
          // In demo mode, simulate sign-in
          await new Promise(resolve => setTimeout(resolve, 800));
          set({
            user: { ...DEMO_USER, email, auth_provider: 'email' },
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
          throw new Error('Sign in failed');
        }
      },

      signUp: async (email: string, _password: string, fullName: string) => {
        set({ isLoading: true });
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          set({
            user: { ...DEMO_USER, email, full_name: fullName, auth_provider: 'email' },
            isAuthenticated: true,
            isLoading: false,
            isOnboarded: true,
          });
        } catch {
          set({ isLoading: false });
          throw new Error('Sign up failed');
        }
      },

      signInWithGoogle: async () => {
        set({ isLoading: true });
        try {
          // In demo mode, simulate Google Sign-In with a delay
          // In production, this would use @react-native-google-signin/google-signin
          // and pass the idToken to Supabase via supabase.auth.signInWithIdToken()
          await new Promise(resolve => setTimeout(resolve, 1200));
          set({
            user: {
              id: 'google-user-001',
              email: 'aditya.sharma@gmail.com',
              full_name: 'Aditya Sharma',
              avatar_url: undefined,
              auth_provider: 'google',
            },
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          set({ isLoading: false });
          throw new Error('Google Sign-In failed');
        }
      },

      signOut: () => {
        set({ user: null, isAuthenticated: false });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setOnboarded: (onboarded) => set({ isOnboarded: onboarded }),

      updateProfile: (updates) => set((state) => ({
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
