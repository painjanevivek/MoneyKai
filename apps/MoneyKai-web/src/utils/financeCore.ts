import type { CategoryTotal, Transaction } from '@/types/transaction';

export interface FinancePeriod {
  startDate: string;
  endDateExclusive: string;
}

export interface FinancePeriodProgress {
  daysPassed: number;
  daysLeft: number;
  totalDays: number;
  isOpen: boolean;
}

export interface FinanceSummary {
  income: number;
  expense: number;
  net: number;
  count: number;
  invalidCount: number;
  categories: CategoryTotal[];
  transactions: Transaction[];
}

export interface FinanceSummaryOptions {
  period?: FinancePeriod;
  query?: string;
  type?: 'income' | 'expense';
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export function calendarDateKey(value: Date): string {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`;
}

export function monthFinancePeriod(value: Date): FinancePeriod {
  return {
    startDate: calendarDateKey(new Date(Date.UTC(value.getFullYear(), value.getMonth(), 1))),
    endDateExclusive: calendarDateKey(new Date(Date.UTC(value.getFullYear(), value.getMonth() + 1, 1))),
  };
}

export function rollingFinancePeriod(endExclusive: Date, days: number): FinancePeriod {
  const safeDays = Math.max(1, Math.floor(days));
  const endOrdinal = Date.UTC(endExclusive.getUTCFullYear(), endExclusive.getUTCMonth(), endExclusive.getUTCDate());
  return {
    startDate: calendarDateKey(new Date(endOrdinal - safeDays * DAY_MS)),
    endDateExclusive: calendarDateKey(new Date(endOrdinal)),
  };
}

export function previousFinancePeriod(period: FinancePeriod): FinancePeriod {
  const start = Date.parse(`${period.startDate}T00:00:00.000Z`);
  const end = Date.parse(`${period.endDateExclusive}T00:00:00.000Z`);
  const duration = Math.max(DAY_MS, end - start);
  return {
    startDate: calendarDateKey(new Date(start - duration)),
    endDateExclusive: period.startDate,
  };
}

export function financePeriodProgress(period: FinancePeriod, now = new Date()): FinancePeriodProgress {
  const start = Date.parse(`${period.startDate}T00:00:00.000Z`);
  const end = Date.parse(`${period.endDateExclusive}T00:00:00.000Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return { daysPassed: 0, daysLeft: 0, totalDays: 0, isOpen: false };
  }
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const totalDays = Math.round((end - start) / DAY_MS);
  const daysPassed = today < start
    ? 0
    : today >= end
      ? totalDays
      : Math.min(totalDays, Math.floor((today - start) / DAY_MS) + 1);
  return {
    daysPassed,
    daysLeft: totalDays - daysPassed,
    totalDays,
    isOpen: today >= start && today < end,
  };
}

export function summarizeTransactions(
  transactions: Transaction[],
  options: FinanceSummaryOptions = {},
): FinanceSummary {
  const query = options.query?.trim().toLowerCase() ?? '';
  let invalidCount = 0;
  const included = transactions.filter((transaction) => {
    if (!isValidDateKey(transaction.transaction_date) || !Number.isFinite(transaction.amount) || transaction.amount <= 0) {
      invalidCount += 1;
      return false;
    }
    if (options.period && (
      transaction.transaction_date < options.period.startDate ||
      transaction.transaction_date >= options.period.endDateExclusive
    )) return false;
    if (options.type && transaction.type !== options.type) return false;
    if (query && ![
      transaction.description,
      transaction.category,
      transaction.payment_method,
      transaction.captureSource ?? 'manual',
    ].some((value) => value.toLowerCase().includes(query))) return false;
    return true;
  });

  let income = 0;
  let expense = 0;
  const categoryMap = new Map<string, { total: number; count: number }>();
  included.forEach((transaction) => {
    if (transaction.type === 'income') income += transaction.amount;
    else {
      expense += transaction.amount;
      const current = categoryMap.get(transaction.category) ?? { total: 0, count: 0 };
      categoryMap.set(transaction.category, { total: current.total + transaction.amount, count: current.count + 1 });
    }
  });
  const categories = [...categoryMap.entries()]
    .map(([category, value]) => ({
      category,
      total: value.total,
      count: value.count,
      percentage: expense > 0 ? (value.total / expense) * 100 : 0,
    }))
    .sort((left, right) => right.total - left.total || left.category.localeCompare(right.category));

  return { income, expense, net: income - expense, count: included.length, invalidCount, categories, transactions: included };
}

function isValidDateKey(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}
