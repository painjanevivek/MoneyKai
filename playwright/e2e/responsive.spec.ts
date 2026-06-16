import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, seedAuthenticatedUser } from '../support/moneykai';

test.describe('MoneyKai responsive mobile views', () => {
  test('public marketing, pricing, and auth pages fit mobile width', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile responsive smoke runs in the mobile project only.');

    for (const route of ['/', '/pricing', '/login', '/signup']) {
      await page.goto(route);
      await expectNoHorizontalOverflow(page);
    }

    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('authenticated dashboard and settings fit mobile width', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile responsive smoke runs in the mobile project only.');

    await seedAuthenticatedUser(page, { onboarded: true });

    await page.goto('/');
    await expect(page.getByText('Welcome back, E2E')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto('/settings');
    await expect(page.getByText('Data & Privacy')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
