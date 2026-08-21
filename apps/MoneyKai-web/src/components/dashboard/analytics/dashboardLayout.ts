export const DEFAULT_DASHBOARD_LAYOUT = [
  'overview',
  'cashflow',
  'breakdown',
  'signals',
  'records',
] as const;

export type DashboardSectionId = (typeof DEFAULT_DASHBOARD_LAYOUT)[number];

export const DASHBOARD_SECTION_META: Record<DashboardSectionId, { label: string; description: string }> = {
  overview: { label: 'Financial overview', description: 'Money in, money out, net cashflow, and reviewed records.' },
  cashflow: { label: 'Cashflow flow', description: 'Timeline, forecast, and rotating financial insights.' },
  breakdown: { label: 'Spending breakdown', description: 'Interactive category distribution and totals.' },
  signals: { label: 'Planning signals', description: 'Safe-to-spend, commitments, and month-end forecast.' },
  records: { label: 'Money records', description: 'Searchable and sortable transaction history.' },
};

const isDashboardSectionId = (value: unknown): value is DashboardSectionId =>
  typeof value === 'string' && DEFAULT_DASHBOARD_LAYOUT.some((section) => section === value);

export const normalizeDashboardLayout = (value: unknown): DashboardSectionId[] => {
  if (!Array.isArray(value)) return [...DEFAULT_DASHBOARD_LAYOUT];
  const unique = value.filter(isDashboardSectionId).filter((section, index, items) => items.indexOf(section) === index);
  return [...unique, ...DEFAULT_DASHBOARD_LAYOUT.filter((section) => !unique.includes(section))];
};

export const moveDashboardSection = (
  order: readonly DashboardSectionId[],
  section: DashboardSectionId,
  direction: -1 | 1,
) => {
  const currentIndex = order.indexOf(section);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= order.length) return [...order];
  const next = [...order];
  [next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]];
  return next;
};
