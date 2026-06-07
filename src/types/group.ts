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
}

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
  description: string;
  split_type: 'equal' | 'percentage' | 'custom';
  created_at: string;
  splits?: ExpenseSplit[];
  paid_by_name?: string;
}

export interface ExpenseSplit {
  id: string;
  group_expense_id: string;
  user_id: string;
  amount: number;
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
  from_user: string;
  to_user: string;
  amount: number;
  settled_at: string;
  group_id: string;
}
