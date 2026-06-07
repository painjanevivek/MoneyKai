import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '../constants/theme';

interface SettingsState {
  theme: ThemeMode;
  currency: string;
  currencySymbol: string;
  notificationsEnabled: boolean;
  hapticEnabled: boolean;

  // Actions
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setCurrency: (currency: string, symbol: string) => void;
  toggleNotifications: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  toggleHaptic: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      currency: 'INR',
      currencySymbol: '₹',
      notificationsEnabled: true,
      hapticEnabled: true,

      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light',
      })),

      setTheme: (theme) => set({ theme }),

      setCurrency: (currency, symbol) => set({ currency, currencySymbol: symbol }),

      toggleNotifications: () => set((state) => ({
        notificationsEnabled: !state.notificationsEnabled,
      })),

      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      toggleHaptic: () => set((state) => ({
        hapticEnabled: !state.hapticEnabled,
      })),
    }),
    {
      name: 'moneykai-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
