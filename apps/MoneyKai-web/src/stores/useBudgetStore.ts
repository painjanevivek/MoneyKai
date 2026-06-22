import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addMonths, endOfMonth, isBefore, parseISO, setDate, startOfDay, startOfMonth, subMonths } from 'date-fns';
import type { BudgetSettings, BudgetAdjustment } from '../types/budget';
import type { Transaction } from '../types/transaction';
import { useAuthStore } from './useAuthStore';
import { saveUserBudgetSettings } from '@/services/firestoreData';
import { queueAutomaticBackup } from '@/services/automaticBackupClient';

const persistBudgetSettings = (state: {
  settings: BudgetSettings;
  adjustments: BudgetAdjustment[];
  isEmergencyMode: boolean;
  resetHistory: { date: string; amount: number; carryForward: number }[];
}) => {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  void saveUserBudgetSettings(userId, state).catch((error) => {
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
  processMonthlyReset: (transactions: Transaction[], now?: Date) => void;
}

const getResetBoundaryForMonth = (date: Date, resetDay: number) => {
  const monthStart = startOfMonth(date);
  const safeResetDay = Math.min(Math.max(1, resetDay), endOfMonth(monthStart).getDate());
  return startOfDay(setDate(monthStart, safeResetDay));
};

const getNextResetBoundary = (date: Date, resetDay: number) => {
  const currentMonthBoundary = getResetBoundaryForMonth(date, resetDay);
  if (isBefore(date, currentMonthBoundary)) {
    return currentMonthBoundary;
  }
  return getResetBoundaryForMonth(addMonths(date, 1), resetDay);
};

const getPreviousResetBoundary = (date: Date, resetDay: number) =>
  getResetBoundaryForMonth(subMonths(startOfMonth(date), 1), resetDay);

const getLatestResetDate = (resetHistory: { date: string }[]) =>
  resetHistory.reduce<Date | null>((latest, record) => {
    const parsed = parseISO(record.date);
    if (!Number.isFinite(parsed.getTime())) {
      return latest;
    }
    return latest === null || parsed > latest ? parsed : latest;
  }, null);

const getCycleExpenses = (transactions: Transaction[], start: Date, end: Date) =>
  transactions
    .filter((transaction) => transaction.type === 'expense')
    .filter((transaction) => {
      const transactionDate = parseISO(transaction.transaction_date);
      return transactionDate >= start && transactionDate < end;
    })
    .reduce((total, transaction) => total + transaction.amount, 0);

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
          queueAutomaticBackup('budget updated');
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
          queueAutomaticBackup('budget updated');
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
          queueAutomaticBackup('budget updated');
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
          queueAutomaticBackup('budget updated');
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
          queueAutomaticBackup('budget updated');
          return { resetHistory };
        }),

      processMonthlyReset: (transactions, now = new Date()) =>
        set((state) => {
          if (!state.settings.auto_reset || state.settings.monthly_allowance <= 0) {
            return {};
          }

          const latestResetDate = getLatestResetDate(state.resetHistory);
          if (!latestResetDate) {
            const currentCycleStart = getPreviousResetBoundary(getNextResetBoundary(now, state.settings.reset_day), state.settings.reset_day);
            const resetHistory = [
              { date: currentCycleStart.toISOString(), amount: state.settings.monthly_allowance, carryForward: 0 },
              ...state.resetHistory,
            ];
            const next = {
              settings: state.settings,
              adjustments: state.adjustments,
              isEmergencyMode: state.isEmergencyMode,
              resetHistory,
            };
            persistBudgetSettings(next);
            queueAutomaticBackup('budget updated');
            return { resetHistory };
          }

          let nextReset = getNextResetBoundary(latestResetDate, state.settings.reset_day);
          let monthlyAllowance = state.settings.monthly_allowance;
          const resetRecords: { date: string; amount: number; carryForward: number }[] = [];

          while (nextReset <= now) {
            const previousReset = getPreviousResetBoundary(nextReset, state.settings.reset_day);
            const cycleExpenses = getCycleExpenses(transactions, previousReset, nextReset);
            const unusedBalance = Math.max(0, monthlyAllowance - cycleExpenses);
            const carryForward = state.settings.carry_forward ? unusedBalance : 0;

            monthlyAllowance += carryForward;
            resetRecords.push({
              date: nextReset.toISOString(),
              amount: monthlyAllowance,
              carryForward,
            });
            nextReset = getNextResetBoundary(nextReset, state.settings.reset_day);
          }

          if (resetRecords.length === 0) {
            return {};
          }

          const settings = { ...state.settings, monthly_allowance: monthlyAllowance };
          const resetHistory = [...resetRecords.reverse(), ...state.resetHistory];
          const next = {
            settings,
            adjustments: state.adjustments,
            isEmergencyMode: state.isEmergencyMode,
            resetHistory,
          };
          persistBudgetSettings(next);
          queueAutomaticBackup('budget updated');
          return { settings, resetHistory };
        }),
    }),
    {
      name: 'moneykai-budget',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
