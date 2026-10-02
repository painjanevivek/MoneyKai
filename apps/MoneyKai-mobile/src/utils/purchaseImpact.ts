import type { Transaction } from '@/types/transaction';
import { estimatePurchase } from './purchaseTools';
import { parseGraphDate } from './graphPeriods';

type Record = Pick<Transaction, 'id' | 'user_id' | 'type' | 'amount' | 'transaction_date' | 'category'>;
export const DEFAULT_REDUCIBLE_CATEGORIES = ['entertainment', 'electronics'];
export const VARIABLE_CATEGORIES = ['food', 'shopping', 'electronics', 'transport', 'entertainment'];
const MAY_REDUCE = ['food', 'shopping', 'electronics', 'entertainment'];
export type PurchaseImpactInput = {
  remainingPaise: number; amountPaise: number; commitmentsPaise: number; days: number;
  now: Date; ownerId?: string; records: readonly Record[]; includePreviewSamples?: boolean;
  reducibleCategories?: readonly string[];
};

/** On-device scenario planner. Integer money arithmetic, no model-generated financial totals. */
export function buildPurchaseImpact(input: PurchaseImpactInput) {
  const estimate = estimatePurchase(input.remainingPaise, input.amountPaise, input.commitmentsPaise, input.days);
  if (!estimate || !Number.isFinite(input.now.getTime())) return null;
  const start = new Date(input.now.getFullYear(), input.now.getMonth() - 2, 1);
  const end = new Date(input.now.getFullYear(), input.now.getMonth(), 1);
  const months = [start, new Date(start.getFullYear(), start.getMonth() + 1, 1)].map(date => ({
    key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    label: date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    days: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(),
  }));
  const seen = new Set<string>();
  const represented = new Set<string>();
  const totals = new Map<string, number>();
  let recordCount = 0;
  for (const row of input.records) {
    const date = parseGraphDate(row.transaction_date);
    const paise = Math.round(row.amount * 100);
    if (!input.ownerId || !(row.user_id === input.ownerId || input.includePreviewSamples && row.user_id === 'sample')
      || row.type !== 'expense' || !date || date < start || date >= end || !Number.isSafeInteger(paise) || paise <= 0
      || seen.has(row.id)) continue;
    seen.add(row.id);
    recordCount++;
    represented.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    const total = (totals.get(row.category) ?? 0) + paise;
    if (!Number.isSafeInteger(total) || !Number.isSafeInteger(total * input.days)) return null;
    totals.set(row.category, total);
  }
  // A missing month is unknown, not a zero-spend month.
  const historyDays = months.filter(month => represented.has(month.key)).reduce((sum, month) => sum + month.days, 0);
  const allowed = new Set((input.reducibleCategories ?? DEFAULT_REDUCIBLE_CATEGORIES).filter(id => MAY_REDUCE.includes(id)));
  const categories = [...totals].map(([id, totalPaise]) => ({
    id, totalPaise,
    monthlyAveragePaise: Math.floor(totalPaise / Math.max(1, represented.size)),
    remainingPacePaise: historyDays ? Math.floor(totalPaise * input.days / historyDays) : 0,
    reducible: allowed.has(id), reductionPaise: 0,
  })).sort((a, b) => b.totalPaise - a.totalPaise);
  let unrecoveredPaise = input.amountPaise;
  // Optional reduction capped at 40% of recorded pace. Never propose cutting protected needs.
  for (const row of [...categories].sort((a, b) => b.remainingPacePaise - a.remainingPacePaise)) {
    if (!row.reducible) continue;
    row.reductionPaise = Math.min(unrecoveredPaise, Math.floor(row.remainingPacePaise * 2 / 5));
    unrecoveredPaise -= row.reductionPaise;
  }
  const projectedVariablePaise = categories.filter(row => VARIABLE_CATEGORIES.includes(row.id)).reduce((sum, row) => sum + row.remainingPacePaise, 0);
  if (!Number.isSafeInteger(projectedVariablePaise)) return null;
  return {
    ...estimate, amountPaise: input.amountPaise, commitmentsPaise: input.commitmentsPaise,
    days: input.days, dailyReductionPaise: estimate.dailyBeforePaise - estimate.dailyAfterPaise,
    budgetImpactPercent: estimate.beforePaise > 0 ? input.amountPaise / estimate.beforePaise * 100 : null,
    months, representedMonths: represented.size, historyDays, recordCount, categories,
    projectedVariablePaise, variablePaceGapPaise: Math.max(0, projectedVariablePaise - estimate.afterPaise),
    recoveredPaise: input.amountPaise - unrecoveredPaise, unrecoveredPaise,
  };
}
export type PurchaseImpact = NonNullable<ReturnType<typeof buildPurchaseImpact>>;
