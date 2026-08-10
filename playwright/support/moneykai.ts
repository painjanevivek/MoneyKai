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

export const seedAuthenticatedUser = async (
  page: Page,
  options: { onboarded?: boolean; dashboard?: 'empty' | 'cashflow' } = {},
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
            theme: 'light',
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
};

type DashboardFixture = 'empty' | 'cashflow';

const seedDashboardFixture = async (page: Page, fixture: DashboardFixture) => {
  await page.addInitScript(
    ({ dashboard, user }) => {
      const transactions = dashboard === 'cashflow'
        ? [
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
          ]
        : [];
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
          ]
        : [];

      localStorage.setItem(
        'moneykai-budget',
        JSON.stringify({
          state: {
            settings: {
              monthly_allowance: dashboard === 'cashflow' ? 50_000 : 0,
              reset_day: 1,
              auto_reset: true,
              carry_forward: false,
              currency: 'INR',
            },
            adjustments: [],
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
            transactions,
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
