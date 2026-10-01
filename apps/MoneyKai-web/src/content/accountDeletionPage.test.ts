import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PUBLIC_ROUTES, SITE } from '@/constants/site';

const page = readFileSync(new URL('../app/account-deletion.tsx', import.meta.url), 'utf8');
const shell = readFileSync(new URL('../components/marketing/PublicShell.tsx', import.meta.url), 'utf8');
const settings = readFileSync(new URL('../app/(tabs)/settings.tsx', import.meta.url), 'utf8');

describe('public account-deletion page contract', () => {
  it('routes the Settings action to the real confirmation page, not a modal', () => {
    expect(settings).toContain("onPress={() => router.push('/account-deletion')}");
    expect(settings).not.toContain('showDeleteAccountSheet');
    expect(page).toContain('<AccountDeletionPanel />');
  });
  it('is discoverable as a public route and footer link', () => {
    expect(PUBLIC_ROUTES).toContain('/account-deletion');
    expect(shell).toContain("{ href: '/account-deletion', label: 'Account deletion' }");
    expect(page).toContain("const path = '/account-deletion'");
    expect(page).toContain('canonical: `${SITE.url}${path}`');
  });
  it('offers both verified in-app deletion and an explicit support request', () => {
    expect(page).toContain('Profile → Security & data → Delete account');
    expect(page).toContain('type DELETE');
    expect(page).toContain('mailto:${SITE.supportEmail}');
    expect(SITE.supportEmail).toBe('support@moneykai.app');
    expect(page).toContain('send it there to make your request');
    expect(page).toContain('does not delete your account');
    expect(page).not.toMatch(/fetch\(|deleteAccount\(|useAuthStore/);
  });
  it('explains scope and safety without promising an unverified deletion deadline', () => {
    expect(page).toContain('Do not send your password or transaction details');
    expect(page).toContain('cloud backups');
    expect(page).toContain('must be removed separately');
    expect(page).toContain('does not by itself request deletion');
    expect(page).not.toMatch(/within \d+|\d+ days/);
  });
  it('uses accessible link and heading semantics without a nested scroll view', () => {
    expect(page).toContain('<Link href={emailHref} asChild>');
    expect(page).toContain('aria-level={2}');
    expect(shell).toContain('aria-level={1}');
    expect(page).not.toContain('ScrollView');
  });
});
