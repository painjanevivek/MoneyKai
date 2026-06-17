import type { GmailSyncRequest } from '@/types/gmail';

export type FinancialFeatureKey = 'manual_portfolio' | 'gmail_sync' | 'financial_documents' | 'financial_ai';

export type FinancialFeatureReadiness = 'placeholder' | 'contract_ready' | 'backend_required' | 'provider_required';

export interface FinancialFeatureContract {
  key: FinancialFeatureKey;
  title: string;
  readiness: FinancialFeatureReadiness;
  featureFlag: string;
  requiresSignedInUser: boolean;
  requiresUserConsent: boolean;
  reviewRequiredBeforeImport: boolean;
  sourceOfTruth: 'backend';
  mobileSurface: string[];
  webSurface: string[];
  backendCapabilities: string[];
  manualIntervention: string[];
}

export const financialFeatureContracts: Record<FinancialFeatureKey, FinancialFeatureContract> = {
  manual_portfolio: {
    key: 'manual_portfolio',
    title: 'Manual portfolio and wealth tracking',
    readiness: 'contract_ready',
    featureFlag: 'EXPO_PUBLIC_WEALTH_TAB_ENABLED',
    requiresSignedInUser: true,
    requiresUserConsent: false,
    reviewRequiredBeforeImport: false,
    sourceOfTruth: 'backend',
    mobileSurface: ['/(tabs)/portfolio', '/(tabs)/wealth'],
    webSurface: ['/(tabs)/portfolio', '/(tabs)/wealth'],
    backendCapabilities: [
      'Persist manual holdings',
      'Maintain provider connection metadata',
      'Build portfolio state snapshots',
      'Import reviewed document holdings',
    ],
    manualIntervention: ['User enters holding details and confirms edits or deletes'],
  },
  gmail_sync: {
    key: 'gmail_sync',
    title: 'Gmail financial metadata sync',
    readiness: 'backend_required',
    featureFlag: 'EXPO_PUBLIC_GMAIL_SYNC_ENABLED',
    requiresSignedInUser: true,
    requiresUserConsent: true,
    reviewRequiredBeforeImport: true,
    sourceOfTruth: 'backend',
    mobileSurface: ['More', 'Settings'],
    webSurface: ['Settings'],
    backendCapabilities: [
      'Start Google OAuth',
      'Store encrypted refresh tokens',
      'Scan metadata inside consent window',
      'Classify financial emails',
      'Queue attachments only after attachment consent',
    ],
    manualIntervention: ['User completes Google consent', 'User approves attachment download/import'],
  },
  financial_documents: {
    key: 'financial_documents',
    title: 'Financial document parsing',
    readiness: 'backend_required',
    featureFlag: 'EXPO_PUBLIC_PDF_STATEMENT_PARSING_ENABLED',
    requiresSignedInUser: true,
    requiresUserConsent: true,
    reviewRequiredBeforeImport: true,
    sourceOfTruth: 'backend',
    mobileSurface: ['FinancialDocumentReviewCard', 'PDF password prompt', 'Parsed statement review'],
    webSurface: ['Gmail attachment queue', 'future document upload'],
    backendCapabilities: [
      'Queue Gmail attachments',
      'Extract PDF text',
      'Handle password retry',
      'Create parsed statement review rows',
      'Import approved transactions and holdings',
    ],
    manualIntervention: ['User enters PDF password when required', 'User approves parsed review rows'],
  },
  financial_ai: {
    key: 'financial_ai',
    title: 'Financial AI review helpers',
    readiness: 'backend_required',
    featureFlag: 'EXPO_PUBLIC_FINANCIAL_AI_ENABLED',
    requiresSignedInUser: true,
    requiresUserConsent: true,
    reviewRequiredBeforeImport: true,
    sourceOfTruth: 'backend',
    mobileSurface: ['AI review', 'wealth insights', 'document summary'],
    webSurface: ['AI review', 'wealth insights', 'document summary'],
    backendCapabilities: [
      'Classify financial emails',
      'Normalize statement rows',
      'Generate wealth insights',
      'Return review-required suggestions only',
    ],
    manualIntervention: ['User reviews AI suggestions before any import or mutation'],
  },
};

export const financialFeatureEndpoints = {
  gmail: {
    status: '/v1/gmail/status',
    connectStart: (metadataScanAcceptedAt: string, returnTo?: string) => {
      const params = [`metadataScanAcceptedAt=${encodeURIComponent(metadataScanAcceptedAt)}`];
      if (returnTo) {
        params.push(`returnTo=${encodeURIComponent(returnTo)}`);
      }
      return `/v1/gmail/connect/start?${params.join('&')}`;
    },
    disconnect: '/v1/gmail/disconnect',
    sync: '/v1/gmail/sync',
    emails: (parseStatus?: string) =>
      parseStatus ? `/v1/gmail/emails?parseStatus=${encodeURIComponent(parseStatus)}` : '/v1/gmail/emails',
  },
  financialDocuments: {
    status: '/v1/financial-documents/status',
    list: (status?: string) =>
      status ? `/v1/financial-documents?status=${encodeURIComponent(status)}` : '/v1/financial-documents',
    queueGmailAttachments: '/v1/financial-documents/queue-gmail-attachments',
    parse: (documentId: string) => `/v1/financial-documents/${encodeURIComponent(documentId)}/parse`,
    aiSummary: (documentId: string) => `/v1/financial-documents/${encodeURIComponent(documentId)}/ai-summary`,
    password: (documentId: string) => `/v1/financial-documents/${encodeURIComponent(documentId)}/password`,
    review: (documentId: string) => `/v1/financial-documents/${encodeURIComponent(documentId)}/review`,
    approveReview: (documentId: string) => `/v1/financial-documents/${encodeURIComponent(documentId)}/review/approve`,
    ignoreReview: (documentId: string) => `/v1/financial-documents/${encodeURIComponent(documentId)}/review/ignore`,
    importReview: (documentId: string) => `/v1/financial-documents/${encodeURIComponent(documentId)}/review/import`,
    passwordProfiles: '/v1/financial-documents/password-profiles',
    passwordProfile: (profileId: string) => `/v1/financial-documents/password-profiles/${encodeURIComponent(profileId)}`,
  },
  portfolio: {
    connections: '/v1/portfolio/connections',
    state: '/v1/portfolio/state',
    connection: (accountId: string) => `/v1/portfolio/connections/${encodeURIComponent(accountId)}`,
    pauseConnection: (accountId: string) => `/v1/portfolio/connections/${encodeURIComponent(accountId)}/pause`,
    disconnectConnection: (accountId: string) => `/v1/portfolio/connections/${encodeURIComponent(accountId)}/disconnect`,
    syncConnection: (accountId: string) => `/v1/portfolio/connections/${encodeURIComponent(accountId)}/sync`,
    holdings: '/v1/portfolio/holdings',
    holding: (holdingId: string) => `/v1/portfolio/holdings/${encodeURIComponent(holdingId)}`,
    snapshots: '/v1/portfolio/snapshots',
    importParsedDocumentHoldings: (documentId: string) =>
      `/v1/portfolio/imports/parsed-document/${encodeURIComponent(documentId)}`,
    zerodhaStart: '/v1/portfolio/providers/zerodha/start',
    zerodhaCallback: '/v1/portfolio/providers/zerodha/callback',
    accountAggregatorExploration: '/v1/portfolio/providers/account-aggregator/exploration',
  },
  financialAi: {
    emailClassification: '/v1/financial-ai/email-classification',
    statementRows: '/v1/financial-ai/statement-rows',
    wealthInsights: '/v1/financial-ai/wealth-insights',
  },
} as const;

export const defaultGmailSyncRequest: Pick<GmailSyncRequest, 'allowedCategories' | 'syncWindow' | 'maxResults'> = {
  allowedCategories: ['bank_statement', 'credit_card_statement', 'broker_contract_note', 'mutual_fund_statement'],
  syncWindow: '30d',
  maxResults: 50,
};
