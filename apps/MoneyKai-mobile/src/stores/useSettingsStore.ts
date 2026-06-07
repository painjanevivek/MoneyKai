import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '../constants/theme';
import { backendApi, isBackendConfigured } from '@/services/backendApi';

type PersistedAppSettings = {
  theme: ThemeMode;
  currency: string;
  currencySymbol: string;
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  tourCompleted: boolean;
};

const persistAppSettings = (settings: PersistedAppSettings) => {
  if (!isBackendConfigured()) {
    return;
  }

  void backendApi.updateAppSettings(settings).catch((error) => {
    if (__DEV__) {
      console.warn('[MoneyKai] failed to sync app settings:', error);
    }
  });
};

interface SettingsState {
  theme: ThemeMode;
  currency: string;
  currencySymbol: string;
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  tourCompleted: boolean;

  // Actions
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setCurrency: (currency: string, symbol: string) => void;
  toggleNotifications: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  toggleHaptic: () => void;
  setTourCompleted: (completed: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      currency: 'INR',
      currencySymbol: '₹',
      notificationsEnabled: true,
      hapticEnabled: true,
      tourCompleted: false,

      toggleTheme: () =>
        set((state) => {
          const theme: ThemeMode = state.theme === 'light' ? 'dark' : 'light';
          const next: PersistedAppSettings = {
            theme,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          return { theme };
        }),

      setTheme: (theme) =>
        set((state) => {
          const next: PersistedAppSettings = {
            theme,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          return { theme };
        }),

      setCurrency: (currency, symbol) =>
        set((state) => {
          const next: PersistedAppSettings = {
            theme: state.theme,
            currency,
            currencySymbol: symbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          return { currency, currencySymbol: symbol };
        }),

      toggleNotifications: () =>
        set((state) => {
          const next: PersistedAppSettings = {
            theme: state.theme,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: !state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          return { notificationsEnabled: next.notificationsEnabled };
        }),

      setNotificationsEnabled: (enabled) =>
        set((state) => {
          const next: PersistedAppSettings = {
            theme: state.theme,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: enabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          return { notificationsEnabled: enabled };
        }),

      toggleHaptic: () =>
        set((state) => {
          const next: PersistedAppSettings = {
            theme: state.theme,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: !state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          return { hapticEnabled: next.hapticEnabled };
        }),

      setTourCompleted: (completed) =>
        set((state) => {
          const next: PersistedAppSettings = {
            theme: state.theme,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: completed,
          };
          persistAppSettings(next);
          return { tourCompleted: completed };
        }),
    }),
    {
      name: 'moneykai-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
