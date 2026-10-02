import { fromLocalDateKey, toLocalDateKey } from '@/utils/calendarDates';
export const monthDate = (year: number, month: number) => new Date(year, month, 1);
export function clampCalendarDate(value: string | null, minimum?: string, maximum?: string, now = new Date()) {
  const valid = value && fromLocalDateKey(value) ? value : toLocalDateKey(now);
  return minimum && valid < minimum ? minimum : maximum && valid > maximum ? maximum : valid;
}
export function monthAvailable(year: number, month: number, minimum?: string, maximum?: string) {
  const first = toLocalDateKey(monthDate(year, month));
  const last = toLocalDateKey(new Date(year, month + 1, 0));
  return (!minimum || last >= minimum) && (!maximum || first <= maximum);
}
export function boundedMonth(year: number, month: number, minimum?: string, maximum?: string) {
  const key = clampCalendarDate(toLocalDateKey(monthDate(year, month)), minimum, maximum);
  const date = fromLocalDateKey(key)!;
  return monthDate(date.getFullYear(), date.getMonth());
}
