import type { TransactionType } from './transaction';

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

export interface CaptureParseExplanation {
  matchedAmount?: string;
  matchedAmountPattern?: string;
  matchedDirectionTerms: string[];
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
  payment_method: string;
  transaction_date: string;
  confidence: number;
  captureSource: Exclude<CaptureSource, 'manual'>;
  sourceApp?: string;
  parseReason?: string;
  parseExplanation?: CaptureParseExplanation;
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
}

export interface CaptureIngestionResult {
  signalId?: string;
  draftId?: string;
  status: CaptureProcessingStatus;
  reason: string;
}
