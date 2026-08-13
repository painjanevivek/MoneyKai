import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export const e2eUser = {
  id: 'e2e-user',
  email: 'e2e@moneykai.test',
  full_name: 'E2E User',
  auth_provider: 'email',
};

const storageKeys = [
  'moneykai-auth',
  'moneykai-settings',
  'moneykai-budget',
  'moneykai-transactions',
  'moneykai-portfolio',
  'moneykai-gmail-sync',
  'moneykai-notifications',
  'moneykai-financial-documents',
  'moneykai-groups',
  'moneykai-notes',
  'moneykai-challenges',
  'moneykai-badges',
];

export const resetMoneyKaiState = async (page: Page) => {
  await page.goto('/');
  await page.evaluate((keys) => {
    localStorage.clear();
    sessionStorage.clear();
    keys.forEach((key) => localStorage.removeItem(key));
  }, storageKeys);
};

type DashboardFixture = 'empty' | 'cashflow' | 'first-use' | 'no-budget';

export const seedAuthenticatedUser = async (
  page: Page,
  options: { onboarded?: boolean; dashboard?: DashboardFixture } = {},
) => {
  const onboarded = options.onboarded ?? true;
  await page.addInitScript(
    ({ user, tourCompleted }) => {
      localStorage.setItem(
        'moneykai-auth',
        JSON.stringify({
          state: {
            user,
            isAuthenticated: true,
            isOnboarded: tourCompleted,
          },
          version: 0,
        }),
      );
      localStorage.setItem(
        'moneykai-settings',
        JSON.stringify({
          state: {
            theme: 'jetLuxuryDark',
            themePalette: 'jetLuxury',
            darkModeEnabled: true,
            currency: 'INR',
            currencySymbol: 'Rs',
            notificationsEnabled: true,
            hapticEnabled: true,
            tourCompleted,
            tourCompletedByUserId: {
              [user.id]: tourCompleted,
            },
          },
          version: 0,
        }),
      );
    },
    { user: e2eUser, tourCompleted: onboarded },
  );

  if (options.dashboard === 'cashflow') {
    await seedCashflowDashboard(page);
  }

  if (options.dashboard === 'empty') {
    await seedEmptyCashflowDashboard(page);
  }

  if (options.dashboard === 'no-budget') {
    await seedNoBudgetCashflowDashboard(page);
  }

  if (options.dashboard === 'first-use') {
    await seedFirstUseCashflowDashboard(page);
  }
};

const seedDashboardFixture = async (page: Page, fixture: DashboardFixture) => {
  await page.addInitScript(
    ({ dashboard, user }) => {
      const transactions = dashboard === 'empty'
        ? [
            {
              id: 'historical-flight-feb',
              user_id: user.id,
              type: 'expense',
              amount: 8_000,
              category: 'travel',
              description: 'Flight booking',
              payment_method: 'upi',
              transaction_date: '2026-02-12',
              created_at: '2026-02-12T12:00:00.000Z',
            },
            {
              id: 'historical-dental-mar',
              user_id: user.id,
              type: 'expense',
              amount: 2_500,
              category: 'healthcare',
              description: 'Dental checkup',
              payment_method: 'upi',
              transaction_date: '2026-03-08',
              created_at: '2026-03-08T12:00:00.000Z',
            },
            {
              id: 'historical-lamp-apr',
              user_id: user.id,
              type: 'expense',
              amount: 1_200,
              category: 'shopping',
              description: 'Desk lamp',
              payment_method: 'upi',
              transaction_date: '2026-04-02',
              created_at: '2026-04-02T12:00:00.000Z',
            },
          ]
        : [
            {
              id: 'salary-may',
              user_id: user.id,
              type: 'income',
              amount: 60_000,
              category: 'income',
              description: 'Salary',
              payment_method: 'upi',
              transaction_date: '2026-05-01',
              created_at: '2026-05-01T12:00:00.000Z',
            },
            {
              id: 'groceries-may',
              user_id: user.id,
              type: 'expense',
              amount: 5_000,
              category: 'food',
              description: 'Groceries',
              payment_method: 'upi',
              transaction_date: '2026-05-10',
              created_at: '2026-05-10T12:00:00.000Z',
            },
            {
              id: 'freelance-may',
              user_id: user.id,
              type: 'income',
              amount: 8_500,
              category: 'income',
              description: 'Freelance project',
              payment_method: 'bank transfer',
              transaction_date: '2026-05-17',
              created_at: '2026-05-17T12:00:00.000Z',
            },
            {
              id: 'credit-card-may',
              user_id: user.id,
              type: 'expense',
              amount: 5_200,
              category: 'shopping',
              description: 'Credit card bill',
              payment_method: 'bank transfer',
              transaction_date: '2026-05-22',
              created_at: '2026-05-22T12:00:00.000Z',
            },
            {
              id: 'utilities-may',
              user_id: user.id,
              type: 'expense',
              amount: 4_850,
              category: 'utilities',
              description: 'Electricity',
              payment_method: 'upi',
              transaction_date: '2026-05-25',
              created_at: '2026-05-25T12:00:00.000Z',
            },
            {
              id: 'bigbasket-may',
              user_id: user.id,
              type: 'expense',
              amount: 1_245,
              category: 'food',
              description: 'BigBasket',
              payment_method: 'card',
              transaction_date: '2026-05-14',
              created_at: '2026-05-14T12:00:00.000Z',
            },
            {
              id: 'uber-may',
              user_id: user.id,
              type: 'expense',
              amount: 186,
              category: 'transport',
              description: 'Uber Auto',
              payment_method: 'upi',
              transaction_date: '2026-05-13',
              created_at: '2026-05-13T12:00:00.000Z',
            },
            {
              id: 'phone-may',
              user_id: user.id,
              type: 'expense',
              amount: 199,
              category: 'bills',
              description: 'Phone recharge',
              payment_method: 'upi',
              transaction_date: '2026-05-12',
              created_at: '2026-05-12T12:00:00.000Z',
            },
            {
              id: 'rent-apr',
              user_id: user.id,
              type: 'expense',
              amount: 20_000,
              category: 'housing',
              description: 'Apartment rent',
              payment_method: 'bank transfer',
              transaction_date: '2026-04-20',
              created_at: '2026-04-20T12:00:00.000Z',
            },
            {
              id: 'rent-mar',
              user_id: user.id,
              type: 'expense',
              amount: 20_000,
              category: 'housing',
              description: 'Apartment rent',
              payment_method: 'bank transfer',
              transaction_date: '2026-03-20',
              created_at: '2026-03-20T12:00:00.000Z',
            },
          ];
      const fixtureTransactions = dashboard === 'first-use' ? transactions.slice(0, 2) : transactions;
      const challenges = dashboard === 'cashflow'
        ? [
            {
              id: 'no-food-delivery-may',
              user_id: user.id,
              name: 'No Food Delivery',
              category: 'food',
              description: 'Avoid food delivery for 7 days',
              duration_days: 7,
              current_streak: 3,
              xp_earned: 0,
              savings_earned: 0,
              status: 'active',
              start_date: '2026-05-12',
              end_date: '2026-05-19',
              created_at: '2026-05-12T12:00:00.000Z',
            },
            {
              id: 'no-shopping-may',
              user_id: user.id,
              name: 'No Shopping',
              category: 'shopping',
              description: 'Avoid non-essential shopping for 7 days',
              duration_days: 7,
              current_streak: 4,
              xp_earned: 0,
              savings_earned: 2_800,
              status: 'active',
              start_date: '2026-05-11',
              end_date: '2026-05-18',
              created_at: '2026-05-11T12:00:00.000Z',
            },
            {
              id: 'no-cab-may',
              user_id: user.id,
              name: 'No Cab Challenge',
              category: 'transport',
              description: 'Use public transport for 7 days',
              duration_days: 7,
              current_streak: 2,
              xp_earned: 0,
              savings_earned: 600,
              status: 'active',
              start_date: '2026-05-13',
              end_date: '2026-05-20',
              created_at: '2026-05-13T12:00:00.000Z',
            },
          ]
        : [];

      localStorage.setItem(
        'moneykai-budget',
        JSON.stringify({
          state: {
            settings: {
              monthly_allowance: dashboard === 'no-budget' ? 0 : 50_000,
              reset_day: 1,
              auto_reset: true,
              carry_forward: false,
              currency: 'INR',
            },
            adjustments: dashboard === 'cashflow' ? [
              { amount: 4_500, type: 'add', reason: 'Added freelance income', date: '2026-05-01T12:00:00.000Z' },
              { amount: 2_000, type: 'subtract', reason: 'Reduced shopping budget', date: '2026-04-15T12:00:00.000Z' },
              { amount: 3_000, type: 'add', reason: 'Monthly reset adjustment', date: '2026-04-01T12:00:00.000Z' },
            ] : [],
            isEmergencyMode: false,
            resetHistory: [],
          },
          version: 0,
        }),
      );
      localStorage.setItem(
        'moneykai-transactions',
        JSON.stringify({
          state: {
            transactions: fixtureTransactions,
            isSeeded: false,
          },
          version: 0,
        }),
      );
      localStorage.setItem(
        'moneykai-challenges',
        JSON.stringify({
          state: {
            challenges,
            totalXP: 0,
          },
          version: 0,
        }),
      );
    },
    { dashboard: fixture, user: e2eUser },
  );
};

export const seedCashflowDashboard = async (page: Page) => {
  await seedDashboardFixture(page, 'cashflow');
};

const seedEmptyCashflowDashboard = async (page: Page) => {
  await seedDashboardFixture(page, 'empty');
};

const seedNoBudgetCashflowDashboard = async (page: Page) => {
  await seedDashboardFixture(page, 'no-budget');
};

const seedFirstUseCashflowDashboard = async (page: Page) => {
  await seedDashboardFixture(page, 'first-use');
};

export const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const rootOverflow = root.scrollWidth - root.clientWidth;
    const bodyOverflow = body.scrollWidth - body.clientWidth;
    return Math.max(rootOverflow, bodyOverflow);
  });

  expect(overflow).toBeLessThanOrEqual(1);
};
