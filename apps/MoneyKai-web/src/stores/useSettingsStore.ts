import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME_OPTIONS, type ThemeMode } from '../constants/theme';
import { useAuthStore } from './useAuthStore';
import { saveUserAppSettings } from '@/services/firestoreData';
import { requestAutomaticBackup } from '@/services/backupService';
import {
  FALLBACK_INR_EXCHANGE_RATES,
  fetchLatestInrExchangeRates,
  isExchangeRateFresh,
  normalizeExchangeRates,
  type CurrencyExchangeRates,
} from '@/utils/currencyConversion';

type PersistedAppSettings = {
  theme: ThemeMode;
  currency: string;
  currencySymbol: string;
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  tourCompleted: boolean;
};

type TourCompletionMap = Record<string, boolean>;

const persistAppSettings = (settings: PersistedAppSettings) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  void saveUserAppSettings(userId, settings).catch((error) => {
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
  tourCompletedByUserId: TourCompletionMap;
  exchangeRates: CurrencyExchangeRates;
  exchangeRatesUpdatedAt?: string;
  exchangeRatesProvider?: string;
  exchangeRateError?: string;

  // Actions
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  setCurrency: (currency: string, symbol: string) => void;
  refreshExchangeRates: (force?: boolean) => Promise<void>;
  toggleNotifications: () => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  toggleHaptic: () => void;
  setTourCompleted: (completed: boolean) => void;
  setTourCompletedForUser: (userId: string, completed: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      currency: 'INR',
      currencySymbol: '₹',
      notificationsEnabled: true,
      hapticEnabled: true,
      tourCompleted: false,
      tourCompletedByUserId: {},
      exchangeRates: FALLBACK_INR_EXCHANGE_RATES,

      toggleTheme: () =>
        set((state) => {
          const currentIndex = THEME_OPTIONS.findIndex((option) => option.id === state.theme);
          const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % THEME_OPTIONS.length : 0;
          const theme = THEME_OPTIONS[nextIndex].id;
          const next: PersistedAppSettings = {
            theme,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
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
          };
          persistAppSettings(next);
          void requestAutomaticBackup('settings updated');
          return { currency, currencySymbol: symbol };
        }),

      refreshExchangeRates: async (force = false) => {
        const state = get();
        if (!force && isExchangeRateFresh(state.exchangeRatesUpdatedAt)) {
          return;
        }

        try {
          const result = await fetchLatestInrExchangeRates();
          set({
            exchangeRates: result.rates,
            exchangeRatesUpdatedAt: result.fetchedAt,
            exchangeRatesProvider: result.provider,
            exchangeRateError: undefined,
          });
        } catch (error) {
          set({
            exchangeRates: normalizeExchangeRates(state.exchangeRates),
            exchangeRateError: error instanceof Error ? error.message : 'Could not refresh currency rates.',
          });
        }
      },

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
          };
          persistAppSettings(next);
          void requestAutomaticBackup('settings updated');
          return {
            tourCompleted: completed,
            tourCompletedByUserId: {
              ...state.tourCompletedByUserId,
              [userId]: completed,
            },
          };
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
        tourCompletedByUserId: state.tourCompletedByUserId,
        exchangeRates: state.exchangeRates,
        exchangeRatesUpdatedAt: state.exchangeRatesUpdatedAt,
        exchangeRatesProvider: state.exchangeRatesProvider,
        exchangeRateError: state.exchangeRateError,
      }),
    }
  )
);
