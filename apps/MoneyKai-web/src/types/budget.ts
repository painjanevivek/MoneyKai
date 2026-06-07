export interface Budget {
  id: string;
  user_id: string;
  allowance: number;
  total_spent: number;
  total_income: number;
  cycle_start: string;
  cycle_end: string;
  adjustment_reason?: string;
  is_active: boolean;
  created_at: string;
}

export interface BudgetSettings {
  monthly_allowance: number;
  reset_day: number; // 1-31
  auto_reset: boolean;
  carry_forward: boolean;
  currency: string;
}

export interface BudgetAdjustment {
  amount: number;
  type: 'add' | 'subtract';
  reason: string;
  date: string;
}

export interface BudgetHealth {
  score: number; // 0-100
  label: 'Critical' | 'Poor' | 'Fair' | 'Good' | 'Excellent';
  color: string;
  message: string;
}

export interface SavingsProjection {
  currentSavings: number;
  projectedSavings: number;
  improvement: number;
  improvementPercent: number;
  newDailyLimit: number;
  newMonthEndBalance: number;
  recommendations: string[];
}

export interface CategoryReduction {
  category: string;
  currentAmount: number;
  reductionPercent: number;
  savedAmount: number;
}
