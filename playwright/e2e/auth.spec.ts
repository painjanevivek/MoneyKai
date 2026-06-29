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

  test('Google login starts through the same-origin web auth route', async ({ page }) => {
    const legacyBackendCalls: string[] = [];
    const authStartCalls: string[] = [];

    await page.route('http://localhost:8000/**', async (route) => {
      legacyBackendCalls.push(route.request().url());
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'legacy backend route should not be used first' }),
      });
    });

    await page.route('**/api/v1/auth/google/start', async (route) => {
      authStartCalls.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authorizationUrl: new URL('/auth/google/callback?error=Mocked%20Google%20failure', page.url()).toString(),
        }),
      });
    });

    await page.goto('/login');
    await page.getByTestId('login-google').click();

    await expect(page).toHaveURL(/\/auth\/google\/callback/);
    await expect(page.getByText('Google sign-in failed')).toBeVisible();
    expect(authStartCalls).toHaveLength(1);
    expect(legacyBackendCalls).toEqual([]);
  });
});
