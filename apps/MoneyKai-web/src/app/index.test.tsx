import { describe, expect, it } from 'vitest';
import {
  CURRENT_PLATFORM_AVAILABILITY,
  LANDING_PRIMARY_CTA,
  pricingPlans,
} from '../content/landing';

describe('MoneyKai landing claims', () => {
  it('keeps the primary action explicit for a new visitor', () => {
    expect(LANDING_PRIMARY_CTA).toBe('Create an account');
    expect(pricingPlans.find((plan) => plan.name === 'Free')?.cta).toBe(LANDING_PRIMARY_CTA);
  });

  it('keeps Free available and future plans clearly marked as coming soon', () => {
    expect(pricingPlans).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Free', availability: 'Available at launch' }),
      expect.objectContaining({ name: 'Plus', availability: 'Coming soon' }),
      expect.objectContaining({ name: 'Premium', availability: 'Coming soon' }),
    ]));
  });

  it('does not imply an Android release or a current paid purchase', () => {
    expect(CURRENT_PLATFORM_AVAILABILITY).toContain('no Android release today');
    expect(CURRENT_PLATFORM_AVAILABILITY).toContain('upcoming MoneyKai web experience');
    expect(CURRENT_PLATFORM_AVAILABILITY).toContain('not yet available to purchase');
  });
});
