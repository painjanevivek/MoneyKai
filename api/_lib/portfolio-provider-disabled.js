const zerodhaSetupItems = () => [
  'Create a Kite Connect app in Zerodha Developer Console.',
  'Configure backend KITE_API_KEY, KITE_API_SECRET, and redirect URI environment variables.',
  'Store access tokens and refresh metadata server-side with encryption.',
  'Deploy sync, callback, disconnect, and duplicate-safe import routes before enabling users.',
];

const accountAggregatorSetupItems = () => [
  'Choose an RBI Account Aggregator/FIU technology partner.',
  'Complete FIU onboarding, consent templates, and compliance review.',
  'Configure client credentials, certificates, redirect URL, and webhook URL on the backend.',
  'Deploy consent creation, callback, data-fetch, and disconnect routes before showing live AA sync.',
];

const disabledZerodhaStart = () => ({
  enabled: false,
  authorizationUrl: null,
  state: null,
  expiresAt: null,
  mode: 'production',
  message: 'Live Zerodha sync is not configured for this MoneyKai deployment yet. Manual holdings are available now.',
  manualSetupRequired: zerodhaSetupItems(),
});

const disabledZerodhaCallback = () => ({
  enabled: false,
  account: null,
  mode: 'production',
  message: 'Live Zerodha sync requires backend Kite Connect credentials before users can connect accounts.',
  manualSetupRequired: zerodhaSetupItems(),
});

const disabledAccountAggregatorExploration = () => ({
  providerKey: 'account_aggregator',
  productionReady: false,
  buildVsPartnerDecision: 'partner_required',
  partnerName: null,
  partnerUrl: null,
  decisionLockedAt: null,
  readinessAccountId: null,
  manualSetupRequired: accountAggregatorSetupItems(),
  checklist: accountAggregatorSetupItems(),
});

module.exports = {
  disabledAccountAggregatorExploration,
  disabledZerodhaCallback,
  disabledZerodhaStart,
};
