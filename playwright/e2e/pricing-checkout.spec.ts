import { test, expect, type Page } from '@playwright/test';
import { resetMoneyKaiState, seedAuthenticatedUser } from '../support/moneykai';

const dismissCookieConsent = async (page: Page) => {
  const consent = page.getByRole('alert', { name: 'Cookie consent' });
  const consentVisible = await consent
    .waitFor({ state: 'visible', timeout: 4_000 })
    .then(() => true)
    .catch(() => false);

  if (consentVisible) {
    await consent.getByRole('button', { name: 'Decline', exact: true }).click();
  }

  await expect(consent).toHaveCount(0);
};

test.describe('MoneyKai pricing and checkout edges', () => {
  test.beforeEach(async ({ page }) => {
    await resetMoneyKaiState(page);
  });

  test('states the current Android release is free and has no checkout', async ({ page }) => {
    await page.goto('/pricing');

    const main = page.getByRole('main');
    const freePlanCard = main.getByRole('button', { name: /Open app$/ }).locator('..');
    const planCards = freePlanCard.locator('..').locator(':scope > *');

    await expect(planCards).toHaveCount(1);
    await expect(main.getByText('Free local tracking. No paid Android plan in this release.')).toBeVisible();
    await expect(main.getByText('Free', { exact: true })).toBeVisible();
    await expect(main.getByText('No Android payments', { exact: true })).toBeVisible();
    await expect(main.getByText('The current Android release does not include in-app purchases, subscriptions, checkout, or payment processing.')).toBeVisible();
    await expect(main.getByText('Future paid or cloud features need a fresh policy review.')).toBeVisible();
    await expect(main.getByRole('button', { name: /upgrade|premium|checkout|manage billing/i })).toHaveCount(0);
    await expect(main.getByText(/card number|cvv|expiration date/i)).toHaveCount(0);
  });

  test('free release entry actions require account creation', async ({ page }) => {
    await page.goto('/pricing');
    await dismissCookieConsent(page);

    await page.getByRole('button', { name: /Open app$/ }).click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole('button', { name: 'Create account', exact: true })).toBeVisible();

    await page.goto('/pricing');
    await page.getByRole('button', { name: /Open MoneyKai/ }).click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole('button', { name: 'Create account', exact: true })).toBeVisible();
  });

  test('a cancelled checkout query cannot invent billing state in the free release', async ({ page }) => {
    await page.goto('/pricing?checkout=cancelled');

    const main = page.getByRole('main');

    await expect(page).toHaveURL(/\/pricing\?checkout=cancelled$/);
    await expect(main.getByText('Current Android release', { exact: true })).toBeVisible();
    await expect(main.getByText('No Android payments', { exact: true })).toBeVisible();
    await expect(main.getByText(/billing status|checkout was cancelled|free plan active/i)).toHaveCount(0);
  });

  test('an authenticated local session does not start billing from public pricing', async ({ page }) => {
    const billingRequests: string[] = [];
    page.on('request', (request) => {
      const pathname = new URL(request.url()).pathname;
      if (pathname.startsWith('/api/billing/')) {
        billingRequests.push(pathname);
      }
    });
    await seedAuthenticatedUser(page, { onboarded: true });

    await page.goto('/pricing');
    await dismissCookieConsent(page);

    const main = page.getByRole('main');
    await expect(main.getByText('No paid tiers in Android release', { exact: true })).toBeVisible();
    await expect(main.getByRole('button', { name: /upgrade|premium|checkout|manage billing/i })).toHaveCount(0);
    expect(billingRequests).toEqual([]);
  });
});
