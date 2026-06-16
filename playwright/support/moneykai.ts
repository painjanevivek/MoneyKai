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
  options: { onboarded?: boolean } = {},
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
