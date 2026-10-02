import type { Transaction } from '@/types/transaction';
import { getCategoryById } from '@/constants/categories';
import { buildGraphPeriods, parseGraphDate, type GraphWindow } from './graphPeriods';

export type DashboardGraphRange = '1d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all';
export type DashboardGraphMetric = 'spending' | 'income' | 'netFlow' | 'transactionCount';
export type DashboardGraphType = 'line' | 'bar' | 'donut';
export type DashboardGraphView = { range: DashboardGraphRange; metric: DashboardGraphMetric; type: DashboardGraphType };
export type GraphTransactionContext = { range: DashboardGraphRange; metric: DashboardGraphMetric; asOf: string; periodStart?: string; periodEnd?: string };

export const getGraphRangeLabel = (range: DashboardGraphRange): string => ({
  '1d': 'One day', '1w': 'One week', '1m': 'One month', '3m': 'Three months',
  '6m': 'Six months', '1y': 'One year', all: 'All time',
}[range]);
export const getGraphRangeDescription = (range: DashboardGraphRange): string => ({
  '1d': 'One point per calendar day; browse earlier days',
  '1w': 'One point per Monday–Sunday week, across month boundaries',
  '1m': 'One point per calendar month, oldest to newest',
  '3m': 'One point per calendar quarter; browse earlier quarters',
  '6m': 'One point per calendar half-year',
  '1y': 'One point per calendar year',
  all: 'Explore all recorded history in monthly groups',
}[range]);

export type GraphPoint = { label: string; value: number };
export type DashboardGraphData = {
  current: GraphPoint[];
  previous: GraphPoint[];
  currentTotal: number;
  previousTotal: number;
  hasData: boolean;
  hasComparison: boolean;
  breakdown: GraphPoint[];
  breakdownTotal: number;
  periodLabel: string;
  bucketLabel: string;
  recordCount: number;
  bucketRanges: string[];
  periodStart: string;
  periodEnd: string;
  hasOlder: boolean;
  hasNewer: boolean;
  pageOffset: number;
};

type GraphTransaction = Pick<Transaction, 'amount' | 'transaction_date' | 'type'> & Partial<Pick<Transaction, 'category'>>;

export const GRAPH_RANGE_OPTIONS: { id: DashboardGraphRange; label: string }[] = [
  { id: '1d', label: '1D' }, { id: '1w', label: '1W' }, { id: '1m', label: '1M' },
  { id: '3m', label: '3M' }, { id: '6m', label: '6M' }, { id: '1y', label: '1Y' },
  { id: 'all', label: 'All' },
];

export const GRAPH_METRIC_OPTIONS: { id: DashboardGraphMetric; label: string; description: string }[] = [
  { id: 'spending', label: 'Spending', description: 'Where money went over time' },
  { id: 'income', label: 'Income', description: 'Money coming in over time' },
  { id: 'netFlow', label: 'Net flow', description: 'Income minus spending' },
  { id: 'transactionCount', label: 'Transactions', description: 'Number of recorded movements' },
];

export const GRAPH_TYPE_OPTIONS: { id: DashboardGraphType; label: string; description: string }[] = [
  { id: 'line', label: 'Line chart', description: 'See how your money changes over time' },
  { id: 'bar', label: 'Bar chart', description: 'Find the busiest days or months' },
  { id: 'donut', label: 'Pie chart', description: 'Compare categories and their share' },
];

export const getGraphAxisLabels = (points: GraphPoint[]): string[] => {
  return points.map((point) => point.label);
};

const valueFor = (transaction: GraphTransaction, metric: DashboardGraphMetric): number => {
  if (metric === 'transactionCount') return 1;
  if (metric === 'spending') return transaction.type === 'expense' ? transaction.amount : 0;
  if (metric === 'income') return transaction.type === 'income' ? transaction.amount : 0;
  return transaction.type === 'income' ? transaction.amount : -transaction.amount;
};

// Drill-down uses the same bucket boundaries and metric inclusion as the chart.
export function filterGraphTransactions<T extends GraphTransaction>(transactions: T[], context: GraphTransactionContext): T[] {
  const now = new Date(context.asOf);
  if (!Number.isFinite(now.getTime())) return [];
  const hasBounds = context.periodStart !== undefined || context.periodEnd !== undefined;
  const start = context.periodStart ? parseGraphDate(context.periodStart) : null;
  const end = context.periodEnd ? parseGraphDate(context.periodEnd) : null;
  if (hasBounds && (!start || !end || start >= end)) return [];
  const { current } = buildGraphPeriods(context.range, transactions, now);
  return transactions.filter((transaction) => {
    const date = parseGraphDate(transaction.transaction_date);
    return date !== null && date <= now && Number.isFinite(transaction.amount) && transaction.amount >= 0
      && ['income', 'expense'].includes(transaction.type)
      && (context.metric === 'transactionCount' || context.metric === 'netFlow' || valueFor(transaction, context.metric) !== 0)
      && (hasBounds ? date >= start! && date < end! : current.some((bucket) => date >= bucket.start && date < bucket.end));
  });
}

export function buildDashboardGraph(
  transactions: GraphTransaction[],
  range: DashboardGraphRange,
  metric: DashboardGraphMetric,
  now = new Date(),
  window: GraphWindow = {},
): DashboardGraphData {
  const buckets = buildGraphPeriods(range, transactions, now, window);
  const current = buckets.current.map(({ label }) => ({ label, value: 0 }));
  const previous = buckets.previous.map(({ label }) => ({ label, value: 0 }));
  let hasData = false;
  let recordCount = 0;
  const categoryValues = new Map<string, number>();

  for (const transaction of transactions) {
    const date = parseGraphDate(transaction.transaction_date);
    if (!date || !Number.isFinite(transaction.amount) || transaction.amount < 0 || date > now || !['income', 'expense'].includes(transaction.type)) continue;
    const value = valueFor(transaction, metric);
    for (const [bucketSet, points] of [[buckets.current, current], [buckets.previous, previous]] as const) {
      const index = bucketSet.findIndex((bucket) => date >= bucket.start && date < bucket.end);
      if (index < 0) continue;
      points[index].value += value;
      if (points === current) {
        recordCount += metric === 'transactionCount' || metric === 'netFlow' || value !== 0 ? 1 : 0;
        hasData ||= metric === 'transactionCount' || value !== 0;
        // Net flow is signed in the trend; its ring shows gross inflow/outflow,
        // never absolute values of net buckets (which hide losses/cancellation).
        const label = metric === 'netFlow'
          ? transaction.type === 'income' ? 'Credit' : 'Debit'
          : getCategoryById(transaction.category ?? '')?.name ?? 'Uncategorized';
        const amount = metric === 'netFlow' ? transaction.amount : value;
        if (amount > 0) categoryValues.set(label, (categoryValues.get(label) ?? 0) + amount);
      }
      break;
    }
  }

  const ranked = [...categoryValues].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  const breakdown = ranked.length > 6
    ? [...ranked.slice(0, 5), { label: 'Other categories', value: ranked.slice(5).reduce((sum, point) => sum + point.value, 0) }]
    : ranked;
  return {
    current,
    previous,
    currentTotal: current.reduce((sum, point) => sum + point.value, 0),
    previousTotal: previous.reduce((sum, point) => sum + point.value, 0),
    hasData,
    hasComparison: previous.length > 0,
    breakdown,
    breakdownTotal: breakdown.reduce((sum, point) => sum + point.value, 0),
    periodLabel: buckets.periodLabel,
    bucketLabel: buckets.bucketLabel,
    periodStart: buckets.periodStart,
    periodEnd: buckets.periodEnd,
    hasOlder: buckets.hasOlder,
    hasNewer: buckets.hasNewer,
    pageOffset: buckets.pageOffset,
    recordCount,
    bucketRanges: buckets.bucketRanges,
  };
}

