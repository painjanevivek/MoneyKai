import { test, expect, type Page } from '@playwright/test';
import { seedAuthenticatedUser } from '../support/moneykai';

const cashflowNow = new Date('2026-05-15T12:00:00Z');

const seedCashflowPlanner = async (page: Page) => {
  await page.clock.install({ time: cashflowNow });
  await seedAuthenticatedUser(page, { onboarded: true, dashboard: 'cashflow' });
};

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

test.describe('MoneyKai Cashflow Planner dashboard', () => {
  test('renders the approved cashflow hierarchy from reviewed data', async ({ page }) => {
    await seedCashflowPlanner(page);
    await page.goto('/');

    const dashboard = page.getByTestId('cashflow-dashboard');
    const header = page.getByTestId('cashflow-dashboard-header');
    const summary = page.getByTestId('cashflow-summary');
    const commitments = page.getByTestId('estimated-commitments');
    const categories = page.getByTestId('category-spending');

    await expect(dashboard).toBeVisible();
    await expect(header.getByText('Cashflow plan')).toBeVisible();
    await expect(summary.getByText('Budget available')).toBeVisible();
    await expect(summary.getByText('Safe to spend')).toBeVisible();
    await expect(summary.getByText('Forecast net flow')).toBeVisible();
    await expect(commitments.getByText('Estimated recurring commitments')).toBeVisible();
    await expect(commitments.getByText('Apartment rent')).toBeVisible();
    await expect(categories.getByText('Spending by category')).toBeVisible();
  });

  test('preserves routes from primary dashboard actions', async ({ page }) => {
    await seedCashflowPlanner(page);
    await page.goto('/');

    const header = page.getByTestId('cashflow-dashboard-header');

    await header.getByRole('button', { name: 'Add transaction' }).click();
    await expect(page).toHaveURL(/\/transactions$/);

    await page.goBack();
    await header.getByRole('button', { name: 'Adjust budget' }).click();
    await expect(page).toHaveURL(/\/budgets$/);

    await page.goBack();
    await page.getByTestId('savings-goals').getByRole('button', { name: 'View all' }).click();
    await expect(page).toHaveURL(/\/goals$/);
  });

  test('explains the empty authenticated cashflow state', async ({ page }) => {
    await page.clock.install({ time: cashflowNow });
    await seedAuthenticatedUser(page, { onboarded: true, dashboard: 'empty' });
    await page.goto('/');

    const timeline = page.getByTestId('cashflow-timeline');
    const recentTransactions = page.getByTestId('recent-transactions');

    await expect(page.getByTestId('cashflow-dashboard-header')).toBeVisible();
    await expect(page.getByTestId('cashflow-summary')).toBeVisible();
    await expect(timeline.getByText('Add transactions to build your cashflow timeline.')).toBeVisible();
    await expect(recentTransactions.getByText('No transactions in this reporting period')).toBeVisible();
  });

  test('closes forecasting when a historical reporting period is selected', async ({ page }) => {
    await seedCashflowPlanner(page);
    await page.goto('/');

    const reportingMonthControls = page.getByRole('button', { name: 'Choose reporting month' });
    const header = page.getByTestId('cashflow-dashboard-header');

    await expect(reportingMonthControls).toHaveCount(1);
    await header.getByRole('button', { name: 'Choose reporting month' }).click();
    await page.getByRole('button', { name: 'Show April 2026' }).click();

    await expect(page.getByText('Closed reporting period')).toBeVisible();
    await expect(page.getByTestId('estimated-commitments')).toHaveCount(0);
    await expect(page.getByText('Estimated recurring commitments')).toHaveCount(0);
  });

  test('matches the desktop cashflow dashboard', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Desktop visual coverage runs in the Chromium project only.');

    await page.setViewportSize({ width: 1440, height: 900 });
    await seedCashflowPlanner(page);
    await page.goto('/');
    await dismissCookieConsent(page);
    await expect(page.getByTestId('cashflow-dashboard')).toBeVisible();
    await waitForFonts(page);

    await expect(page.getByTestId('cashflow-dashboard')).toHaveScreenshot('cashflow-dashboard-desktop.png', {
      animations: 'disabled',
    });
  });
});

test.describe('MoneyKai Cashflow Planner reduced-motion dashboard', () => {
  test.use({ reducedMotion: 'reduce' });

  test('keeps dashboard information available with reduced motion', async ({ page }) => {
    await seedCashflowPlanner(page);
    await page.goto('/');

    await expect(page.getByTestId('cashflow-dashboard-header')).toBeVisible();
    await expect(page.getByTestId('cashflow-summary')).toBeVisible();
    await expect(page.getByTestId('cashflow-timeline')).toBeVisible();
    await expect(page.getByTestId('recent-transactions')).toBeVisible();
  });
});
