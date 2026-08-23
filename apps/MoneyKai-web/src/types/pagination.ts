export type PageInfo = {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
  documentReads: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: PageInfo;
};

export type BootstrapResource =
  | 'transactions'
  | 'notes'
  | 'groups'
  | 'groupExpenses'
  | 'savings'
  | 'badges'
  | 'notifications'
  | 'linkedAccounts';

export type SyncResource =
  | 'transactions'
  | 'notes'
  | 'savings'
  | 'badges'
  | 'notifications'
  | 'linkedAccounts'
  | 'groups'
  | 'groupExpenses'
  | 'recurringObligations'
  | 'appSettings'
  | 'budgetSettings'
  | 'workspace';

export type IncrementalSyncEvent = {
  id: string;
  resource: SyncResource;
  action: 'upserted' | 'deleted' | 'reset';
  itemId: string;
  occurredAt: string;
  payload: Record<string, unknown> | null;
};

export type IncrementalSyncResponse = {
  events: IncrementalSyncEvent[];
  page: PageInfo;
  resetRequired: boolean;
  reason: string | null;
  windowEnd: string | null;
  nextSyncToken: string | null;
};
