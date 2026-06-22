import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_THEME_PALETTE,
  getDefaultedThemePalette,
  getPaletteForThemeMode,
  getThemeModeForPalette,
  isThemeModeDark,
  type ThemeMode,
  type ThemePaletteId,
} from '../constants/theme';
import { useAuthStore } from './useAuthStore';
import { saveUserAppSettings } from '@/services/firestoreData';
import { queueAutomaticBackup } from '@/services/automaticBackupClient';
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
  dashboardTrendChartType: DashboardTrendChartType;
  currency: string;
  currencySymbol: string;
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  tourCompleted: boolean;
};

type TourCompletionMap = Record<string, boolean>;
export type DashboardTrendRange = '1d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all';
export type DashboardTrendMetric = 'spending' | 'income' | 'netFlow' | 'transactionCount';
export type DashboardTrendChartType = 'line' | 'bar' | 'donut';

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
  dashboardTrendChartType: DashboardTrendChartType;
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
  setDashboardTrendPreferences: (preferences: Partial<Pick<SettingsState, 'dashboardTrendRange' | 'dashboardTrendMetric' | 'dashboardTrendChartType'>>) => void;
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
      dashboardTrendChartType: 'line',
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
            dashboardTrendChartType: state.dashboardTrendChartType,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          queueAutomaticBackup('settings updated');
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
            dashboardTrendChartType: state.dashboardTrendChartType,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          queueAutomaticBackup('settings updated');
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
            dashboardTrendChartType: state.dashboardTrendChartType,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          queueAutomaticBackup('settings updated');
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
            dashboardTrendChartType: state.dashboardTrendChartType,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          queueAutomaticBackup('settings updated');
          return { theme, darkModeEnabled };
        }),

      setDashboardTrendPreferences: (preferences) =>
        set((state) => {
          const dashboardTrendRange = preferences.dashboardTrendRange ?? state.dashboardTrendRange;
          const dashboardTrendMetric = preferences.dashboardTrendMetric ?? state.dashboardTrendMetric;
          const dashboardTrendChartType = preferences.dashboardTrendChartType ?? state.dashboardTrendChartType;
          const next: PersistedAppSettings = {
            theme: state.theme,
            themePalette: state.themePalette,
            darkModeEnabled: state.darkModeEnabled,
            dashboardTrendRange,
            dashboardTrendMetric,
            dashboardTrendChartType,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          queueAutomaticBackup('settings updated');
          return { dashboardTrendRange, dashboardTrendMetric, dashboardTrendChartType };
        }),

      setCurrency: (currency, symbol) =>
        set((state) => {
          const next: PersistedAppSettings = {
            theme: state.theme,
            themePalette: state.themePalette,
            darkModeEnabled: state.darkModeEnabled,
            dashboardTrendRange: state.dashboardTrendRange,
            dashboardTrendMetric: state.dashboardTrendMetric,
            dashboardTrendChartType: state.dashboardTrendChartType,
            currency,
            currencySymbol: symbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          queueAutomaticBackup('settings updated');
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
            dashboardTrendChartType: state.dashboardTrendChartType,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: !state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          queueAutomaticBackup('settings updated');
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
            dashboardTrendChartType: state.dashboardTrendChartType,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: enabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          queueAutomaticBackup('settings updated');
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
            dashboardTrendChartType: state.dashboardTrendChartType,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: !state.hapticEnabled,
            tourCompleted: state.tourCompleted,
          };
          persistAppSettings(next);
          queueAutomaticBackup('settings updated');
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
            dashboardTrendChartType: state.dashboardTrendChartType,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: completed,
          };
          persistAppSettings(next);
          queueAutomaticBackup('settings updated');
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
            dashboardTrendChartType: state.dashboardTrendChartType,
            currency: state.currency,
            currencySymbol: state.currencySymbol,
            notificationsEnabled: state.notificationsEnabled,
            hapticEnabled: state.hapticEnabled,
            tourCompleted: completed,
          };
          persistAppSettings(next);
          queueAutomaticBackup('settings updated');
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
        dashboardTrendChartType: state.dashboardTrendChartType,
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
        const themePalette = getDefaultedThemePalette(persistedState?.themePalette, persistedState?.theme);
        const migratedToDefault = themePalette === DEFAULT_THEME_PALETTE && persistedState?.themePalette !== DEFAULT_THEME_PALETTE;
        const darkModeEnabled = migratedToDefault
          ? true
          : persistedState?.darkModeEnabled ?? isThemeModeDark(persistedState?.theme ?? current.theme);
        const theme = getThemeModeForPalette(themePalette, darkModeEnabled);

        return {
          ...current,
          ...persistedState,
          theme,
          themePalette,
          darkModeEnabled,
          dashboardTrendRange: persistedState?.dashboardTrendRange ?? current.dashboardTrendRange,
          dashboardTrendMetric: persistedState?.dashboardTrendMetric ?? current.dashboardTrendMetric,
          dashboardTrendChartType: persistedState?.dashboardTrendChartType ?? current.dashboardTrendChartType,
        };
      },
    }
  )
);
