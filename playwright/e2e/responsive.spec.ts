import { test, expect, type Page } from '@playwright/test';
import { expectNoHorizontalOverflow, seedAuthenticatedUser } from '../support/moneykai';

const cashflowNow = new Date('2026-05-15T12:00:00Z');

const dismissCookieConsent = async (page: Page) => {
  const decline = page.getByRole('button', { name: 'Decline' });
  if (await decline.isVisible().catch(() => false)) {
    await decline.click();
  }
};

const waitForFonts = async (page: Page) => {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
};

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

    await page.clock.install({ time: cashflowNow });
    await seedAuthenticatedUser(page, { onboarded: true, dashboard: 'cashflow' });

    await page.goto('/');
    await expect(page.getByText('Cashflow plan')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await dismissCookieConsent(page);
    await expect(page.getByTestId('cashflow-dashboard')).toBeVisible();
    await waitForFonts(page);
    await expect(page.getByTestId('cashflow-dashboard')).toHaveScreenshot('cashflow-dashboard-mobile.png', {
      animations: 'disabled',
    });

    await page.goto('/settings');
    await expect(page.getByText('Data & Privacy')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
