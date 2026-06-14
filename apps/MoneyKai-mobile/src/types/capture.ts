import type { TransactionType } from './transaction';
import type { SmsImportRangeId } from './smsImport';

export type CaptureSource = 'notification' | 'sms' | 'aa' | 'manual';

export type CaptureProcessingStatus =
  | 'new'
  | 'parsed'
  | 'drafted'
  | 'confirmed'
  | 'ignored'
  | 'duplicate';

export type DraftTransactionStatus = 'pending' | 'confirmed' | 'ignored';

export type CaptureParseStatus = 'draft' | 'ignore' | 'review';

export type CaptureSourceStatus = 'enabled' | 'disabled' | 'needs_android_access' | 'research_only' | 'unsupported';

export type CapturePermissionState = 'unknown' | 'unsupported' | 'not_requested' | 'granted' | 'denied';

export type MonitoredAccountStatus = 'pending' | 'approved' | 'declined' | 'paused';

export interface CaptureParseExplanation {
  matchedAmount?: string;
  matchedAmountPattern?: string;
  matchedDirectionTerms: string[];
  matchedTransactionDate?: string;
  matchedTransactionDatePattern?: string;
  matchedMerchantPattern?: string;
  matchedPaymentMethod?: string;
  matchedCategoryRule?: string;
  confidenceFactors: string[];
  ignoreReason?: string;
  safeSnippet: string;
  dedupeReference?: string;
}

export interface CaptureSignalInput {
  source: Exclude<CaptureSource, 'manual'>;
  title?: string;
  body: string;
  sender?: string;
  sourceApp?: string;
  receivedAt?: string;
  rawPayload?: Record<string, unknown>;
}

export interface SmsDiscoverySample {
  receivedAt?: string;
  sender?: string;
  redactedBody: string;
  localMessageId?: string;
}

export interface MonitoredAccount {
  id: string;
  source: 'sms';
  bankKey: string;
  bankLabel: string;
  accountHint?: string;
  sender?: string;
  status: MonitoredAccountStatus;
  sampleCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  approvedAt?: string;
  declinedAt?: string;
  pausedAt?: string;
  resumedAt?: string;
  discoverySample?: SmsDiscoverySample;
}

export interface CapturedSignal {
  id: string;
  source: Exclude<CaptureSource, 'manual'>;
  title?: string;
  body: string;
  sender?: string;
  sourceApp?: string;
  receivedAt: string;
  createdAt: string;
  dedupeKey: string;
  canonicalTransactionKey?: string;
  sourceFingerprint?: string;
  captureAccountId?: string;
  processingStatus: CaptureProcessingStatus;
  parsedAmount?: number;
  parsedType?: TransactionType;
  parsedMerchant?: string;
  parsedPaymentMethod?: string;
  parseStatus?: CaptureParseStatus;
  parseReason?: string;
  parseExplanation?: CaptureParseExplanation;
  ignoreReason?: string;
  confidence: number;
  rawPayload?: Record<string, unknown>;
}

export interface DraftTransaction {
  id: string;
  signalId: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category?: string;
  description: string;
  merchantKey?: string;
  canonicalTransactionKey?: string;
  sourceFingerprint?: string;
  payment_method: string;
  captureAccountId?: string;
  captureAccountLabel?: string;
  captureBankLabel?: string;
  captureAccountHint?: string;
  transaction_date: string;
  confidence: number;
  captureSource: Exclude<CaptureSource, 'manual'>;
  sourceApp?: string;
  parseReason?: string;
  parseExplanation?: CaptureParseExplanation;
  reviewRequired?: boolean;
  suggestedCategory?: string;
  status: DraftTransactionStatus;
  createdAt: string;
  confirmedAt?: string;
}

export interface MerchantCategoryRule {
  id: string;
  merchantKey: string;
  merchantLabel: string;
  category: string;
  payment_method?: string;
  source: 'manual' | 'heuristic';
  confidence: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export interface CaptureParseResult {
  amount?: number;
  type?: TransactionType;
  merchantLabel?: string;
  merchantKey?: string;
  category?: string;
  paymentMethod?: string;
  transactionDate?: string;
  parseStatus: CaptureParseStatus;
  ignoreReason?: string;
  transactionReference?: string;
  explanation: CaptureParseExplanation;
  confidence: number;
  reason: string;
}

export interface CaptureSettings {
  autoCaptureEnabled: boolean;
  notificationCaptureEnabled: boolean;
  reviewNotificationsEnabled: boolean;
  smsResearchModeEnabled: boolean;
  aiSmsAssistEnabled: boolean;
  notificationExplainerAcceptedAt?: string;
  smsResearchExplainerAcceptedAt?: string;
  notificationAccessStatus: CapturePermissionState;
  notificationAccessLastCheckedAt?: string;
  smsAccessStatus: CapturePermissionState;
  smsAccessLastCheckedAt?: string;
  smsImportRangeId?: SmsImportRangeId;
}

export interface CaptureIngestionResult {
  signalId?: string;
  draftId?: string;
  status: CaptureProcessingStatus;
  reason: string;
}

export type AiSmsParseStatus = 'transaction' | 'ignore' | 'unsure';

export type AiSmsParseType = 'expense' | 'income' | 'transfer' | 'refund' | 'reversal' | 'unknown';

export interface AiSmsParseInput {
  sender?: string;
  receivedAt: string;
  body: string;
  locale: 'en-IN';
  currency: 'INR';
}

export interface AiSmsParseCandidate {
  status: AiSmsParseStatus;
  type: AiSmsParseType;
  amount?: number;
  currency: 'INR';
  merchantOrCounterparty?: string;
  paymentMethod?: string;
  instrument?: 'upi' | 'debit_card' | 'credit_card' | 'bank_transfer' | 'cheque' | 'wallet' | 'cash' | 'unknown';
  bankRail?: 'imps' | 'neft' | 'rtgs' | 'upi' | 'card' | 'cheque' | 'wallet' | 'unknown';
  cardDirection?: 'debit' | 'credit' | 'unknown';
  bankName?: string;
  categorySuggestion?: string;
  transactionReferencePresent: boolean;
  confidence: number;
  reason: string;
}

export interface AiSmsValidationResult {
  accepted: boolean;
  reviewRequired: true;
  reasons: string[];
}
