import { describe, expect, it, vi } from 'vitest';
import { isRenderableInsightCard, type GuardedInsightCard } from '@/types/insight';
import { generateDeterministicInsights } from './insightEngine';

vi.mock('./formatCurrency', () => ({ formatCurrency: (value: number) => `INR ${Math.round(value)}` }));

const input = {
  monthlyAllowance: 10_000,
  period: { startDate: '2026-08-01', endDateExclusive: '2026-09-01' },
  progress: { daysPassed: 20, daysLeft: 11, totalDays: 31, isOpen: true },
  current: {
    income: 8_000,
    expense: 9_000,
    net: -1_000,
    count: 6,
    invalidCount: 0,
    transactions: [],
    categories: [{ category: 'food', total: 5_000, count: 4, percentage: 55.5555555556 }],
  },
  previous: {
    income: 8_000,
    expense: 6_000,
    net: 2_000,
    count: 5,
    invalidCount: 0,
    transactions: [],
    categories: [{ category: 'food', total: 3_000, count: 3, percentage: 50 }],
  },
};

describe('deterministic insight rules', () => {
  it('returns stable, evidence-backed cards without unsupported causal claims', () => {
    const first = generateDeterministicInsights(input);
    const second = generateDeterministicInsights(input);

    expect(second).toEqual(first);
    expect(first.length).toBeGreaterThan(0);
    expect(first.every(isRenderableInsightCard)).toBe(true);
    expect(first.every((card) => card.generatedBy === 'deterministic' && card.provenance.every((item) => item.ruleId?.endsWith('.v1')))).toBe(true);
    expect(first.map((card) => card.body).join(' ')).not.toMatch(/weekend|habit caused|you spend most/i);
  });

  it('does not render AI explanations that smuggle in metrics or unsafe actions', () => {
    const base: GuardedInsightCard = {
      id: 'ai-1',
      tone: 'info',
      title: 'AI explanation',
      body: 'An explanation over supplied aggregates.',
      caveat: 'This may be incomplete.',
      provenance: [{ source: 'submitted_aggregate', evidenceCode: 'total_spent', period: '2026-08' }],
      actions: [],
      generatedBy: 'ai',
    };

    expect(isRenderableInsightCard(base)).toBe(true);
    expect(isRenderableInsightCard({ ...base, metricLabel: 'Guaranteed saving', metricValue: 'INR 5000' })).toBe(false);
    expect(isRenderableInsightCard({ ...base, actions: [{ label: 'Leave app', href: 'https://evil.example' as '/reports' }] })).toBe(false);
    expect(isRenderableInsightCard({ ...base, provenance: [] })).toBe(false);
    expect(isRenderableInsightCard({ ...base, provenance: [{ source: 'submitted_aggregate', evidenceCode: 'guaranteed_return' as 'total_spent', period: '2026-08' }] })).toBe(false);
    expect(isRenderableInsightCard({ id: 'old-card', tone: 'info', title: 'Old', body: 'Missing guarded fields.' })).toBe(false);
  });
});
