export interface Group {
  id: string;
  created_by: string;
  name: string;
  type: 'flatmates' | 'friends' | 'trip' | 'event';
  description: string;
  created_at: string;
  archived?: boolean;
  members?: GroupMember[];
  total_expenses?: number;
  mutation_id?: string;
  sync_status?: GroupSyncStatus;
  sync_error?: string;
  pending_action?: 'create' | 'archive' | 'restore' | 'members';
}

export type GroupSyncStatus = 'confirmed' | 'pending' | 'failed';

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user_name?: string;
  avatar_url?: string;
}

export interface GroupExpense {
  id: string;
  group_id: string;
  paid_by: string;
  amount: number;
  amount_paise?: number;
  description: string;
  split_type: 'equal';
  created_at: string;
  splits?: ExpenseSplit[];
  paid_by_name?: string;
  occurred_on?: string;
  mutation_id?: string;
  sync_status?: GroupSyncStatus;
  sync_error?: string;
  settlements?: Settlement[];
}

export interface ExpenseSplit {
  id: string;
  group_expense_id: string;
  user_id: string;
  amount: number;
  amount_paise?: number;
  percentage?: number;
  is_settled: boolean;
  settled_at?: string;
  user_name?: string;
}

export interface DebtEdge {
  from: string;
  to: string;
  amount: number;
  fromName?: string;
  toName?: string;
}

export interface Settlement {
  id: string;
  mutation_id: string;
  expense_id: string;
  split_id: string;
  from_user: string;
  from_user_name?: string;
  to_user: string;
  to_user_name?: string;
  amount: number;
  amount_paise: number;
  settled_at: string;
  group_id: string;
  kind: 'recorded' | 'reversal';
  reverses_settlement_id?: string;
  sync_status?: GroupSyncStatus;
  sync_error?: string;
}
