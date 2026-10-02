export const SMS_PARSE_INTERVALS = [
  { minutes: 15, label: '15 minutes' }, { minutes: 30, label: '30 minutes' },
  { minutes: 60, label: '1 hour' }, { minutes: 120, label: '2 hours' },
  { minutes: 720, label: '12 hours' }, { minutes: 1440, label: '24 hours' },
] as const;
export const normalizeSmsInterval = (minutes?: number) => SMS_PARSE_INTERVALS.some((option) => option.minutes === minutes) ? minutes! : 60;
