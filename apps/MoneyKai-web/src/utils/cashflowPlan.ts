import type { Challenge } from '../types/challenge';
import { CHALLENGE_TEMPLATES } from '../types/challenge';
import type { CategoryTotal, Transaction } from '../types/transaction';
import { summarizeTransactions } from './financeCore';
import type { RecurringObligation, RecurringObligationCandidate } from '@/types/planning';

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
  recurrenceCandidates: RecurringObligationCandidate[];
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
  recurringObligations?: RecurringObligation[];
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

const stableRecurrenceId = (value: string) => {
  let primary = 2_166_136_261;
  let secondary = 3_332_531_021;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    primary = Math.imul(primary ^ code, 16_777_619);
    secondary = Math.imul(secondary ^ (code + index), 2_246_822_519);
  }
  return `recurring_${(primary >>> 0).toString(16).padStart(8, '0')}${(secondary >>> 0).toString(16).padStart(8, '0')}`;
};

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
      id: stableRecurrenceId(key),
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
  recurringObligations = [],
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
  const financeSummary = summarizeTransactions(cycleTransactions);
  const actualIncome = financeSummary.income;
  const actualExpense = financeSummary.expense;
  const nowOrdinal = toUtcDayOrdinal(now);
  const isForecastAvailable = isOrdinalInside(nowOrdinal, cycleStartOrdinal, cycleEndOrdinal);
  const inferredCommitments = inferMonthlyCommitments({ transactions, cycleStart, cycleEnd, now });
  const decisionsById = new Map(recurringObligations.map((item) => [item.id, item]));
  const recurrenceCandidates = inferredCommitments
    .filter((candidate) => !decisionsById.has(candidate.id))
    .map((candidate) => ({ ...candidate, cadence: 'monthly' as const, nextDueDate: candidate.projectedDate }));
  const occurredKeys = new Set(cycleTransactions.map(recurrenceKey));
  const commitments = recurringObligations
    .filter((item) => item.status === 'confirmed')
    .flatMap((item) => {
      const key = `${item.type}|${item.category}|${normalizeDescription(item.label)}`;
      if (occurredKeys.has(key)) return [];
      const projectedDate = projectMonthlyDate(item.nextDueDate, cycleStart, cycleEnd, now);
      if (!projectedDate) return [];
      return [{
        id: item.id,
        label: item.label,
        category: item.category,
        type: item.type,
        amount: item.amount,
        projectedDate,
        confidence: 'estimated' as const,
        sourceTransactionIds: item.sourceTransactionIds,
      }];
    })
    .sort((left, right) => compareText(left.projectedDate, right.projectedDate) || compareText(left.id, right.id));
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

  const categories: CategoryTotal[] = financeSummary.categories;

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
    recurrenceCandidates,
    categories,
    goals,
    isForecastAvailable,
    hasBudget: allowance > 0,
    ignoredTransactionCount: transactions.length - validDateTransactions.length,
  };
};

const projectMonthlyDate = (dateKey: string, cycleStart: Date, cycleEnd: Date, now: Date): string | null => {
  const match = TRANSACTION_DATE_PATTERN.exec(dateKey);
  if (!match) return null;
  const preferredDay = Number(match[3]);
  let year = Number(match[1]);
  let month = Number(match[2]) - 1;
  const floorOrdinal = Math.max(toUtcDayOrdinal(cycleStart), toUtcDayOrdinal(now));
  const endOrdinal = toUtcDayOrdinal(cycleEnd);
  for (let attempts = 0; attempts < 24; attempts += 1) {
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const ordinal = Date.UTC(year, month, Math.min(preferredDay, lastDay)) / MILLISECONDS_PER_DAY;
    if (ordinal >= floorOrdinal) return ordinal < endOrdinal ? ordinalToDateKey(ordinal) : null;
    month += 1;
    if (month > 11) { month = 0; year += 1; }
  }
  return null;
};
