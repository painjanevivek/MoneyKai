import type { DashboardGraphRange } from './dashboardGraph';

export type GraphBucket = { start: Date; end: Date; label: string };
export type GraphWindow = { bucketCount?: number; pageOffset?: number; minimumPeriods?: number };
type DatedRecord = { transaction_date: string; amount: number; type: string };
const dayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date: Date, count: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + count);
const shortMonth = (date: Date) => date.toLocaleString('en-IN', { month: 'short' }).slice(0, 3);
export const graphDateLabel = (date: Date) => `${date.getDate()} ${shortMonth(date)}`;
const fullDate = (date: Date) => `${graphDateLabel(date)} ${date.getFullYear()}`;

export function parseGraphDate(value: string): Date | null {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = parts ? new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])) : new Date(value);
  if (parts && (date.getFullYear() !== Number(parts[1]) || date.getMonth() + 1 !== Number(parts[2]) || date.getDate() !== Number(parts[3]))) return null;
  return Number.isFinite(date.getTime()) ? date : null;
}

// Width is the chart's content area, not the device width. Reserve its value axis.
export const getGraphBucketCapacity = (width: number, fontScale = 1, range?: DashboardGraphRange) =>
  Math.max(1, Math.min(24, Math.floor((Math.max(180, width) - 70) / ((range === '3m' || range === '6m' ? 72 : 44) * Math.max(1, fontScale)))));

const monthsPerPeriod = (range: DashboardGraphRange) => range === '3m' ? 3 : range === '6m' ? 6 : range === '1y' ? 12 : 1;
function periodStart(date: Date, range: DashboardGraphRange): Date {
  if (range === '1d') return dayStart(date);
  if (range === '1w') return addDays(dayStart(date), -((date.getDay() + 6) % 7));
  const months = monthsPerPeriod(range);
  return new Date(date.getFullYear(), Math.floor(date.getMonth() / months) * months, 1);
}
function shift(start: Date, range: DashboardGraphRange, count: number): Date {
  return range === '1d' || range === '1w'
    ? addDays(start, count * (range === '1w' ? 7 : 1))
    : new Date(start.getFullYear(), start.getMonth() + count * monthsPerPeriod(range), 1);
}
function distance(first: Date, last: Date, range: DashboardGraphRange): number {
  if (range === '1d' || range === '1w') {
    // Calendar dates rather than elapsed local hours: DST must not shift week/day boundaries.
    const utcDay = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000;
    return Math.round((utcDay(last) - utcDay(first)) / (range === '1w' ? 7 : 1));
  }
  return ((last.getFullYear() - first.getFullYear()) * 12 + last.getMonth() - first.getMonth()) / monthsPerPeriod(range);
}
function label(start: Date, range: DashboardGraphRange): string {
  if (range === '1d') return graphDateLabel(start);
  if (range === '1w') return `${graphDateLabel(start)}`;
  if (range === '1y') return String(start.getFullYear());
  const last = shift(start, range, 1);
  last.setDate(0);
  const months = monthsPerPeriod(range);
  return `${shortMonth(start)}${months > 1 ? `–${shortMonth(last)}` : ''} '${String(start.getFullYear()).slice(-2)}`;
}

export function buildGraphPeriods(range: DashboardGraphRange, records: DatedRecord[], now: Date, window: GraphWindow = {}) {
  const capacity = Number.isFinite(window.bucketCount) ? Math.max(1, Math.min(24, Math.floor(window.bucketCount!))) : 6;
  const latest = periodStart(now, range);
  const earliest = records.reduce<Date | null>((min, record) => {
    const date = parseGraphDate(record.transaction_date);
    return date && date <= now && Number.isFinite(record.amount) && record.amount >= 0 && ['income', 'expense'].includes(record.type) && (!min || date < min) ? date : min;
  }, null);
  // An exploration window may include empty recent periods without inventing records.
  const minimumPeriods = Number.isFinite(window.minimumPeriods) ? Math.max(1, Math.min(24, Math.floor(window.minimumPeriods!))) : 1;
  const totalPeriods = Math.max(minimumPeriods, distance(periodStart(earliest ?? now, range), latest, range) + 1);
  const lastPage = Math.ceil(totalPeriods / capacity) - 1;
  const pageOffset = Number.isFinite(window.pageOffset) ? Math.max(0, Math.min(lastPage, Math.floor(window.pageOffset!))) : 0;
  const make = (offset: number, count: number): GraphBucket[] => Array.from({ length: count }, (_, index) => {
    // Page zero still shows recent history, but every page reads oldest → newest.
    const start = shift(latest, range, -(offset + count - 1 - index));
    return { start, end: shift(start, range, 1), label: label(start, range) };
  });
  const offset = pageOffset * capacity;
  const current = make(offset, Math.min(capacity, totalPeriods - offset));
  const previous = make(offset + current.length, Math.min(capacity, Math.max(0, totalPeriods - offset - current.length)));
  const first = current[0].start;
  const end = current.at(-1)!.end;
  const effectiveEnd = new Date(Math.min(end.getTime() - 1, now.getTime()));
  return {
    current, previous, capacity, pageOffset,
    hasOlder: pageOffset < lastPage, hasNewer: pageOffset > 0,
    periodStart: first.toISOString(), periodEnd: end.toISOString(),
    periodLabel: `${fullDate(first)} – ${fullDate(effectiveEnd)}`,
    bucketLabel: range === '1d' ? 'Days' : range === '1w' ? 'Weeks (Mon–Sun)' : range === '3m' ? 'Calendar quarters' : range === '6m' ? 'Half-years' : range === '1y' ? 'Years' : 'Months',
    bucketRanges: current.map(bucket => {
      const last = new Date(Math.min(bucket.end.getTime() - 1, now.getTime()));
      return bucket.start.getTime() === dayStart(last).getTime() ? fullDate(bucket.start) : `${fullDate(bucket.start)} – ${fullDate(last)}`;
    }),
  };
}
