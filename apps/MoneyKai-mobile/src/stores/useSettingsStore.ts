import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '../constants/theme';
import { backendApi, isBackendConfigured } from '@/services/backendApi';
import { queueSyncOperation } from '@/services/syncQueue';
import { requestAutomaticBackup } from '@/services/backupService';

export type PersistedAppSettings = {
  theme: ThemeMode;
  currency: string;
  currencySymbol: string;
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  tourCompleted: boolean;
  appLockEnabled: boolean;
};

type TourCompletionMap = Record<string, boolean>;

const persistAppSettings = (settings: PersistedAppSettings) => {
  if (!isBackendConfigured()) {
    return;
  }

  void backendApi.updateAppSettings(settings).catch((error) => {
    if (__DEV__) {
      console.warn('[MoneyKai] failed to sync app settings:', error);
    }
    void queueSyncOperation({ kind: 'appSettings', payload: settings });
  });
};

interface SettingsState {
  theme: ThemeMode;
  currency: string;
  currencySymbol: string;
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  tourCompleted: boolean;
  appLockEnabled: boolean;
  tourCompletedByUserId: TourCompletionMap;

  // Actions
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setCurrency: (currency: string, symbol: string) => void;
  toggleNotifications: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  toggleHaptic: () => void;
  setTourCompleted: (completed: boolean) => void;
  setTourCompletedForUser: (userId: string, completed: boolean) => void;
  setAppLockEnabled: (enabled: boolean) => void;
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
      appLockEnabled: false,
      tourCompletedByUserId: {},

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
            appLockEnabled: state.appLockEnabled,
          };
          persistAppSettings(next);
          void requestAutomaticBackup('settings updated');
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
            appLockEnabled: state.appLockEnabled,
          };
          persistAppSettings(next);
          void requestAutomaticBackup('settings updated');
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
            appLockEnabled: state.appLockEnabled,
          };
          persistAppSettings(next);
          void requestAutomaticBackup('settings updated');
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
            appLockEnabled: state.appLockEnabled,
          };
          persistAppSettings(next);
          void requestAutomaticBackup('settings updated');
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
            appLockEnabled: state.appLockEnabled,
          };
          persistAppSettings(next);
          void requestAutomaticBackup('settings updated');
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
            appLockEnabled: state.appLockEnabled,
          };
          persistAppSettings(next);
          void requestAutomaticBackup('settings updated');
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
            appLockEnabled: state.appLockEnabled,
          };
          persistAppSettings(next);
          void requestAutomaticBackup('settings updated');
          return { tourCompleted: completed };
        }),

      setTourCompletedForUser: (userId, completed) =>
        set((state) => {
          const next: PersistedAppSettings = {
            theme: state.theme,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: completed,
            appLockEnabled: state.appLockEnabled,
          };
          persistAppSettings(next);
          return {
            tourCompleted: completed,
            tourCompletedByUserId: {
              ...state.tourCompletedByUserId,
              [userId]: completed,
            },
          };
        }),

      setAppLockEnabled: (enabled) =>
        set((state) => {
          const next: PersistedAppSettings = {
            theme: state.theme,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
            appLockEnabled: enabled,
          };
          persistAppSettings(next);
          void requestAutomaticBackup('settings updated');
          return { appLockEnabled: enabled };
        }),
    }),
    {
      name: 'moneykai-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        currency: state.currency,
        currencySymbol: state.currencySymbol,
        notificationsEnabled: state.notificationsEnabled,
        hapticEnabled: state.hapticEnabled,
        tourCompleted: state.tourCompleted,
        appLockEnabled: state.appLockEnabled,
        tourCompletedByUserId: state.tourCompletedByUserId,
      }),
    }
  )
);
