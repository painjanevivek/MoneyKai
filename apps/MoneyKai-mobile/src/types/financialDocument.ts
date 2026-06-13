export type FinancialDocumentSource = 'gmail' | 'manual_upload' | 'broker_api' | 'account_aggregator';

export type FinancialDocumentType =
  | 'bank_statement'
  | 'credit_card_statement'
  | 'contract_note'
  | 'cas'
  | 'portfolio_statement'
  | 'invoice'
  | 'salary_slip'
  | 'unknown';

export type FinancialDocumentStatus =
  | 'queued'
  | 'needs_password'
  | 'decrypting'
  | 'parsing'
  | 'parsed'
  | 'review_required'
  | 'imported'
  | 'ignored'
  | 'error';

export interface FinancialDocumentSummary {
  transactionCount: number;
  holdingCount: number;
  statementPeriodStart?: string;
  statementPeriodEnd?: string;
  totalDebits?: number;
  totalCredits?: number;
  closingBalance?: number;
}

export interface FinancialDocument {
  id: string;
  userId: string;
  source: FinancialDocumentSource;
  sourceMessageId?: string;
  filename: string;
  mimeType: string;
  providerKey?: string;
  documentType: FinancialDocumentType;
  status: FinancialDocumentStatus;
  passwordMode?: 'user_entered' | 'saved_pattern' | 'not_required';
  pageCount?: number;
  parsedSummary?: FinancialDocumentSummary;
  createdAt: string;
  parsedAt?: string;
}

export interface PdfPasswordProfile {
  id: string;
  userId: string;
  providerKey: string;
  label: string;
  mode: 'manual_saved' | 'pattern';
  encryptedPassword?: string;
  pattern?: 'pan_dob' | 'dob_pan' | 'name_dob' | 'custom_template';
  customTemplate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedStatementReview {
  id: string;
  documentId: string;
  status: 'pending_review' | 'approved' | 'ignored' | 'duplicate' | 'needs_provider_mapping' | 'error';
  rows: ParsedStatementRow[];
  createdAt: string;
}

export interface ParsedStatementRow {
  id: string;
  rowType: 'transaction' | 'holding' | 'summary';
  date?: string;
  description: string;
  amount?: number;
  balance?: number;
  quantity?: number;
  price?: number;
  confidence: number;
  sourceText: string;
}

export interface FinancialDocumentStatusSummary {
  enabled: boolean;
  queuedCount: number;
  needsPasswordCount: number;
  reviewRequiredCount: number;
  importedCount: number;
}

export interface QueueGmailAttachmentsRequest {
  gmailMessageId: string;
  attachmentDownloadAcceptedAt: string;
  allowedCategories: string[];
}

export interface QueueGmailAttachmentsResponse {
  queuedCount: number;
  ignoredCount: number;
  items: FinancialDocument[];
}

export interface PdfPasswordAttemptRequest {
  parsingConsentAcceptedAt: string;
  password: string;
  saveForProvider: boolean;
  profileLabel?: string;
}

export interface ParseFinancialDocumentRequest {
  parsingConsentAcceptedAt: string;
}

export interface ParsedStatementReviewResponse {
  document: FinancialDocument;
  review?: ParsedStatementReview | null;
}

export type PdfPasswordAttemptResponse = ParsedStatementReviewResponse;
