import { describe, expect, it } from 'vitest';
import { buildSpendingRunway } from './spendingRunway';

describe('buildSpendingRunway', () => {
  const today = new Date(2026, 7, 12);

  it('turns the remaining budget into a daily safe-to-spend amount and names the top category', () => {
    const runway = buildSpendingRunway(
      3100,
      700,
      [
        { category: 'food', total: 450, percentage: 64, count: 3 },
        { category: 'transport', total: 250, percentage: 36, count: 2 },
      ],
      '2026-08',
      today
    );

    expect(runway).toMatchObject({
      state: 'on-track',
      daysRemaining: 20,
      safeToSpendPerDay: 120,
      topCategory: { category: 'food', total: 450 },
      actionLabel: 'Review food',
    });
  });

  it('asks for a monthly budget instead of presenting an invented runway', () => {
    const runway = buildSpendingRunway(
      0,
      450,
      [{ category: 'food', total: 450, percentage: 100, count: 1 }],
      '2026-08',
      today
    );

    expect(runway).toMatchObject({ state: 'no-budget', safeToSpendPerDay: null, actionLabel: 'Set monthly budget' });
  });

  it('keeps a usable daily limit and directs people to record their first expense when there is no spending', () => {
    const runway = buildSpendingRunway(3100, 0, [], '2026-08', today);

    expect(runway).toMatchObject({
      state: 'no-spending',
      daysRemaining: 20,
      safeToSpendPerDay: 155,
      topCategory: null,
      actionLabel: 'Add your first expense',
    });
  });
});
