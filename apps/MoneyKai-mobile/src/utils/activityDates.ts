import { startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { fromLocalDateKey, isAllowedTransactionDate, toLocalDateKey } from './calendarDates';

export const ACTIVITY_DATE_OPTIONS = [
  { id: 'today', label: 'Today' }, { id: 'this_week', label: 'This week' },
  { id: 'this_month', label: 'This month' }, { id: 'three_months', label: 'Three months' },
  { id: 'six_months', label: 'Six months' }, { id: 'all', label: 'All time' }, { id: 'custom', label: 'Custom date' },
] as const;
export type ActivityDateId = typeof ACTIVITY_DATE_OPTIONS[number]['id'];
export type ActivityDates = { id: ActivityDateId; start: string; end: string };
export const initialActivityDates = (): ActivityDates => ({ id: 'all', start: toLocalDateKey(startOfMonth(new Date())), end: toLocalDateKey(new Date()) });
export function activityDateError(range: ActivityDates, now = new Date()) {
  if (range.id !== 'custom') return undefined;
  if (!isAllowedTransactionDate(range.start, now) || !isAllowedTransactionDate(range.end, now)) return 'Choose valid dates up to today.';
  if (range.start > range.end) return 'The end date must be on or after the start date.';
  return undefined;
}
export function activityDateBounds(range: ActivityDates, now = new Date()) {
  if(range.id === 'all') return {};
  const end=range.id === 'custom'?range.end:toLocalDateKey(now);
  const start=range.id === 'custom'?range.start:toLocalDateKey(range.id==='today'?now:range.id==='this_week'?startOfWeek(now,{weekStartsOn:1}):startOfMonth(subMonths(now,range.id==='three_months'?2:range.id==='six_months'?5:0)));
  return {from:start,to:end};
}
export function matchesActivityDate(value: string, range: ActivityDates, now = new Date()) {
  if (range.id === 'all') return true;
  const day = value.slice(0, 10);
  if (!fromLocalDateKey(day) || activityDateError(range, now)) return false;
  const end = range.id === 'custom' ? range.end : toLocalDateKey(now);
  const start = range.id === 'custom' ? range.start : toLocalDateKey(
    range.id === 'today' ? now : range.id === 'this_week' ? startOfWeek(now, { weekStartsOn: 1 }) :
      startOfMonth(subMonths(now, range.id === 'three_months' ? 2 : range.id === 'six_months' ? 5 : 0)));
  return day >= start && day <= end;
}
export const activityDateLabel = (range: ActivityDates) => range.id === 'custom' ? `${range.start} – ${range.end}` : ACTIVITY_DATE_OPTIONS.find(option => option.id === range.id)?.label ?? 'All time';
