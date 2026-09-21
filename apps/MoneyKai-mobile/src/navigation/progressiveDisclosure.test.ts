import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const mobileRoot = resolve(process.cwd(), 'apps/MoneyKai-mobile/src');
const source = (path: string) => readFileSync(resolve(mobileRoot, path), 'utf8');

describe('production progressive disclosure routes', () => {
  it('activates the focused login, dashboard, and More surfaces', () => {
    expect(source('navigation/AuthNavigator.tsx')).toContain('ProgressiveLoginScreen');
    expect(source('navigation/ProductionAppTabs.tsx')).toContain('HomeOverviewScreen');
    expect(source('navigation/ProductionAppTabs.tsx')).toContain('MoreHubScreen');
  });

  it('keeps account, trust, settings, and advanced controls reachable', () => {
    const root = source('navigation/RootNavigator.tsx');
    for (const route of ['Account', 'TrustCenter', 'Settings', 'AdvancedSettings']) {
      expect(root).toContain(`name="${route}"`);
    }
  });

  it.each([
    'screens/auth/ProgressiveLoginScreen.tsx',
    'screens/app/HomeOverviewScreen.tsx',
    'screens/app/TransactionsScreen.tsx',
    'screens/app/BudgetScreen.tsx',
    'screens/app/GroupsHubScreen.tsx',
    'screens/app/AccountScreen.tsx',
    'screens/app/TrustCenterScreen.tsx',
    'screens/app/SettingsOverviewScreen.tsx',
  ])('%s provides contextual disclosure', (path) => {
    expect(source(path)).toContain('<Disclosure');
  });

  it('removes experimental feature promotion from the active More hub', () => {
    const more = source('screens/app/MoreHubScreen.tsx');
    for (const outOfScopeFeature of ['AI Review', 'MoneyKai+', 'Auto Capture', 'Savings']) {
      expect(more).not.toContain(outOfScopeFeature);
    }
  });
});
