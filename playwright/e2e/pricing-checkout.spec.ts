import { test, expect } from '@playwright/test';
import { resetMoneyKaiState, seedAuthenticatedUser } from '../support/moneykai';

test.describe('MoneyKai pricing and checkout edges', () => {
  test.beforeEach(async ({ page }) => {
    await resetMoneyKaiState(page);
  });

  test('signed-out pricing explains free and Stripe-hosted premium paths', async ({ page }) => {
    await page.goto('/pricing');

    await expect(page.getByText('Start free. Upgrade only when deeper reporting is worth it.')).toBeVisible();
    await expect(page.getByText('Free')).toBeVisible();
    await expect(page.getByText('Secure checkout')).toBeVisible();
    await expect(page.getByText('Stripe-hosted checkout')).toBeVisible();
    await expect(page.getByText('Payment details are collected by Stripe, not stored in MoneyKai client code.')).toBeVisible();
    await expect(page.getByText(/card number|cvv|expiration date/i)).toHaveCount(0);
  });

  test('free and premium plan CTAs require account creation before checkout', async ({ page }) => {
    await page.goto('/pricing');

    await page.getByTestId('pricing-start-cta').click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByText('Create account')).toBeVisible();

    await page.goto('/pricing');
    await page.getByTestId('pricing-premium-cta').click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByText('Create account')).toBeVisible();
  });

  test('returning from cancelled checkout shows a recoverable payment state', async ({ page }) => {
    await page.goto('/pricing?checkout=cancelled');

    await expect(page.getByText('BILLING STATUS')).toBeVisible();
    await expect(page.getByText('Checkout was cancelled. No payment method was changed.')).toBeVisible();
    await expect(page.getByText('Free plan active')).toBeVisible();
  });

  test('signed-in users without Firebase auth see a checkout error instead of a silent failure', async ({ page }) => {
    await seedAuthenticatedUser(page, { onboarded: true });

    await page.goto('/pricing');
    await page.getByTestId('pricing-premium-cta').click();

    await expect(page.getByText('Sign in before managing billing.')).toBeVisible();
  });
});
