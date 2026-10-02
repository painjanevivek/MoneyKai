import { PAYMENT_METHODS } from '@/constants/categories';
import type { Transaction } from '@/types/transaction';
import { toLocalDateKey } from '@/utils/calendarDates';

export const hasTransactionBudget = (allowance: number) => Number.isFinite(allowance) && allowance > 0;

export const shouldReturnToTransactionAfterBudget = (
  requestedFromAdd: boolean, previousAllowance: number, allowance: number, currentRoute: string,
) => requestedFromAdd && !hasTransactionBudget(previousAllowance) && hasTransactionBudget(allowance) && currentRoute === 'Budget';

export function getTransactionDefaults(transactions: Transaction[], ownerId: string, now = new Date()) {
  const latest = transactions
    .filter((transaction) => transaction.user_id === ownerId && PAYMENT_METHODS.some((method) => method.id === transaction.payment_method))
    .reduce<Transaction | undefined>((found, transaction) => !found || transaction.created_at > found.created_at ? transaction : found, undefined);
  return { date: toLocalDateKey(now), paymentMethod: latest?.payment_method ?? null };
}

export type TransactionSaveResult = 'saved' | 'budget-required' | 'rejected' | 'busy' | 'failed';

/** Hold a successful submission until the composer is opened again. React state alone
 * cannot stop a second tap from using the previous render's completed draft. */
export function createTransactionSaveGuard() {
  let locked = false;
  return {
    reset: () => { locked = false; },
    saveAsync: async (allowance:number,persist:()=>Promise<boolean>):Promise<TransactionSaveResult> => {
      if(locked) return 'busy';
      if(!hasTransactionBudget(allowance)) return 'budget-required';
      locked=true;
      try { if(await persist()) return 'saved'; locked=false; return 'rejected'; }
      catch { locked=false; return 'failed'; }
    },
    save: (allowance: number, persist: () => boolean): TransactionSaveResult => {
      if (locked) return 'busy';
      if (!hasTransactionBudget(allowance)) return 'budget-required';
      locked = true;
      try {
        if (persist()) return 'saved';
        locked = false;
        return 'rejected';
      } catch {
        locked = false;
        return 'failed';
      }
    },
  };
}
