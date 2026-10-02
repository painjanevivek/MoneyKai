export type CalendarDay = {
  date: Date;
  key: string;
  inCurrentMonth: boolean;
};

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromLocalDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null;
}

export function isAllowedTransactionDate(key: string, now = new Date()): boolean {
  return fromLocalDateKey(key) !== null && key <= toLocalDateKey(now);
}

export function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const visibleDayCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  return Array.from({ length: visibleDayCount }, (_, index) => {
    const date = new Date(year, month, index - firstWeekday + 1);
    return { date, key: toLocalDateKey(date), inCurrentMonth: date.getMonth() === month };
  });
}
