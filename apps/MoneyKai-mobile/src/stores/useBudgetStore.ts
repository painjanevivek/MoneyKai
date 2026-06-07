import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BudgetSettings, BudgetAdjustment } from '../types/budget';
import { backendApi, isBackendConfigured } from '@/services/backendApi';

const persistBudgetSettings = (state: {
  settings: BudgetSettings;
  adjustments: BudgetAdjustment[];
  isEmergencyMode: boolean;
  resetHistory: { date: string; amount: number; carryForward: number }[];
}) => {
  if (!isBackendConfigured()) {
    return;
  }

  void backendApi.updateBudgetSettings(state).catch((error) => {
    if (__DEV__) {
      console.warn('[MoneyKai] failed to sync budget settings:', error);
    }
  });
};

interface BudgetState {
  settings: BudgetSettings;
  adjustments: BudgetAdjustment[];
  isEmergencyMode: boolean;
  resetHistory: { date: string; amount: number; carryForward: number }[];

  // Actions
  updateSettings: (updates: Partial<BudgetSettings>) => void;
  addAdjustment: (adjustment: BudgetAdjustment) => void;
  toggleEmergencyMode: () => void;
  setEmergencyMode: (active: boolean) => void;
  addResetRecord: (amount: number, carryForward: number) => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      settings: {
        monthly_allowance: 0,
        reset_day: 1,
        auto_reset: true,
        carry_forward: false,
        currency: 'INR',
      },
      adjustments: [],
      isEmergencyMode: false,
      resetHistory: [],

      updateSettings: (updates) =>
        set((state) => {
          const next = {
            settings: { ...state.settings, ...updates },
            adjustments: state.adjustments,
            isEmergencyMode: state.isEmergencyMode,
            resetHistory: state.resetHistory,
          };
          persistBudgetSettings(next);
          return { settings: next.settings };
        }),

      addAdjustment: (adjustment) =>
        set((state) => {
          const adjustments = [adjustment, ...state.adjustments];
          const settings = {
            ...state.settings,
            monthly_allowance: adjustment.type === 'add'
              ? state.settings.monthly_allowance + Number(adjustment.amount)
              : state.settings.monthly_allowance - Number(adjustment.amount),
          };
          const next = {
            settings,
            adjustments,
            isEmergencyMode: state.isEmergencyMode,
            resetHistory: state.resetHistory,
          };
          persistBudgetSettings(next);
          return { adjustments, settings };
        }),

      toggleEmergencyMode: () =>
        set((state) => {
          const next = {
            settings: state.settings,
            adjustments: state.adjustments,
            isEmergencyMode: !state.isEmergencyMode,
            resetHistory: state.resetHistory,
          };
          persistBudgetSettings(next);
          return { isEmergencyMode: next.isEmergencyMode };
        }),

      setEmergencyMode: (active) =>
        set((state) => {
          const next = {
            settings: state.settings,
            adjustments: state.adjustments,
            isEmergencyMode: active,
            resetHistory: state.resetHistory,
          };
          persistBudgetSettings(next);
          return { isEmergencyMode: active };
        }),

      addResetRecord: (amount, carryForward) =>
        set((state) => {
          const resetHistory = [
            { date: new Date().toISOString(), amount, carryForward },
            ...state.resetHistory,
          ];
          const next = {
            settings: state.settings,
            adjustments: state.adjustments,
            isEmergencyMode: state.isEmergencyMode,
            resetHistory,
          };
          persistBudgetSettings(next);
          return { resetHistory };
        }),
    }),
    {
      name: 'moneykai-budget',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
