import { describe, expect, it } from 'vitest';

import { linking, shouldHandleNavigationLink } from './linking';

describe('mobile 404 deep links', () => {
  it('registers a catch-all route for the app scheme', () => {
    expect(linking.prefixes).toContain('moneykai-mobile://');
    expect(linking.config?.screens?.NotFound).toBe('*');
  });

  it('leaves OAuth return URLs for their existing listeners', () => {
    expect(shouldHandleNavigationLink('moneykai-mobile://auth/google?code=example')).toBe(false);
    expect(shouldHandleNavigationLink('moneykai-mobile://more?gmail=connected')).toBe(false);
    expect(shouldHandleNavigationLink('moneykai-mobile://lost/receipt')).toBe(true);
  });
});
