import { test, expect } from '@playwright/test';
import { seedAuthenticatedUser } from '../support/moneykai';

test.describe('MoneyKai onboarding and dashboard', () => {
  test('new signed-in users see onboarding and can skip into the dashboard', async ({ page }) => {
    await seedAuthenticatedUser(page, { onboarded: false, dashboard: 'cashflow' });

    await page.goto('/');

    const onboardingTour = page.getByLabel('Set up your MoneyKai workspace');
    const firstStepBody = onboardingTour.getByText(
      'The dashboard is the calm first read: available money, spend pressure, income, recent records, and the next best place to review.',
    );
    const secondStepBody = onboardingTour.getByText(
      'Transactions are the source of truth for reports. Add records manually, review imported entries, and keep categories clean.',
    );

    await expect(onboardingTour).toBeVisible();
    await expect(firstStepBody).toBeVisible();
    await expect(onboardingTour.getByText('1/6', { exact: true })).toBeVisible();

    await onboardingTour.getByRole('button', { name: 'Next' }).click();
    await expect(firstStepBody).toBeHidden();
    await expect(secondStepBody).toBeVisible();
    await expect(onboardingTour.getByText('2/6', { exact: true })).toBeVisible();

    await onboardingTour.getByRole('button', { name: 'Skip for now' }).click();
    await expect(page.getByTestId('cashflow-dashboard-header').getByText('Cashflow plan')).toBeVisible();
    await expect(page.getByTestId('cashflow-summary').getByText('Budget available')).toBeVisible();
    await expect(page.getByTestId('cashflow-dashboard-header').getByRole('button', { name: 'Add transaction' })).toBeVisible();
    await expect(page.getByTestId('cashflow-dashboard-header').getByRole('button', { name: 'Adjust budget' })).toBeVisible();
  });

  test('returning signed-in users land directly on dashboard controls', async ({ page }) => {
    await seedAuthenticatedUser(page, { onboarded: true, dashboard: 'empty' });

    await page.goto('/');

    await expect(page.getByTestId('cashflow-dashboard-header').getByText('Cashflow plan')).toBeVisible();
    await expect(page.getByText('Set up your MoneyKai workspace')).toBeHidden();
    await expect(page.getByTestId('cashflow-summary').getByText('Safe to spend')).toBeVisible();
    await expect(page.getByTestId('cashflow-dashboard-header').getByRole('button', { name: 'Add transaction' })).toBeVisible();
  });
});
