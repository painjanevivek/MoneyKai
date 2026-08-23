import { describe, expect, it, vi } from 'vitest';
import type { CategoryReduction } from '@/types/budget';
import { calculateSavingsProjection } from './savingsEngine';

vi.mock('./formatCurrency', () => ({ formatCurrency: (value: number) => String(value) }));

describe('calculateSavingsProjection', () => {
  it('uses explicit period timing and does not mutate caller-owned reductions', () => {
    const reductions: CategoryReduction[] = [{
      category: 'food',
      currentAmount: 2_400,
      reductionPercent: 20,
      savedAmount: 0,
    }];

    const result = calculateSavingsProjection(
      5_000,
      [{ category: 'food', total: 2_400, count: 12, percentage: 100 }],
      reductions,
      0,
      { daysPassed: 24, daysLeft: 7, totalDays: 31 },
    );

    expect(result).toMatchObject({ currentSavings: 1_900, projectedSavings: 2_040, improvement: 140 });
    expect(reductions[0].savedAmount).toBe(0);
  });

  it('returns finite values for a future period with no elapsed days', () => {
    const result = calculateSavingsProjection(
      5_000,
      [],
      [],
      0,
      { daysPassed: 0, daysLeft: 31, totalDays: 31 },
    );

    expect(Object.values(result).filter((value) => typeof value === 'number').every(Number.isFinite)).toBe(true);
  });
});
