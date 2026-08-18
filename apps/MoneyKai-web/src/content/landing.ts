export const LANDING_PRIMARY_CTA = 'Create an account';
export const CURRENT_PLATFORM_AVAILABILITY =
  'There is no Android release today. These plans are for the upcoming MoneyKai web experience and are not yet available to purchase.';

export const pricingPlans = [
  {
    name: 'Free',
    price: '₹0',
    availability: 'Available at launch',
    description: 'Build a calm, consistent money-review habit without a subscription.',
    features: ['Manual income and expense tracking', 'Budgets and categories', 'Savings and shared expense views', 'Export your records'],
    cta: LANDING_PRIMARY_CTA,
  },
  {
    name: 'Plus',
    price: '₹249',
    availability: 'Coming soon',
    description: 'For richer monthly context when the next MoneyKai release is ready.',
    features: ['Everything in Free', 'Expanded review workflows', 'More report context', 'Priority feature access'],
    cta: 'Join the Plus waitlist',
  },
  {
    name: 'Premium',
    price: '₹449',
    availability: 'Coming soon',
    description: 'For the most complete MoneyKai workspace as premium limits are finalized.',
    features: ['Everything in Plus', 'Advanced reports', 'Portfolio review depth', 'Premium support path'],
    cta: 'Join the Premium waitlist',
  },
] as const;
