import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow, seedAuthenticatedUser } from '../support/moneykai';

const routes = [
  ['Dashboard', '/dashboard'],
  ['Transactions', '/transactions'],
  ['AI Review', '/ai-review'],
  ['Budgets', '/budgets'],
  ['Goals', '/goals'],
  ['Wealth', '/wealth'],
  ['Portfolio', '/portfolio'],
  ['Reports', '/reports'],
  ['Accounts', '/accounts'],
] as const;

test('keeps one authenticated shell across every primary tab', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-05-15T12:00:00Z') });
  await seedAuthenticatedUser(page, { onboarded: true, dashboard: 'cashflow' });

  for (const [label, route] of routes) {
    await page.goto(route);
    await expect(page.getByRole('link', { name: 'Go to MoneyKai dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: `Open ${label}` })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#main-content')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});
