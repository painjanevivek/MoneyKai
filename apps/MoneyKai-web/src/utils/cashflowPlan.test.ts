import { describe, expect, it } from 'vitest';
import type { Challenge } from '../types/challenge';
import type { Transaction } from '../types/transaction';
import { buildCashflowPlan, inferMonthlyCommitments } from './cashflowPlan';

const makeTransaction = (
  id: string,
  type: Transaction['type'],
  amount: number,
  date: string,
  description: string,
  category: string,
): Transaction => ({
  id,
  user_id: 'e2e-user',
  type,
  amount,
  category,
  description,
  payment_method: 'upi',
  transaction_date: date,
  created_at: `${date}T12:00:00.000Z`,
});

const makeChallenge = (
  id: string,
  name: string,
  currentStreak: number,
  durationDays: number,
  savingsEarned: number,
  endDate: string,
  status: Challenge['status'] = 'active',
): Challenge => ({
  id,
  user_id: 'e2e-user',
  name,
  category: 'savings',
  description: `${name} description`,
  duration_days: durationDays,
  current_streak: currentStreak,
  xp_earned: 0,
  savings_earned: savingsEarned,
  status,
  start_date: '2026-05-01',
  end_date: endDate,
  created_at: '2026-05-01T00:00:00.000Z',
});

const inferForMay = (
  transactions: Transaction[],
  now = new Date('2026-05-15T12:00:00Z'),
) => inferMonthlyCommitments({
  transactions,
  cycleStart: new Date('2026-05-01T00:00:00Z'),
  cycleEnd: new Date('2026-06-01T00:00:00Z'),
  now,
});

describe('inferMonthlyCommitments', () => {
  it('projects a stable monthly expense into the active cycle', () => {
    const transactions = [
      makeTransaction('rent-mar', 'expense', 20_000, '2026-03-20', 'Apartment rent', 'housing'),
      makeTransaction('rent-apr', 'expense', 20_000, '2026-04-20', 'Apartment rent', 'housing'),
    ];
    const result = inferMonthlyCommitments({
      transactions,
      cycleStart: new Date('2026-05-01T00:00:00Z'),
      cycleEnd: new Date('2026-06-01T00:00:00Z'),
      now: new Date('2026-05-15T12:00:00Z'),
    });
    expect(result).toMatchObject([
      { label: 'Apartment rent', type: 'expense', amount: 20_000, projectedDate: '2026-05-21', confidence: 'estimated' },
    ]);
    expect(result[0].sourceTransactionIds).toEqual(['rent-mar', 'rent-apr']);
  });

  it('rejects a single transaction and unstable amounts', () => {
    const transactions = [
      makeTransaction('one', 'expense', 500, '2026-04-10', 'One time', 'other'),
      makeTransaction('noisy-1', 'expense', 1_000, '2026-03-12', 'Variable item', 'other'),
      makeTransaction('noisy-2', 'expense', 1_800, '2026-04-12', 'Variable item', 'other'),
    ];
    expect(inferMonthlyCommitments({
      transactions,
      cycleStart: new Date('2026-05-01T00:00:00Z'),
      cycleEnd: new Date('2026-06-01T00:00:00Z'),
      now: new Date('2026-05-15T12:00:00Z'),
    })).toEqual([]);
  });

  it('includes a stable pattern beginning exactly 180 calendar days before the cycle', () => {
    const transactions = [
      makeTransaction('boundary', 'expense', 900, '2025-11-02', 'Boundary bill', 'utilities'),
      makeTransaction('next', 'expense', 900, '2025-12-07', 'Boundary bill', 'utilities'),
    ];

    expect(inferForMay(transactions).map(({ projectedDate }) => projectedDate)).toEqual(['2026-05-31']);
  });

  it('does not treat a transaction on the cycle start as history', () => {
    const transactions = [
      makeTransaction('history', 'expense', 900, '2026-04-06', 'Boundary bill', 'utilities'),
      makeTransaction('cycle-start', 'expense', 900, '2026-05-01', 'Boundary bill', 'utilities'),
    ];

    expect(inferForMay(transactions)).toEqual([]);
  });

  it('includes a projection exactly on the cycle start', () => {
    const transactions = [
      makeTransaction('bill-mar', 'expense', 900, '2026-03-02', 'Boundary bill', 'utilities'),
      makeTransaction('bill-apr', 'expense', 900, '2026-04-01', 'Boundary bill', 'utilities'),
    ];

    expect(inferForMay(transactions, new Date('2026-05-01T12:00:00Z')).map(({ projectedDate }) => projectedDate))
      .toEqual(['2026-05-01']);
  });

  it('excludes a projection exactly on the cycle end', () => {
    const transactions = [
      makeTransaction('bill-mar', 'expense', 900, '2026-03-23', 'Boundary bill', 'utilities'),
      makeTransaction('bill-apr', 'expense', 900, '2026-04-27', 'Boundary bill', 'utilities'),
    ];

    expect(inferForMay(transactions, new Date('2026-05-01T12:00:00Z'))).toEqual([]);
  });

  it('keeps a commitment due today instead of advancing it another month', () => {
    const transactions = [
      makeTransaction('subscription-mar', 'expense', 499, '2026-03-14', 'Music subscription', 'entertainment'),
      makeTransaction('subscription-apr', 'expense', 499, '2026-04-14', 'Music subscription', 'entertainment'),
    ];

    expect(inferForMay(transactions).map(({ projectedDate }) => projectedDate)).toEqual(['2026-05-15']);
  });

  it('suppresses an estimate when the same commitment was already paid this cycle', () => {
    const transactions = [
      makeTransaction('rent-mar', 'expense', 20_000, '2026-03-20', 'Apartment rent', 'housing'),
      makeTransaction('rent-apr', 'expense', 20_000, '2026-04-20', 'Apartment rent', 'housing'),
      makeTransaction('rent-paid', 'expense', 20_000, '2026-05-10', 'Apartment rent', 'housing'),
    ];

    expect(inferForMay(transactions)).toEqual([]);
  });

  it.each([
    { interval: 25, first: '2026-03-01', second: '2026-03-26', projected: '2026-05-15' },
    { interval: 35, first: '2026-02-11', second: '2026-03-18', projected: '2026-05-27' },
  ])('accepts a stable $interval-day interval', ({ first, second, projected }) => {
    const transactions = [
      makeTransaction('first', 'expense', 750, first, 'Interval bill', 'utilities'),
      makeTransaction('second', 'expense', 750, second, 'Interval bill', 'utilities'),
    ];

    expect(inferForMay(transactions, new Date('2026-05-01T12:00:00Z')).map(({ projectedDate }) => projectedDate))
      .toEqual([projected]);
  });

  it.each([
    { interval: 24, first: '2026-03-01', second: '2026-03-25' },
    { interval: 36, first: '2026-02-10', second: '2026-03-18' },
  ])('rejects a $interval-day interval', ({ first, second }) => {
    const transactions = [
      makeTransaction('first', 'expense', 750, first, 'Interval bill', 'utilities'),
      makeTransaction('second', 'expense', 750, second, 'Interval bill', 'utilities'),
    ];

    expect(inferForMay(transactions, new Date('2026-05-01T12:00:00Z'))).toEqual([]);
  });

  it('keeps identical descriptions separate by transaction type and category', () => {
    const transactions = [
      makeTransaction('expense-housing-mar', 'expense', 100, '2026-03-01', 'Shared transfer', 'housing'),
      makeTransaction('expense-housing-apr', 'expense', 100, '2026-04-01', 'Shared transfer', 'housing'),
      makeTransaction('expense-utilities-mar', 'expense', 200, '2026-03-01', 'Shared transfer', 'utilities'),
      makeTransaction('expense-utilities-apr', 'expense', 200, '2026-04-01', 'Shared transfer', 'utilities'),
      makeTransaction('income-housing-mar', 'income', 300, '2026-03-01', 'Shared transfer', 'housing'),
      makeTransaction('income-housing-apr', 'income', 300, '2026-04-01', 'Shared transfer', 'housing'),
    ];

    expect(inferForMay(transactions, new Date('2026-05-01T12:00:00Z')).map((item) => ({
      type: item.type,
      category: item.category,
      amount: item.amount,
    }))).toEqual([
      { type: 'expense', category: 'housing', amount: 100 },
      { type: 'expense', category: 'utilities', amount: 200 },
      { type: 'income', category: 'housing', amount: 300 },
    ]);
  });

  it('rejects non-finite, zero, and negative recurrence amounts', () => {
    const transactions = [
      makeTransaction('nan-mar', 'expense', Number.NaN, '2026-03-01', 'NaN bill', 'utilities'),
      makeTransaction('nan-apr', 'expense', Number.NaN, '2026-04-01', 'NaN bill', 'utilities'),
      makeTransaction('infinity-mar', 'expense', Number.POSITIVE_INFINITY, '2026-03-02', 'Infinite bill', 'utilities'),
      makeTransaction('infinity-apr', 'expense', Number.POSITIVE_INFINITY, '2026-04-02', 'Infinite bill', 'utilities'),
      makeTransaction('zero-mar', 'expense', 0, '2026-03-03', 'Zero bill', 'utilities'),
      makeTransaction('zero-apr', 'expense', 0, '2026-04-03', 'Zero bill', 'utilities'),
      makeTransaction('negative-mar', 'expense', -100, '2026-03-04', 'Negative bill', 'utilities'),
      makeTransaction('negative-apr', 'expense', -100, '2026-04-04', 'Negative bill', 'utilities'),
    ];

    expect(inferForMay(transactions, new Date('2026-05-01T12:00:00Z'))).toEqual([]);
  });
});

describe('buildCashflowPlan', () => {
  it('uses UTC May boundaries regardless of the host timezone', () => {
    const originalTimezone = process.env.TZ;

    try {
      const results = ['America/Los_Angeles', 'Asia/Kolkata'].map((timezone) => {
        process.env.TZ = timezone;
        const plan = buildCashflowPlan({
          transactions: [
            makeTransaction('may-close', 'income', 1_000, '2026-05-31', 'Month close', 'income'),
            makeTransaction('june-open', 'expense', 400, '2026-06-01', 'Next month', 'other'),
          ],
          monthlyAllowance: 2_000,
          challenges: [],
          cycleStart: new Date('2026-05-01T00:00:00Z'),
          cycleEnd: new Date('2026-06-01T00:00:00Z'),
          now: new Date('2026-05-31T23:30:00Z'),
        });

        return {
          timezone,
          isForecastAvailable: plan.isForecastAvailable,
          actualIncome: plan.metrics.actualIncome,
          actualExpense: plan.metrics.actualExpense,
          timelineLength: plan.timeline.length,
          firstDate: plan.timeline[0]?.date,
          lastDate: plan.timeline.at(-1)?.date,
        };
      });

      expect(results).toEqual([
        {
          timezone: 'America/Los_Angeles',
          isForecastAvailable: true,
          actualIncome: 1_000,
          actualExpense: 0,
          timelineLength: 31,
          firstDate: '2026-05-01',
          lastDate: '2026-05-31',
        },
        {
          timezone: 'Asia/Kolkata',
          isForecastAvailable: true,
          actualIncome: 1_000,
          actualExpense: 0,
          timelineLength: 31,
          firstDate: '2026-05-01',
          lastDate: '2026-05-31',
        },
      ]);
    } finally {
      if (originalTimezone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimezone;
      }
    }
  });

  it('keeps inferred recurring expenses out of financial facts until confirmed', () => {
    const transactions = [
      makeTransaction('salary', 'income', 60_000, '2026-05-01', 'Salary', 'income'),
      makeTransaction('groceries', 'expense', 5_000, '2026-05-10', 'Groceries', 'food'),
      makeTransaction('rent-mar', 'expense', 20_000, '2026-03-20', 'Apartment rent', 'housing'),
      makeTransaction('rent-apr', 'expense', 20_000, '2026-04-20', 'Apartment rent', 'housing'),
    ];
    const plan = buildCashflowPlan({
      transactions,
      monthlyAllowance: 50_000,
      challenges: [],
      cycleStart: new Date('2026-05-01T00:00:00Z'),
      cycleEnd: new Date('2026-06-01T00:00:00Z'),
      now: new Date('2026-05-15T12:00:00Z'),
    });
    expect(plan.metrics).toEqual({
      budgetAvailable: 45_000,
      safeToSpend: 45_000,
      upcomingCommitments: 0,
      forecastNetFlow: 55_000,
      actualIncome: 60_000,
      actualExpense: 5_000,
    });
    expect(plan.commitments).toEqual([]);
    expect(plan.recurrenceCandidates).toHaveLength(1);
    expect(plan.recurrenceCandidates[0]).toMatchObject({
      label: 'Apartment rent',
      amount: 20_000,
      confidence: 'estimated',
    });
    expect(plan.isForecastAvailable).toBe(true);
  });

  it('includes only a confirmed recurring obligation in safe-to-spend and forecasts', () => {
    const transactions = [
      makeTransaction('salary', 'income', 60_000, '2026-05-01', 'Salary', 'income'),
      makeTransaction('groceries', 'expense', 5_000, '2026-05-10', 'Groceries', 'food'),
      makeTransaction('rent-mar', 'expense', 20_000, '2026-03-20', 'Apartment rent', 'housing'),
      makeTransaction('rent-apr', 'expense', 20_000, '2026-04-20', 'Apartment rent', 'housing'),
    ];
    const input = {
      transactions,
      monthlyAllowance: 50_000,
      challenges: [],
      cycleStart: new Date('2026-05-01T00:00:00Z'),
      cycleEnd: new Date('2026-06-01T00:00:00Z'),
      now: new Date('2026-05-15T12:00:00Z'),
    };
    const candidate = buildCashflowPlan(input).recurrenceCandidates[0]!;
    expect(candidate).toBeDefined();

    const plan = buildCashflowPlan({
      ...input,
      recurringObligations: [{
        ...candidate,
        userId: 'cashflow-user',
        status: 'confirmed',
        revision: 1,
        createdAt: '2026-05-15T12:00:00Z',
        updatedAt: '2026-05-15T12:00:00Z',
      }],
    });

    expect(plan.metrics).toEqual({
      budgetAvailable: 45_000,
      safeToSpend: 25_000,
      upcomingCommitments: 20_000,
      forecastNetFlow: 35_000,
      actualIncome: 60_000,
      actualExpense: 5_000,
    });
    expect(plan.recurrenceCandidates).toEqual([]);
    expect(plan.commitments).toHaveLength(1);
  });

  it('disables forecasting for a closed historical cycle', () => {
    const plan = buildCashflowPlan({
      transactions: [],
      monthlyAllowance: 50_000,
      challenges: [],
      cycleStart: new Date('2026-04-01T00:00:00Z'),
      cycleEnd: new Date('2026-05-01T00:00:00Z'),
      now: new Date('2026-05-15T12:00:00Z'),
    });
    expect(plan.isForecastAvailable).toBe(false);
    expect(plan.commitments).toEqual([]);
  });

  it('includes the cycle start and excludes the cycle end by calendar date', () => {
    const plan = buildCashflowPlan({
      transactions: [
        makeTransaction('opening', 'income', 1_000, '2026-05-01', 'Opening income', 'income'),
        makeTransaction('next-cycle', 'expense', 400, '2026-06-01', 'Next cycle', 'other'),
        makeTransaction('bad-date', 'expense', 200, 'not-a-date', 'Malformed', 'other'),
      ],
      monthlyAllowance: 2_000,
      challenges: [],
      cycleStart: new Date('2026-05-01T00:00:00Z'),
      cycleEnd: new Date('2026-06-01T00:00:00Z'),
      now: new Date('2026-05-15T12:00:00Z'),
    });

    expect(plan.metrics).toEqual({
      budgetAvailable: 2_000,
      safeToSpend: 2_000,
      upcomingCommitments: 0,
      forecastNetFlow: 1_000,
      actualIncome: 1_000,
      actualExpense: 0,
    });
    expect(plan.timeline[0].actualEvents.map(({ id }) => id)).toEqual(['opening']);
    expect(plan.ignoredTransactionCount).toBe(1);
  });

  it('excludes invalid monetary amounts from metrics, categories, and events', () => {
    const plan = buildCashflowPlan({
      transactions: [
        makeTransaction('invalid-infinity', 'income', Number.POSITIVE_INFINITY, '2026-05-02', 'Bad income', 'income'),
        makeTransaction('valid-income', 'income', 500, '2026-05-02', 'Income', 'income'),
        makeTransaction('invalid-negative', 'expense', -25, '2026-05-02', 'Refund-shaped expense', 'food'),
        makeTransaction('valid-expense', 'expense', 100, '2026-05-02', 'Lunch', 'food'),
        makeTransaction('invalid-nan', 'expense', Number.NaN, '2026-05-02', 'Bad expense', 'food'),
        makeTransaction('invalid-zero', 'income', 0, '2026-05-02', 'Zero income', 'income'),
      ],
      monthlyAllowance: 1_000,
      challenges: [],
      cycleStart: new Date('2026-05-01T00:00:00Z'),
      cycleEnd: new Date('2026-06-01T00:00:00Z'),
      now: new Date('2026-05-15T12:00:00Z'),
    });

    expect(plan.metrics).toEqual({
      budgetAvailable: 900,
      safeToSpend: 900,
      upcomingCommitments: 0,
      forecastNetFlow: 400,
      actualIncome: 500,
      actualExpense: 100,
    });
    expect(plan.categories).toEqual([{ category: 'food', total: 100, percentage: 100, count: 1 }]);
    expect(plan.timeline[1].actualEvents.map(({ id }) => id)).toEqual(['valid-expense', 'valid-income']);
  });

  it.each([
    { label: 'NaN', allowance: Number.NaN },
    { label: 'positive infinity', allowance: Number.POSITIVE_INFINITY },
    { label: 'negative infinity', allowance: Number.NEGATIVE_INFINITY },
    { label: 'negative', allowance: -100 },
    { label: 'zero', allowance: 0 },
  ])('treats a $label allowance as unset', ({ allowance }) => {
    const plan = buildCashflowPlan({
      transactions: [],
      monthlyAllowance: allowance,
      challenges: [],
      cycleStart: new Date('2026-05-01T00:00:00Z'),
      cycleEnd: new Date('2026-06-01T00:00:00Z'),
      now: new Date('2026-05-15T12:00:00Z'),
    });

    expect(plan.hasBudget).toBe(false);
    expect(plan.metrics.budgetAvailable).toBe(0);
    expect(plan.metrics.safeToSpend).toBe(0);
  });

  it('calculates category spending and active challenge goal snapshots', () => {
    const plan = buildCashflowPlan({
      transactions: [
        makeTransaction('food-1', 'expense', 200, '2026-05-02', 'Groceries', 'food'),
        makeTransaction('food-2', 'expense', 100, '2026-05-03', 'Lunch', 'food'),
        makeTransaction('travel', 'expense', 100, '2026-05-04', 'Train', 'travel'),
        makeTransaction('income', 'income', 1_000, '2026-05-01', 'Salary', 'income'),
      ],
      monthlyAllowance: 1_000,
      challenges: [
        makeChallenge('unknown', 'Custom savings goal', 12, 10, 700, '2026-05-25'),
        makeChallenge('known', 'No Food Delivery', 3, 7, 500, '2026-05-20'),
        makeChallenge('completed', 'Coffee Free Week', 7, 7, 500, '2026-05-10', 'completed'),
      ],
      cycleStart: new Date('2026-05-01T00:00:00Z'),
      cycleEnd: new Date('2026-06-01T00:00:00Z'),
      now: new Date('2026-05-15T12:00:00Z'),
    });

    expect(plan.categories).toEqual([
      { category: 'food', total: 300, percentage: 75, count: 2 },
      { category: 'travel', total: 100, percentage: 25, count: 1 },
    ]);
    expect(plan.goals).toEqual([
      {
        id: 'known',
        label: 'No Food Delivery',
        progressPercent: 42.857142857142854,
        currentValue: 500,
        targetValue: 1_500,
        endDate: '2026-05-20',
      },
      {
        id: 'unknown',
        label: 'Custom savings goal',
        progressPercent: 100,
        currentValue: 700,
        targetValue: 700,
        endDate: '2026-05-25',
      },
    ]);
  });

  it('builds cumulative actual and projected daily net-flow semantics', () => {
    const input = {
      transactions: [
        makeTransaction('income', 'income', 100, '2026-05-01', 'Salary', 'income'),
        makeTransaction('expense', 'expense', 30, '2026-05-02', 'Groceries', 'food'),
        makeTransaction('bill-mar', 'expense', 20, '2026-03-03', 'Monthly bill', 'utilities'),
        makeTransaction('bill-apr', 'expense', 20, '2026-04-03', 'Monthly bill', 'utilities'),
      ],
      monthlyAllowance: 200,
      challenges: [],
      cycleStart: new Date('2026-05-01T00:00:00Z'),
      cycleEnd: new Date('2026-06-01T00:00:00Z'),
      now: new Date('2026-05-03T12:00:00Z'),
    };
    const candidate = buildCashflowPlan(input).recurrenceCandidates[0]!;
    const plan = buildCashflowPlan({
      ...input,
      recurringObligations: [{
        ...candidate,
        userId: 'cashflow-user',
        status: 'confirmed',
        revision: 1,
        createdAt: '2026-05-03T12:00:00Z',
        updatedAt: '2026-05-03T12:00:00Z',
      }],
    });

    expect(plan.timeline).toHaveLength(31);
    expect(plan.timeline.slice(0, 5)).toMatchObject([
      { date: '2026-05-01', actualNetFlow: 100, projectedNetFlow: 100 },
      { date: '2026-05-02', actualNetFlow: 70, projectedNetFlow: 70 },
      { date: '2026-05-03', actualNetFlow: 70, projectedNetFlow: 70 },
      { date: '2026-05-04', actualNetFlow: null, projectedNetFlow: 50 },
      { date: '2026-05-05', actualNetFlow: null, projectedNetFlow: 50 },
    ]);
    expect(plan.timeline[3].projectedEvents.map(({ id }) => id)).toEqual([
      candidate.id,
    ]);
    expect(plan.timeline.at(-1)?.projectedNetFlow).toBe(50);
  });

  it('does not mutate input arrays and returns the same ordered plan for input permutations', () => {
    const transactions = [
      makeTransaction('beta-jan-z', 'expense', 200, '2026-01-01', 'Beta bill', 'utilities'),
      makeTransaction('alpha-jan-z', 'expense', 100, '2026-01-01', 'Alpha bill', 'housing'),
      makeTransaction('beta-jan-a', 'expense', 200, '2026-01-01', 'Beta bill', 'utilities'),
      makeTransaction('alpha-jan-a', 'expense', 100, '2026-01-01', 'Alpha bill', 'housing'),
      makeTransaction('beta-feb', 'expense', 200, '2026-02-01', 'Beta bill', 'utilities'),
      makeTransaction('alpha-feb', 'expense', 100, '2026-02-01', 'Alpha bill', 'housing'),
      makeTransaction('beta-mar', 'expense', 200, '2026-03-01', 'Beta bill', 'utilities'),
      makeTransaction('alpha-mar', 'expense', 100, '2026-03-01', 'Alpha bill', 'housing'),
      makeTransaction('beta-apr', 'expense', 200, '2026-04-01', 'Beta bill', 'utilities'),
      makeTransaction('alpha-apr', 'expense', 100, '2026-04-01', 'Alpha bill', 'housing'),
      makeTransaction('cycle-z', 'expense', 20, '2026-05-01', 'Cycle Z', 'other'),
      makeTransaction('cycle-a', 'income', 50, '2026-05-01', 'Cycle A', 'income'),
    ];
    const challenges = [
      makeChallenge('goal-b', 'Beta goal', 1, 2, 10, '2026-05-20'),
      makeChallenge('goal-a', 'Alpha goal', 1, 2, 10, '2026-05-20'),
    ];
    const transactionOrder = transactions.map(({ id }) => id);
    const challengeOrder = challenges.map(({ id }) => id);
    const input = {
      monthlyAllowance: 500,
      cycleStart: new Date('2026-05-01T00:00:00Z'),
      cycleEnd: new Date('2026-06-01T00:00:00Z'),
      now: new Date('2026-05-01T12:00:00Z'),
    };

    const forward = buildCashflowPlan({ ...input, transactions, challenges });
    const reversed = buildCashflowPlan({
      ...input,
      transactions: [...transactions].reverse(),
      challenges: [...challenges].reverse(),
    });

    expect(reversed).toEqual(forward);
    expect(forward.recurrenceCandidates.find(({ label }) => label === 'Alpha bill')?.sourceTransactionIds).toEqual([
      'alpha-jan-a',
      'alpha-jan-z',
      'alpha-feb',
      'alpha-mar',
      'alpha-apr',
    ]);
    expect(transactions.map(({ id }) => id)).toEqual(transactionOrder);
    expect(challenges.map(({ id }) => id)).toEqual(challengeOrder);
  });
});
