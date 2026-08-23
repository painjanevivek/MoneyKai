export type CapabilityState =
  | 'available'
  | 'disabled'
  | 'setup_required'
  | 'consent_required'
  | 'degraded'
  | 'unavailable';

export type CapabilityKey =
  | 'core_finance'
  | 'portfolio'
  | 'zerodha_sync'
  | 'gmail_metadata'
  | 'financial_documents'
  | 'ai_guidance'
  | 'ai_attachments';

export interface CapabilityStatus {
  key: CapabilityKey;
  state: CapabilityState;
  reasonCode: string;
  message: string;
  retryable: boolean;
  dependencies: string[];
}
export interface CapabilityStatusResponse {
  schemaVersion: string;
  generatedAt: string;
  capabilities: CapabilityStatus[];
}
