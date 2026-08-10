import { test, expect } from '@playwright/test';
import { seedAuthenticatedUser } from '../support/moneykai';

test.describe('MoneyKai onboarding and dashboard', () => {
  test('new signed-in users see onboarding and can skip into the dashboard', async ({ page }) => {
    await seedAuthenticatedUser(page, { onboarded: false });

    await page.goto('/');

    await expect(page.getByText('Set up your MoneyKai workspace')).toBeVisible();
    await expect(page.getByText('Start with the control center')).toBeVisible();

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByText('Build a reviewed ledger')).toBeVisible();

    await page.getByRole('button', { name: 'Skip for now' }).click();
    await expect(page.getByText('Cashflow plan')).toBeVisible();
    await expect(page.getByText('Budget available')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Transactions' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Portfolio' })).toBeVisible();
  });

  test('returning signed-in users land directly on dashboard controls', async ({ page }) => {
    await seedAuthenticatedUser(page, { onboarded: true });

    await page.goto('/');

    await expect(page.getByText('Cashflow plan')).toBeVisible();
    await expect(page.getByText('Set up your MoneyKai workspace')).toBeHidden();
    await expect(page.getByText('Safe to spend')).toBeVisible();
    await expect(page.getByRole('button', { name: 'AI Review' })).toBeVisible();
  });
});
