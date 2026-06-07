export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  type: 'note' | 'ledger' | 'checklist';
  checklist_items?: ChecklistItem[];
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface LedgerEntry {
  id: string;
  amount: number;
  description: string;
  type: 'credit' | 'debit';
  date: string;
}
