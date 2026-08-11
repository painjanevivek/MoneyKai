import { test, expect, type Page } from '@playwright/test';
import { e2eUser, seedAuthenticatedUser } from '../support/moneykai';

const dismissCookieConsent = async (page: Page) => {
  const cookieChoices = page.getByText('Cookie choices', { exact: true });
  const decline = page.getByRole('button', { name: 'Decline', exact: true });
  const consentVisible = await decline
    .waitFor({ state: 'visible', timeout: 4_000 })
    .then(() => true)
    .catch(() => false);

  if (consentVisible) {
    await decline.click();
  }

  await expect(cookieChoices).toHaveCount(0);
};

test.describe('MoneyKai settings', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthenticatedUser(page, { onboarded: true });
    await page.goto('/settings');
    await dismissCookieConsent(page);
  });

  test('renders account, preference, privacy, and support sections', async ({ page }) => {
    const main = page.getByRole('main');

    await expect(main.getByText(e2eUser.full_name, { exact: true })).toBeVisible();
    await expect(main.getByText(e2eUser.email, { exact: true })).toBeVisible();
    await expect(main.getByText('Appearance', { exact: true })).toBeVisible();
    await expect(main.getByText('Notifications', { exact: true })).toBeVisible();
    await expect(main.getByText('Data & Privacy', { exact: true })).toBeVisible();
    await expect(main.getByText('About', { exact: true })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Choose website theme', exact: true })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Display Currency', exact: true })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Cloud backups', exact: true })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Help & Support', exact: true })).toBeVisible();
    await expect(main.getByText('Version', { exact: true })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Version', exact: true })).toHaveCount(0);
  });

  test('opens critical account modals without leaving the settings page', async ({ page }) => {
    const main = page.getByRole('main');

    await main.getByRole('button', { name: 'Delete Account', exact: true }).click();
    const deleteAccountSheet = page.getByRole('dialog');
    await expect(deleteAccountSheet).toBeVisible();
    await expect(deleteAccountSheet.getByText('This cannot be undone', { exact: true })).toBeVisible();
    await expect(deleteAccountSheet.getByRole('button', { name: 'Delete', exact: true })).toBeVisible();
    await deleteAccountSheet.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(deleteAccountSheet).toBeHidden();

    await main.getByRole('button', { name: 'Cloud backups', exact: true }).click();
    const backupSheet = page.getByRole('dialog');
    await expect(backupSheet).toBeVisible();
    await expect(backupSheet.getByText('Latest available backup', { exact: true })).toBeVisible();
    await expect(backupSheet.getByRole('button', { name: 'Restore Latest Backup', exact: true })).toBeVisible();
    await expect(backupSheet.getByText('First backup checklist', { exact: true })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(backupSheet).toBeHidden();
    await main.getByText('Sign Out', { exact: true }).click();
    const signOutSheet = page.getByRole('dialog');
    await expect(signOutSheet).toBeVisible();
    await expect(signOutSheet.getByText('This will clear your local session and take you back to the login screen.', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/settings$/);
  });
});
