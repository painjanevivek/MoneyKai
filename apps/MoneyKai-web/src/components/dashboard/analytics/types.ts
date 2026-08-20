export type AnalyticsRange = '30d' | '90d' | '1y';

export const ANALYTICS_RANGE_OPTIONS: readonly { value: AnalyticsRange; label: string }[] = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '3 months' },
  { value: '1y', label: '1 year' },
];

export const rangeToDays = (range: AnalyticsRange) => range === '90d' ? 90 : range === '1y' ? 365 : 30;
