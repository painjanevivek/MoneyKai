import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  differenceInDays,
  isToday,
  isYesterday,
  isSameMonth,
  parseISO,
  setDate,
  isBefore,
} from 'date-fns';

export const formatDate = (date: string | Date, fmt: string = 'dd MMM yyyy'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
};

export const formatRelativeDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  if (isSameMonth(d, new Date())) return format(d, 'dd MMM');
  return format(d, 'dd MMM yyyy');
};

export const getDateRange = (range: 'daily' | 'weekly' | 'monthly' | 'custom', customStart?: Date, customEnd?: Date) => {
  const now = new Date();
  switch (range) {
    case 'daily':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'weekly':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'monthly':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'custom':
      return {
        start: customStart ? startOfDay(customStart) : startOfMonth(now),
        end: customEnd ? endOfDay(customEnd) : endOfMonth(now),
      };
  }
};

export const getDaysLeftInMonth = (): number => {
  const now = new Date();
  const monthEnd = endOfMonth(now);
  return differenceInDays(monthEnd, now);
};

export const getDaysInCurrentMonth = (): number => {
  const now = new Date();
  return differenceInDays(endOfMonth(now), startOfMonth(now)) + 1;
};

export const getDaysPassed = (): number => {
  const now = new Date();
  return differenceInDays(now, startOfMonth(now)) + 1;
};

export const getNextResetDate = (resetDay: number): Date => {
  const now = new Date();
  let resetDate = setDate(now, resetDay);
  if (isBefore(resetDate, now) || resetDate.getTime() === now.getTime()) {
    resetDate = setDate(addMonths(now, 1), resetDay);
  }
  return resetDate;
};

export const getDaysUntilReset = (resetDay: number): number => {
  return differenceInDays(getNextResetDate(resetDay), new Date());
};

export const getPreviousMonth = () => {
  const prev = subMonths(new Date(), 1);
  return { start: startOfMonth(prev), end: endOfMonth(prev) };
};

export const getLastSixMonths = () => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = subMonths(now, index);
    return {
      key: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy'),
      date,
    };
  }).reverse();
};

export { format, parseISO, isToday, isYesterday, startOfMonth, endOfMonth, differenceInDays, subMonths, addMonths };
