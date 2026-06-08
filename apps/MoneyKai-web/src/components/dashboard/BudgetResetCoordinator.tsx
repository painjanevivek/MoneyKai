import React, { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';

export const BudgetResetCoordinator: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const transactions = useTransactionStore((s) => s.transactions);
  const settings = useBudgetStore((s) => s.settings);
  const resetHistory = useBudgetStore((s) => s.resetHistory);
  const processMonthlyReset = useBudgetStore((s) => s.processMonthlyReset);

  useEffect(() => {
    if (!isAuthenticated || !settings.auto_reset || settings.monthly_allowance <= 0) {
      return;
    }

    processMonthlyReset(transactions);
  }, [
    isAuthenticated,
    processMonthlyReset,
    resetHistory,
    settings.auto_reset,
    settings.carry_forward,
    settings.monthly_allowance,
    settings.reset_day,
    transactions,
  ]);

  return null;
};

export default BudgetResetCoordinator;
