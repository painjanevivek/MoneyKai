export type OperationType =
  | 'restore'
  | 'account_deletion'
  | 'financial_data_deletion'
  | 'document_import'
  | 'provider_sync';

export type OperationStatus =
  | 'requested'
  | 'validating'
  | 'ready'
  | 'applying'
  | 'verifying'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'retryable'
  | 'failed';

export interface OperationStep {
  sequence: number;
  name: string;
  status: OperationStatus;
  recordedAt: string;
  evidence: Record<string, unknown>;
}

export interface OperationRecord {
  operationId: string;
  operationType: OperationType;
  status: OperationStatus;
  version: number;
  idempotencyKeyHash: string;
  requestFingerprint: string;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
  steps: OperationStep[];
  verification: Record<string, unknown>;
  reasonCode?: string | null;
  recoveryAction?: string | null;
  terminal: boolean;
}

export interface DeletionManifest {
  schemaVersion: string;
  createdAt: string;
  databaseDocumentCount: number;
  collectionCounts: Record<string, number>;
  providerSecretCount: number;
  financialDocumentObjectCount: number;
  aiAttachmentObjectCount: number;
  coordinationRecordCount: number;
  operationRecordCount: number;
}

export interface DeletionCertificate {
  schemaVersion: string;
  operationId: string;
  verifiedAt: string;
  zeroResidue: boolean;
  manifest: DeletionManifest;
  verification: Record<string, unknown>;
}
