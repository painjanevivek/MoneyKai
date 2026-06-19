import type { LinkedAccount } from '@moneykai/domain';
import type { Transaction } from './transaction';

export type LinkedAccountProviderMode =
  | 'account_aggregator'
  | 'plaid'
  | 'teller'
  | 'finicity'
  | 'none';

export interface LinkedAccountProviderStatus {
  enabled: boolean;
  provider: LinkedAccountProviderMode;
  productionReady: boolean;
  sandboxEnabled: boolean;
  message: string;
  checklist: string[];
  manualSetupRequired: string[];
}

export interface LinkedAccountConnectStartResponse {
  enabled: boolean;
  provider: LinkedAccountProviderMode;
  authorizationUrl: string | null;
  state: string | null;
  expiresAt: string | null;
  message: string;
  checklist: string[];
  manualSetupRequired: string[];
}

export interface LinkedAccountSyncResponse {
  accounts: LinkedAccount[];
  transactions: Transaction[];
  syncedAt: string;
  message: string;
}
