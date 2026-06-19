const DISABLED_MESSAGE =
  'Live bank linking is not configured for this MoneyKai deployment yet.';

const checklist = () => [
  'Choose and onboard a regulated account-data provider for the launch market.',
  'Configure backend-only provider credentials and encrypted token storage.',
  'Register consent redirect URLs and webhook signature verification.',
  'Map provider accounts, balances, and transactions into reviewable MoneyKai drafts.',
];

const manualSetupRequired = () => [
  'Provider client id and secret',
  'Consent start and callback endpoints',
  'Webhook verification secret',
  'Transaction de-duplication rules',
  'User-facing consent and disconnect copy',
];

const disabledProviderStatus = () => ({
  enabled: false,
  provider: 'account_aggregator',
  productionReady: false,
  sandboxEnabled: false,
  message: DISABLED_MESSAGE,
  checklist: checklist(),
  manualSetupRequired: manualSetupRequired(),
});

const disabledConnectStart = () => ({
  enabled: false,
  provider: 'account_aggregator',
  authorizationUrl: null,
  state: null,
  expiresAt: null,
  message: DISABLED_MESSAGE,
  checklist: checklist(),
  manualSetupRequired: manualSetupRequired(),
});

const disabledSync = () => ({
  error: {
    code: 'LINKED_ACCOUNT_PROVIDER_NOT_CONFIGURED',
    message: DISABLED_MESSAGE,
  },
  ...disabledProviderStatus(),
});

module.exports = {
  disabledConnectStart,
  disabledProviderStatus,
  disabledSync,
};
