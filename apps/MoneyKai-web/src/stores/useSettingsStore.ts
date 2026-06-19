import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_THEME_PALETTE,
  getPaletteForThemeMode,
  getThemeModeForPalette,
  isThemeModeDark,
  type ThemeMode,
  type ThemePaletteId,
} from '../constants/theme';
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
  themePalette: ThemePaletteId;
  darkModeEnabled: boolean;
  dashboardTrendRange: DashboardTrendRange;
  dashboardTrendMetric: DashboardTrendMetric;
  currency: string;
  currencySymbol: string;
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  tourCompleted: boolean;
};

type TourCompletionMap = Record<string, boolean>;
export type DashboardTrendRange = '1d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all';
export type DashboardTrendMetric = 'spending' | 'income' | 'netFlow' | 'transactionCount';

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
  themePalette: ThemePaletteId;
  darkModeEnabled: boolean;
  dashboardTrendRange: DashboardTrendRange;
  dashboardTrendMetric: DashboardTrendMetric;
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
  setThemePalette: (themePalette: ThemePaletteId) => void;
  setDarkModeEnabled: (enabled: boolean) => void;
  setDashboardTrendPreferences: (preferences: Partial<Pick<SettingsState, 'dashboardTrendRange' | 'dashboardTrendMetric'>>) => void;
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
      theme: getThemeModeForPalette(DEFAULT_THEME_PALETTE, true),
      themePalette: DEFAULT_THEME_PALETTE,
      darkModeEnabled: true,
      dashboardTrendRange: '1m',
      dashboardTrendMetric: 'spending',
      currency: 'INR',
      currencySymbol: '₹',
      notificationsEnabled: true,
      hapticEnabled: true,
      tourCompleted: false,
      tourCompletedByUserId: {},
      exchangeRates: FALLBACK_INR_EXCHANGE_RATES,

      toggleTheme: () =>
        set((state) => {
          const darkModeEnabled = !state.darkModeEnabled;
          const theme = getThemeModeForPalette(state.themePalette, darkModeEnabled);
          const next: PersistedAppSettings = {
            theme,
            themePalette: state.themePalette,
            darkModeEnabled,
            dashboardTrendRange: state.dashboardTrendRange,
            dashboardTrendMetric: state.dashboardTrendMetric,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          void requestAutomaticBackup('settings updated');
          return { theme, darkModeEnabled };
        }),

      setTheme: (theme) =>
        set((state) => {
          const themePalette = getPaletteForThemeMode(theme);
          const darkModeEnabled = isThemeModeDark(theme);
          const resolvedTheme = getThemeModeForPalette(themePalette, darkModeEnabled);
          const next: PersistedAppSettings = {
            theme: resolvedTheme,
            themePalette,
            darkModeEnabled,
            dashboardTrendRange: state.dashboardTrendRange,
            dashboardTrendMetric: state.dashboardTrendMetric,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          void requestAutomaticBackup('settings updated');
          return { theme: resolvedTheme, themePalette, darkModeEnabled };
        }),

      setThemePalette: (themePalette) =>
        set((state) => {
          const theme = getThemeModeForPalette(themePalette, state.darkModeEnabled);
          const next: PersistedAppSettings = {
            theme,
            themePalette,
            darkModeEnabled: state.darkModeEnabled,
            dashboardTrendRange: state.dashboardTrendRange,
            dashboardTrendMetric: state.dashboardTrendMetric,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          void requestAutomaticBackup('settings updated');
          return { theme, themePalette };
        }),

      setDarkModeEnabled: (darkModeEnabled) =>
        set((state) => {
          const theme = getThemeModeForPalette(state.themePalette, darkModeEnabled);
          const next: PersistedAppSettings = {
            theme,
            themePalette: state.themePalette,
            darkModeEnabled,
            dashboardTrendRange: state.dashboardTrendRange,
            dashboardTrendMetric: state.dashboardTrendMetric,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          void requestAutomaticBackup('settings updated');
          return { theme, darkModeEnabled };
        }),

      setDashboardTrendPreferences: (preferences) =>
        set((state) => {
          const dashboardTrendRange = preferences.dashboardTrendRange ?? state.dashboardTrendRange;
          const dashboardTrendMetric = preferences.dashboardTrendMetric ?? state.dashboardTrendMetric;
          const next: PersistedAppSettings = {
            theme: state.theme,
            themePalette: state.themePalette,
            darkModeEnabled: state.darkModeEnabled,
            dashboardTrendRange,
            dashboardTrendMetric,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          void requestAutomaticBackup('settings updated');
          return { dashboardTrendRange, dashboardTrendMetric };
        }),

      setCurrency: (currency, symbol) =>
        set((state) => {
          const next: PersistedAppSettings = {
            theme: state.theme,
            themePalette: state.themePalette,
            darkModeEnabled: state.darkModeEnabled,
            dashboardTrendRange: state.dashboardTrendRange,
            dashboardTrendMetric: state.dashboardTrendMetric,
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
            themePalette: state.themePalette,
            darkModeEnabled: state.darkModeEnabled,
            dashboardTrendRange: state.dashboardTrendRange,
            dashboardTrendMetric: state.dashboardTrendMetric,
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
            themePalette: state.themePalette,
            darkModeEnabled: state.darkModeEnabled,
            dashboardTrendRange: state.dashboardTrendRange,
            dashboardTrendMetric: state.dashboardTrendMetric,
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
            themePalette: state.themePalette,
            darkModeEnabled: state.darkModeEnabled,
            dashboardTrendRange: state.dashboardTrendRange,
            dashboardTrendMetric: state.dashboardTrendMetric,
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
            themePalette: state.themePalette,
            darkModeEnabled: state.darkModeEnabled,
            dashboardTrendRange: state.dashboardTrendRange,
            dashboardTrendMetric: state.dashboardTrendMetric,
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
            themePalette: state.themePalette,
            darkModeEnabled: state.darkModeEnabled,
            dashboardTrendRange: state.dashboardTrendRange,
            dashboardTrendMetric: state.dashboardTrendMetric,
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
        themePalette: state.themePalette,
        darkModeEnabled: state.darkModeEnabled,
        currency: state.currency,
        currencySymbol: state.currencySymbol,
        dashboardTrendRange: state.dashboardTrendRange,
        dashboardTrendMetric: state.dashboardTrendMetric,
        notificationsEnabled: state.notificationsEnabled,
        hapticEnabled: state.hapticEnabled,
        tourCompleted: state.tourCompleted,
        tourCompletedByUserId: state.tourCompletedByUserId,
        exchangeRates: state.exchangeRates,
        exchangeRatesUpdatedAt: state.exchangeRatesUpdatedAt,
        exchangeRatesProvider: state.exchangeRatesProvider,
        exchangeRateError: state.exchangeRateError,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<SettingsState> | undefined;
        const themePalette = persistedState?.themePalette ?? getPaletteForThemeMode(persistedState?.theme);
        const darkModeEnabled = persistedState?.darkModeEnabled ?? isThemeModeDark(persistedState?.theme ?? current.theme);
        const theme = getThemeModeForPalette(themePalette, darkModeEnabled);

        return {
          ...current,
          ...persistedState,
          theme,
          themePalette,
          darkModeEnabled,
          dashboardTrendRange: persistedState?.dashboardTrendRange ?? current.dashboardTrendRange,
          dashboardTrendMetric: persistedState?.dashboardTrendMetric ?? current.dashboardTrendMetric,
        };
      },
    }
  )
);
