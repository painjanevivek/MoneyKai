import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BudgetSettings, BudgetAdjustment } from '../types/budget';

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

      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates },
      })),

      addAdjustment: (adjustment) => set((state) => ({
        adjustments: [adjustment, ...state.adjustments],
        settings: {
          ...state.settings,
          monthly_allowance: adjustment.type === 'add'
            ? state.settings.monthly_allowance + Number(adjustment.amount)
            : state.settings.monthly_allowance - Number(adjustment.amount),
        },
      })),

      toggleEmergencyMode: () => set((state) => ({
        isEmergencyMode: !state.isEmergencyMode,
      })),

      setEmergencyMode: (active) => set({ isEmergencyMode: active }),

      addResetRecord: (amount, carryForward) => set((state) => ({
        resetHistory: [
          { date: new Date().toISOString(), amount, carryForward },
          ...state.resetHistory,
        ],
      })),
    }),
    {
      name: 'moneykai-budget',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
