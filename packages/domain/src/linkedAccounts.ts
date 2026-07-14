export type LinkedAccountProvider =
  | 'sandbox'
  | 'manual'
  | 'account_aggregator'
  | 'plaid'
  | 'teller'
  | 'finicity';

export type LinkedAccountKind =
  | 'checking'
  | 'savings'
  | 'credit_card'
  | 'wallet'
  | 'cash'
  | 'loan';

export type LinkedAccountStatus =
  | 'connected'
  | 'syncing'
  | 'needs_reauth'
  | 'paused'
  | 'error'
  | 'disconnected';

export type LinkedAccountFeatureFlags = {
  balanceRefresh: boolean;
  transactionImport: boolean;
  reauth: boolean;
  webhookSync: boolean;
};

export type LinkedAccountBalance = {
  current: number;
  available: number;
  limit?: number;
  currency: string;
  updatedAt: string;
};

export type LinkedAccount = {
  id: string;
  userId: string;
  provider: LinkedAccountProvider;
  providerAccountId?: string;
  institutionName: string;
  displayName: string;
  kind: LinkedAccountKind;
  maskedAccountNumber?: string;
  status: LinkedAccountStatus;
  balance: LinkedAccountBalance;
  features: LinkedAccountFeatureFlags;
  includeInBudget: boolean;
  includeInNetWorth: boolean;
  consentExpiresAt?: string;
  lastSyncedAt?: string;
  lastError?: string;
  syncCursor?: string;
  createdAt: string;
  updatedAt: string;
};

export const toClientLinkedAccount = ({ syncCursor: _syncCursor, ...account }: LinkedAccount): Omit<LinkedAccount, 'syncCursor'> => account;

export type LinkedAccountDraft = {
  institutionName: string;
  displayName: string;
  kind: LinkedAccountKind;
  maskedAccountNumber?: string;
  currentBalance: number;
  availableBalance?: number;
  limit?: number;
  currency?: string;
  includeInBudget?: boolean;
  includeInNetWorth?: boolean;
};

export type LinkedAccountSummary = {
  totalAccounts: number;
  connectedAccounts: number;
  syncingAccounts: number;
  attentionAccounts: number;
  cashBalance: number;
  creditUsed: number;
  availableCredit: number;
  totalAssets: number;
  totalLiabilities: number;
  netLinkedBalance: number;
  lastSyncedAt?: string;
};

export type LinkedAccountInsight = {
  id: string;
  title: string;
  body: string;
  tone: 'default' | 'positive' | 'warning' | 'danger';
  icon: string;
};

const ACTIVE_STATUSES: LinkedAccountStatus[] = ['connected', 'syncing', 'needs_reauth', 'error'];
const ATTENTION_STATUSES: LinkedAccountStatus[] = ['needs_reauth', 'error'];

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const addMinutes = (date: Date, minutes: number) => {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
};

export const getLinkedAccountKindLabel = (kind: LinkedAccountKind) => {
  switch (kind) {
    case 'checking':
      return 'Checking';
    case 'savings':
      return 'Savings';
    case 'credit_card':
      return 'Credit card';
    case 'wallet':
      return 'Wallet';
    case 'cash':
      return 'Cash';
    case 'loan':
      return 'Loan';
    default:
      return 'Account';
  }
};

export const getLinkedAccountProviderLabel = (provider: LinkedAccountProvider) => {
  switch (provider) {
    case 'account_aggregator':
      return 'Account Aggregator';
    case 'plaid':
      return 'Plaid';
    case 'teller':
      return 'Teller';
    case 'finicity':
      return 'Finicity';
    case 'manual':
      return 'Manual';
    case 'sandbox':
    default:
      return 'Sandbox';
  }
};

export const getLinkedAccountStatusLabel = (status: LinkedAccountStatus) => {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'syncing':
      return 'Syncing';
    case 'needs_reauth':
      return 'Needs re-auth';
    case 'paused':
      return 'Paused';
    case 'error':
      return 'Sync issue';
    case 'disconnected':
      return 'Disconnected';
    default:
      return 'Unknown';
  }
};

export const formatLinkedAccountMask = (account: Pick<LinkedAccount, 'maskedAccountNumber' | 'kind'>) => {
  const prefix = account.kind === 'credit_card' ? 'Card' : 'A/c';
  return account.maskedAccountNumber ? `${prefix} ending ${account.maskedAccountNumber}` : prefix;
};

export const isLinkedAccountActive = (account: LinkedAccount) =>
  ACTIVE_STATUSES.includes(account.status);

export const buildSandboxLinkedAccounts = (userId: string, now = new Date()): LinkedAccount[] => {
  const createdAt = now.toISOString();
  const lastSyncedAt = addMinutes(now, -8).toISOString();
  const consentExpiresAt = addDays(now, 180).toISOString();

  return [
    {
      id: 'linked_sandbox_hdfc_checking',
      userId,
      provider: 'sandbox',
      providerAccountId: 'sandbox-hdfc-7429',
      institutionName: 'HDFC Bank',
      displayName: 'HDFC Salary Account',
      kind: 'checking',
      maskedAccountNumber: '7429',
      status: 'connected',
      balance: {
        current: 68420.5,
        available: 68120.5,
        currency: 'INR',
        updatedAt: lastSyncedAt,
      },
      features: {
        balanceRefresh: true,
        transactionImport: true,
        reauth: true,
        webhookSync: false,
      },
      includeInBudget: true,
      includeInNetWorth: true,
      consentExpiresAt,
      lastSyncedAt,
      syncCursor: 'sandbox-hdfc-v1',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'linked_sandbox_sbi_credit',
      userId,
      provider: 'sandbox',
      providerAccountId: 'sandbox-sbi-1185',
      institutionName: 'SBI Card',
      displayName: 'SBI Prime Credit Card',
      kind: 'credit_card',
      maskedAccountNumber: '1185',
      status: 'connected',
      balance: {
        current: 14280,
        available: 85720,
        limit: 100000,
        currency: 'INR',
        updatedAt: lastSyncedAt,
      },
      features: {
        balanceRefresh: true,
        transactionImport: true,
        reauth: true,
        webhookSync: false,
      },
      includeInBudget: true,
      includeInNetWorth: false,
      consentExpiresAt,
      lastSyncedAt,
      syncCursor: 'sandbox-sbi-v1',
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'linked_sandbox_icici_savings',
      userId,
      provider: 'sandbox',
      providerAccountId: 'sandbox-icici-6042',
      institutionName: 'ICICI Bank',
      displayName: 'ICICI Savings',
      kind: 'savings',
      maskedAccountNumber: '6042',
      status: 'connected',
      balance: {
        current: 22500,
        available: 22500,
        currency: 'INR',
        updatedAt: lastSyncedAt,
      },
      features: {
        balanceRefresh: true,
        transactionImport: true,
        reauth: true,
        webhookSync: false,
      },
      includeInBudget: false,
      includeInNetWorth: true,
      consentExpiresAt,
      lastSyncedAt,
      syncCursor: 'sandbox-icici-v1',
      createdAt,
      updatedAt: createdAt,
    },
  ];
};

export const summarizeLinkedAccounts = (accounts: LinkedAccount[]): LinkedAccountSummary => {
  const activeAccounts = accounts.filter(isLinkedAccountActive);
  const sortedSyncTimes = activeAccounts
    .map((account) => account.lastSyncedAt)
    .filter(Boolean)
    .sort();
  const latestSync = sortedSyncTimes[sortedSyncTimes.length - 1];

  return activeAccounts.reduce<LinkedAccountSummary>(
    (summary, account) => {
      const current = account.balance.current;
      const available = account.balance.available;
      const limit = account.balance.limit ?? 0;

      if (account.status === 'connected') {
        summary.connectedAccounts += 1;
      }
      if (account.status === 'syncing') {
        summary.syncingAccounts += 1;
      }
      if (ATTENTION_STATUSES.includes(account.status)) {
        summary.attentionAccounts += 1;
      }

      if (account.kind === 'credit_card' || account.kind === 'loan') {
        summary.creditUsed += Math.max(0, current);
        summary.availableCredit += Math.max(0, available || limit - current);
        summary.totalLiabilities += Math.max(0, current);
      } else {
        summary.cashBalance += current;
        summary.totalAssets += current;
      }

      summary.netLinkedBalance = summary.totalAssets - summary.totalLiabilities;
      return summary;
    },
    {
      totalAccounts: activeAccounts.length,
      connectedAccounts: 0,
      syncingAccounts: 0,
      attentionAccounts: 0,
      cashBalance: 0,
      creditUsed: 0,
      availableCredit: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      netLinkedBalance: 0,
      lastSyncedAt: latestSync,
    }
  );
};

export const getLinkedAccountInsights = (accounts: LinkedAccount[], now = new Date()): LinkedAccountInsight[] => {
  const activeAccounts = accounts.filter(isLinkedAccountActive);
  if (activeAccounts.length === 0) {
    return [
      {
        id: 'empty',
        title: 'Connect one account first',
        body: 'Bank linking unlocks balance freshness, account-scoped filters, and duplicate-safe transaction imports.',
        tone: 'default',
        icon: 'bank-plus',
      },
    ];
  }

  const insights: LinkedAccountInsight[] = [];
  const staleCutoff = now.getTime() - 36 * 60 * 60 * 1000;
  const staleAccounts = activeAccounts.filter((account) => {
    if (!account.lastSyncedAt) return true;
    return new Date(account.lastSyncedAt).getTime() < staleCutoff;
  });
  const needsReauth = activeAccounts.filter((account) => account.status === 'needs_reauth');
  const errorAccounts = activeAccounts.filter((account) => account.status === 'error');
  const creditCards = activeAccounts.filter((account) => account.kind === 'credit_card' && account.balance.limit);
  const highUtilization = creditCards.find((account) => {
    const limit = account.balance.limit ?? 0;
    return limit > 0 && account.balance.current / limit >= 0.65;
  });

  if (errorAccounts.length > 0) {
    insights.push({
      id: 'sync-error',
      title: 'Some accounts need attention',
      body: `${errorAccounts.length} account${errorAccounts.length === 1 ? '' : 's'} failed the last sync. Refresh or reconnect before relying on balances.`,
      tone: 'danger',
      icon: 'alert-circle-outline',
    });
  }

  if (needsReauth.length > 0) {
    insights.push({
      id: 'reauth',
      title: 'Consent refresh required',
      body: `${needsReauth[0].institutionName} needs a quick re-auth before new transactions can import.`,
      tone: 'warning',
      icon: 'shield-refresh-outline',
    });
  }

  if (staleAccounts.length > 0) {
    insights.push({
      id: 'stale',
      title: 'Balances are getting stale',
      body: `${staleAccounts.length} account${staleAccounts.length === 1 ? '' : 's'} have not synced in over 36 hours.`,
      tone: 'warning',
      icon: 'clock-alert-outline',
    });
  }

  if (highUtilization) {
    insights.push({
      id: 'credit-utilization',
      title: 'Credit utilization is rising',
      body: `${highUtilization.displayName} is above 65% utilization. Paying it down can protect month-end flexibility.`,
      tone: 'warning',
      icon: 'credit-card-clock-outline',
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: 'healthy',
      title: 'Accounts are synced',
      body: 'Balances, consent state, and imported transactions look healthy across connected accounts.',
      tone: 'positive',
      icon: 'shield-check-outline',
    });
  }

  return insights.slice(0, 3);
};
