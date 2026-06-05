import type { DebtEdge } from '../types/group';

/**
 * Debt Simplification Algorithm
 * 
 * Uses a net-balance approach to minimize the number of transactions
 * needed to settle all debts in a group.
 * 
 * Algorithm:
 * 1. Calculate net balance for each person (total owed - total owes)
 * 2. Separate into creditors (positive balance) and debtors (negative balance)
 * 3. Greedily match largest debtor with largest creditor
 * 4. Create settlement transaction for min(debt, credit)
 * 5. Repeat until all balances are zero
 */
export const simplifyDebts = (debts: DebtEdge[]): DebtEdge[] => {
  // Step 1: Calculate net balances
  const balances = new Map<string, number>();
  const names = new Map<string, string>();

  debts.forEach(debt => {
    balances.set(debt.from, (balances.get(debt.from) || 0) - debt.amount);
    balances.set(debt.to, (balances.get(debt.to) || 0) + debt.amount);
    if (debt.fromName) names.set(debt.from, debt.fromName);
    if (debt.toName) names.set(debt.to, debt.toName);
  });

  // Step 2: Separate creditors and debtors
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  balances.forEach((balance, id) => {
    if (balance > 0.01) {
      creditors.push({ id, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ id, amount: Math.abs(balance) });
    }
  });

  // Step 3-5: Greedy matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const simplified: DebtEdge[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.01) {
      simplified.push({
        from: debtor.id,
        to: creditor.id,
        amount: Math.round(amount * 100) / 100,
        fromName: names.get(debtor.id),
        toName: names.get(creditor.id),
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return simplified;
};

/**
 * Calculate who owes whom from a list of group expenses
 */
export const calculateGroupBalances = (
  expenses: {
    paid_by: string;
    splits: { user_id: string; amount: number; is_settled: boolean }[];
  }[]
): DebtEdge[] => {
  const debts: DebtEdge[] = [];

  expenses.forEach(expense => {
    expense.splits.forEach(split => {
      if (split.user_id !== expense.paid_by && !split.is_settled) {
        debts.push({
          from: split.user_id,
          to: expense.paid_by,
          amount: split.amount,
        });
      }
    });
  });

  return simplifyDebts(debts);
};

/**
 * Calculate equal split amounts
 */
export const calculateEqualSplit = (totalAmount: number, memberCount: number): number => {
  return Math.round((totalAmount / memberCount) * 100) / 100;
};

/**
 * Calculate percentage-based split
 */
export const calculatePercentageSplit = (
  totalAmount: number,
  percentages: Map<string, number>
): Map<string, number> => {
  const splits = new Map<string, number>();
  percentages.forEach((pct, userId) => {
    splits.set(userId, Math.round((totalAmount * pct / 100) * 100) / 100);
  });
  return splits;
};
