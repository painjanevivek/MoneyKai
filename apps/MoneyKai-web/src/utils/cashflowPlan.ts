import type { Challenge } from '../types/challenge';
import { CHALLENGE_TEMPLATES } from '../types/challenge';
import type { CategoryTotal, Transaction } from '../types/transaction';

export interface RecurringCommitment {
  id: string;
  label: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  projectedDate: string;
  confidence: 'estimated';
  sourceTransactionIds: string[];
}

export interface CashflowPoint {
  date: string;
  actualNetFlow: number | null;
  projectedNetFlow: number;
  actualEvents: Transaction[];
  projectedEvents: RecurringCommitment[];
}

export interface GoalSnapshot {
  id: string;
  label: string;
  progressPercent: number;
  currentValue: number;
  targetValue: number;
  endDate: string;
}

export interface CashflowPlan {
  metrics: {
    budgetAvailable: number;
    safeToSpend: number;
    upcomingCommitments: number;
    forecastNetFlow: number;
    actualIncome: number;
    actualExpense: number;
  };
  timeline: CashflowPoint[];
  commitments: RecurringCommitment[];
  categories: CategoryTotal[];
  goals: GoalSnapshot[];
  isForecastAvailable: boolean;
  hasBudget: boolean;
  ignoredTransactionCount: number;
}

export interface CashflowPlanInput {
  transactions: Transaction[];
  monthlyAllowance: number;
  challenges: Challenge[];
  cycleStart: Date;
  cycleEnd: Date;
  now: Date;
}

export interface CommitmentInferenceInput {
  transactions: Transaction[];
  cycleStart: Date;
  cycleEnd: Date;
  now: Date;
}

const normalizeDescription = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1_000;
const TRANSACTION_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

interface CalendarDay {
  dateKey: string;
  dayOrdinal: number;
}

interface TransactionDayEntry extends CalendarDay {
  transaction: Transaction;
}

const padDatePart = (value: number) => String(value).padStart(2, '0');

const toUtcDateKey = (date: Date) =>
  `${date.getUTCFullYear()}-${padDatePart(date.getUTCMonth() + 1)}-${padDatePart(date.getUTCDate())}`;

const toUtcDayOrdinal = (date: Date) =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / MILLISECONDS_PER_DAY;

const ordinalToDateKey = (dayOrdinal: number) =>
  toUtcDateKey(new Date(dayOrdinal * MILLISECONDS_PER_DAY));

const parseTransactionDay = (transaction: Transaction): TransactionDayEntry | null => {
  const match = TRANSACTION_DATE_PATTERN.exec(transaction.transaction_date);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const dayOrdinal = Date.UTC(year, monthIndex, day) / MILLISECONDS_PER_DAY;
  const parsed = new Date(dayOrdinal * MILLISECONDS_PER_DAY);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== monthIndex ||
    parsed.getUTCDate() !== day
  ) return null;
  return { transaction, dateKey: transaction.transaction_date, dayOrdinal };
};

const parseTransactionDays = (transactions: Transaction[]) =>
  transactions.flatMap((transaction) => {
    const entry = parseTransactionDay(transaction);
    return entry ? [entry] : [];
  });

const isOrdinalInside = (dayOrdinal: number, startOrdinal: number, endOrdinal: number) =>
  dayOrdinal >= startOrdinal && dayOrdinal < endOrdinal;

const isPositiveFiniteAmount = (amount: number) => Number.isFinite(amount) && amount > 0;

const compareText = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;

const recurrenceKey = (transaction: Transaction) =>
  `${transaction.type}|${transaction.category}|${normalizeDescription(transaction.description)}`;

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

export const inferMonthlyCommitments = ({ transactions, cycleStart, cycleEnd, now }: CommitmentInferenceInput) => {
  const cycleStartOrdinal = toUtcDayOrdinal(cycleStart);
  const cycleEndOrdinal = toUtcDayOrdinal(cycleEnd);
  const nowOrdinal = toUtcDayOrdinal(now);
  if (!isOrdinalInside(nowOrdinal, cycleStartOrdinal, cycleEndOrdinal)) return [];
  const historyStartOrdinal = cycleStartOrdinal - 180;
  const parsedTransactions = parseTransactionDays(transactions);
  const validHistory = parsedTransactions
    .filter(({ transaction, dayOrdinal }) =>
      isPositiveFiniteAmount(transaction.amount) &&
      dayOrdinal >= historyStartOrdinal &&
      dayOrdinal < cycleStartOrdinal);
  const occurredKeys = new Set(parsedTransactions
    .filter(({ transaction, dayOrdinal }) =>
      isPositiveFiniteAmount(transaction.amount) &&
      isOrdinalInside(dayOrdinal, cycleStartOrdinal, cycleEndOrdinal) &&
      dayOrdinal <= nowOrdinal)
    .map(({ transaction }) => recurrenceKey(transaction)));
  const groups = new Map<string, typeof validHistory>();
  validHistory.forEach((entry) => {
    const normalized = normalizeDescription(entry.transaction.description);
    if (normalized.length < 3) return;
    const key = recurrenceKey(entry.transaction);
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  });

  const commitments: RecurringCommitment[] = [];
  groups.forEach((entries, key) => {
    if (occurredKeys.has(key)) return;
    const ordered = [...entries].sort((a, b) =>
      a.dayOrdinal - b.dayOrdinal ||
      compareText(a.transaction.id, b.transaction.id));
    if (ordered.length < 2) return;
    const gaps = ordered.slice(1).map((entry, index) => entry.dayOrdinal - ordered[index].dayOrdinal);
    const interval = Math.round(median(gaps));
    if (interval < 25 || interval > 35) return;
    const amounts = ordered.map(({ transaction }) => transaction.amount);
    const amount = Math.round(median(amounts));
    if (amount <= 0 || amounts.some((value) => Math.abs(value - amount) / amount > 0.15)) return;
    let projectedOrdinal = ordered[ordered.length - 1].dayOrdinal + interval;
    while (projectedOrdinal < nowOrdinal) {
      projectedOrdinal += interval;
    }
    if (!isOrdinalInside(projectedOrdinal, cycleStartOrdinal, cycleEndOrdinal)) return;
    const projectedDateKey = ordinalToDateKey(projectedOrdinal);
    const source = ordered[ordered.length - 1].transaction;
    commitments.push({
      id: `estimated-${key}-${projectedDateKey}`,
      label: source.description,
      category: source.category,
      type: source.type === 'income' ? 'income' : 'expense',
      amount,
      projectedDate: projectedDateKey,
      confidence: 'estimated',
      sourceTransactionIds: ordered.map(({ transaction }) => transaction.id),
    });
  });
  return commitments.sort((a, b) =>
    compareText(a.projectedDate, b.projectedDate) ||
    compareText(a.type, b.type) ||
    compareText(a.category, b.category) ||
    compareText(normalizeDescription(a.label), normalizeDescription(b.label)) ||
    compareText(a.id, b.id));
};

const transactionNetFlow = (transaction: Transaction) =>
  transaction.type === 'income' ? transaction.amount : -transaction.amount;

const commitmentNetFlow = (commitment: RecurringCommitment) =>
  commitment.type === 'income' ? commitment.amount : -commitment.amount;

export const buildCashflowPlan = ({
  transactions,
  monthlyAllowance,
  challenges,
  cycleStart,
  cycleEnd,
  now,
}: CashflowPlanInput): CashflowPlan => {
  const cycleStartOrdinal = toUtcDayOrdinal(cycleStart);
  const cycleEndOrdinal = toUtcDayOrdinal(cycleEnd);
  const validDateTransactions = parseTransactionDays(transactions);
  const cycleEntries = validDateTransactions
    .filter(({ transaction, dayOrdinal }) =>
      isPositiveFiniteAmount(transaction.amount) &&
      isOrdinalInside(dayOrdinal, cycleStartOrdinal, cycleEndOrdinal))
    .sort((a, b) =>
      a.dayOrdinal - b.dayOrdinal ||
      compareText(a.transaction.id, b.transaction.id));
  const cycleTransactions = cycleEntries.map(({ transaction }) => transaction);

  const actualIncome = cycleTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const actualExpense = cycleTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const nowOrdinal = toUtcDayOrdinal(now);
  const isForecastAvailable = isOrdinalInside(nowOrdinal, cycleStartOrdinal, cycleEndOrdinal);
  const commitments = inferMonthlyCommitments({ transactions, cycleStart, cycleEnd, now });
  const allowance = isPositiveFiniteAmount(monthlyAllowance) ? monthlyAllowance : 0;
  const budgetAvailable = Math.max(0, allowance - actualExpense);
  const upcomingCommitments = commitments
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);
  const upcomingIncome = commitments
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);
  const safeToSpend = allowance > 0 ? Math.max(0, budgetAvailable - upcomingCommitments) : 0;
  const forecastNetFlow = actualIncome - actualExpense + upcomingIncome - upcomingCommitments;

  const expenseTotals = new Map<string, { total: number; count: number }>();
  cycleTransactions.forEach((transaction) => {
    if (transaction.type !== 'expense') return;
    const current = expenseTotals.get(transaction.category) ?? { total: 0, count: 0 };
    expenseTotals.set(transaction.category, {
      total: current.total + transaction.amount,
      count: current.count + 1,
    });
  });
  const categories: CategoryTotal[] = [...expenseTotals.entries()]
    .map(([category, { total, count }]) => ({
      category,
      total,
      percentage: actualExpense > 0 ? (total / actualExpense) * 100 : 0,
      count,
    }))
    .sort((a, b) => b.total - a.total || a.category.localeCompare(b.category));

  const goals: GoalSnapshot[] = challenges
    .filter((challenge) => challenge.status === 'active')
    .map((challenge) => {
      const template = CHALLENGE_TEMPLATES.find((candidate) => candidate.name === challenge.name);
      const currentValue = challenge.savings_earned;
      return {
        id: challenge.id,
        label: challenge.name,
        progressPercent: challenge.duration_days > 0
          ? Math.min(100, Math.max(0, (challenge.current_streak / challenge.duration_days) * 100))
          : 0,
        currentValue,
        targetValue: template?.estimatedSavings ?? currentValue,
        endDate: challenge.end_date,
      };
    })
    .sort((a, b) =>
      compareText(a.endDate, b.endDate) ||
      compareText(a.label, b.label) ||
      compareText(a.id, b.id));

  const actualEventsByDate = new Map<string, Transaction[]>();
  cycleEntries.forEach(({ transaction, dateKey }) => {
    actualEventsByDate.set(dateKey, [...(actualEventsByDate.get(dateKey) ?? []), transaction]);
  });
  const projectedEventsByDate = new Map<string, RecurringCommitment[]>();
  commitments.forEach((commitment) => {
    projectedEventsByDate.set(
      commitment.projectedDate,
      [...(projectedEventsByDate.get(commitment.projectedDate) ?? []), commitment],
    );
  });

  let cumulativeActualNetFlow = 0;
  let cumulativeProjectedNetFlow = 0;
  const dayCount = Number.isFinite(cycleEndOrdinal - cycleStartOrdinal)
    ? Math.max(0, cycleEndOrdinal - cycleStartOrdinal)
    : 0;
  const timeline: CashflowPoint[] = Array.from({ length: dayCount }, (_, index) => {
    const dayOrdinal = cycleStartOrdinal + index;
    const date = ordinalToDateKey(dayOrdinal);
    const actualEvents = actualEventsByDate.get(date) ?? [];
    const projectedEvents = projectedEventsByDate.get(date) ?? [];
    cumulativeActualNetFlow += actualEvents.reduce((sum, transaction) => sum + transactionNetFlow(transaction), 0);
    cumulativeProjectedNetFlow += actualEvents.reduce((sum, transaction) => sum + transactionNetFlow(transaction), 0);
    cumulativeProjectedNetFlow += projectedEvents.reduce((sum, commitment) => sum + commitmentNetFlow(commitment), 0);
    return {
      date,
      actualNetFlow: !isForecastAvailable || dayOrdinal <= nowOrdinal ? cumulativeActualNetFlow : null,
      projectedNetFlow: cumulativeProjectedNetFlow,
      actualEvents,
      projectedEvents,
    };
  });

  return {
    metrics: {
      budgetAvailable,
      safeToSpend,
      upcomingCommitments,
      forecastNetFlow,
      actualIncome,
      actualExpense,
    },
    timeline,
    commitments,
    categories,
    goals,
    isForecastAvailable,
    hasBudget: allowance > 0,
    ignoredTransactionCount: transactions.length - validDateTransactions.length,
  };
};
