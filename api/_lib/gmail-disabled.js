const RESTRICTED_SCOPES = [
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.readonly',
];

const setupChecklist = () => [
  'Create a Google Cloud OAuth client and add MoneyKai web/mobile redirect URLs.',
  'Configure backend GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAuth state signing, and encrypted token storage.',
  'Submit OAuth consent screen verification for Gmail restricted scopes before public release.',
  'Deploy Gmail status, connect, callback, sync, email list, disconnect, and attachment queue routes.',
  'Document data usage, deletion, retention, and user consent flows in the privacy policy.',
];

const disabledMessage = () =>
  'Gmail sync is not configured for this MoneyKai deployment yet. Restricted Gmail scopes require Google OAuth verification and backend token storage before users can connect accounts.';

const disabledStatus = () => ({
  enabled: false,
  connection: null,
  financialEmailCount: 0,
  parsedAttachmentCount: 0,
  needsPasswordCount: 0,
  importedItemCount: 0,
  lastSyncError: disabledMessage(),
  message: disabledMessage(),
  checklist: setupChecklist(),
  manualSetupRequired: setupChecklist(),
  restrictedScopes: RESTRICTED_SCOPES,
});

const disabledConnectStart = () => ({
  enabled: false,
  authorizationUrl: null,
  state: null,
  expiresAt: null,
  message: disabledMessage(),
  checklist: setupChecklist(),
  manualSetupRequired: setupChecklist(),
  restrictedScopes: RESTRICTED_SCOPES,
});

const disabledSync = () => ({
  error: {
    code: 'GMAIL_SYNC_NOT_CONFIGURED',
    message: disabledMessage(),
  },
  ...disabledStatus(),
});

const emptyEmailList = () => ({
  items: [],
  message: disabledMessage(),
  checklist: setupChecklist(),
});

const disabledAttachmentQueue = () => ({
  error: {
    code: 'GMAIL_ATTACHMENT_QUEUE_NOT_CONFIGURED',
    message: disabledMessage(),
  },
  queuedCount: 0,
  ignoredCount: 0,
  items: [],
  checklist: setupChecklist(),
});

module.exports = {
  disabledAttachmentQueue,
  disabledConnectStart,
  disabledStatus,
  disabledSync,
  emptyEmailList,
};
