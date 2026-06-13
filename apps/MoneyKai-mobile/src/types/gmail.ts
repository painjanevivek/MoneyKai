export type FinancialEmailCategory =
  | 'bank_statement'
  | 'credit_card_statement'
  | 'broker_contract_note'
  | 'mutual_fund_statement'
  | 'insurance'
  | 'loan'
  | 'tax'
  | 'salary'
  | 'receipt'
  | 'subscription'
  | 'unknown';

export interface GmailConnection {
  id: string;
  userId: string;
  email: string;
  status: 'connected' | 'revoked' | 'error' | 'needs_reauth';
  scopes: string[];
  connectedAt: string;
  lastSyncAt?: string;
  lastHistoryId?: string;
  syncMode: 'manual' | 'scheduled' | 'watch';
  allowedCategories: FinancialEmailCategory[];
}

export interface FinancialEmailRecord {
  id: string;
  userId: string;
  gmailConnectionId: string;
  gmailMessageId: string;
  threadId?: string;
  sender: string;
  subject: string;
  receivedAt: string;
  category: FinancialEmailCategory;
  providerKey?: string;
  hasAttachments: boolean;
  attachmentCount: number;
  parseStatus: 'new' | 'classified' | 'parsed' | 'needs_password' | 'ignored' | 'error';
  classificationConfidence?: number;
  classificationReason?: string;
  safeSnippet?: string;
  createdAt: string;
}

export interface GmailSyncConsent {
  metadataScanAcceptedAt?: string;
  attachmentDownloadAcceptedAt?: string;
  allowedCategories: FinancialEmailCategory[];
  syncWindow: '15d' | '30d' | '90d' | '180d' | '365d';
}

export interface GmailSyncStatus {
  enabled: boolean;
  connection?: GmailConnection | null;
  financialEmailCount: number;
  parsedAttachmentCount: number;
  needsPasswordCount: number;
  importedItemCount: number;
  lastSyncError?: string;
}

export interface GmailSyncSummary {
  scannedMessageCount: number;
  financialEmailCount: number;
  ignoredEmailCount: number;
  needsReviewCount: number;
  query: string;
  items: FinancialEmailRecord[];
}

export interface GmailConnectStartResponse {
  authorizationUrl: string;
  state: string;
  expiresAt: string;
}

export interface GmailSyncRequest {
  metadataScanAcceptedAt: string;
  allowedCategories: FinancialEmailCategory[];
  syncWindow: GmailSyncConsent['syncWindow'];
  maxResults?: number;
}

export interface FinancialEmailListResponse {
  items: FinancialEmailRecord[];
}
