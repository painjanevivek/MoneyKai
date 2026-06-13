export type SecurityChecklistStatus = 'ready' | 'needs_config' | 'manual_review';

export interface SecurityChecklistItem {
  key: string;
  label: string;
  status: SecurityChecklistStatus;
  detail: string;
}

export interface SecurityHardeningStatus {
  environment: string;
  rawDocumentRetentionDays: number;
  auditRetentionDays: number;
  checklist: SecurityChecklistItem[];
}

export interface DeleteFinancialDataRequest {
  confirm: 'DELETE_FINANCIAL_DATA';
}

export interface DeleteFinancialDataResponse {
  deleted: boolean;
  collectionsCleared: string[];
}

export interface AuditEvent {
  id: string;
  userId: string;
  eventType: string;
  source: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
