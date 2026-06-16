import { test, expect } from '@playwright/test';
import { e2eUser, seedAuthenticatedUser } from '../support/moneykai';

test.describe('MoneyKai settings', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedUser(page, { onboarded: true });
    await page.goto('/settings');
  });

  test('renders account, preference, privacy, and support sections', async ({ page }) => {
    await expect(page.getByText(e2eUser.full_name)).toBeVisible();
    await expect(page.getByText(e2eUser.email)).toBeVisible();
    await expect(page.getByText('Budget')).toBeVisible();
    await expect(page.getByText('Appearance')).toBeVisible();
    await expect(page.getByText('Notifications')).toBeVisible();
    await expect(page.getByText('Data & Privacy')).toBeVisible();
    await expect(page.getByText('About')).toBeVisible();
  });

  test('opens critical account modals without leaving the settings page', async ({ page }) => {
    await page.getByText('Monthly Budget').click();
    await expect(page.getByText('Edit Monthly Budget')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await page.getByText('Cloud backups').click();
    await expect(page.getByText('Cloud backups').first()).toBeVisible();
    await expect(page.getByText('First backup checklist')).toBeVisible();

    await page.keyboard.press('Escape');
    await page.getByText('Sign Out').click();
    await expect(page.getByText('Sign out')).toBeVisible();
    await expect(page.getByText('This will clear your local session and take you back to the login screen.')).toBeVisible();
  });
});
