import { test, expect } from '@playwright/test';
import { resetMoneyKaiState } from '../support/moneykai';

test.describe('MoneyKai auth journeys', () => {
  test.beforeEach(async ({ page }) => {
    await resetMoneyKaiState(page);
  });

  test('login validation shows required and malformed credential errors', async ({ page }) => {
    await page.goto('/login');

    await page.getByTestId('login-submit').click();

    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();

    await page.getByTestId('login-email').fill('not-an-email');
    await page.getByTestId('login-password').fill('short');
    await page.getByTestId('login-submit').click();

    await expect(page.getByText('Enter a valid email')).toBeVisible();
    await expect(page.getByText('Minimum 6 characters')).toBeVisible();
  });

  test('signup validation covers required fields and password mismatch', async ({ page }) => {
    await page.goto('/signup');

    await page.getByTestId('signup-submit').click();

    await expect(page.getByText('Name must be at least 2 characters')).toBeVisible();
    await expect(page.getByText('Enter a valid email')).toBeVisible();
    await expect(page.getByText('Minimum 8 characters')).toBeVisible();

    await page.getByTestId('signup-full-name').fill('Kai Tester');
    await page.getByTestId('signup-email').fill('kai@example.com');
    await page.getByTestId('signup-password').fill('Password123!');
    await page.getByTestId('signup-confirm-password').fill('Password123?');
    await page.getByTestId('signup-submit').click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('protected dashboard redirects signed-out users to login', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Welcome back')).toBeVisible();
  });
});
