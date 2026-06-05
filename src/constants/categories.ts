export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  colorLight: string;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: 'silverware-fork-knife', color: '#0D8C4C', colorLight: '#E8F5EE' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-outline', color: '#8B5CF6', colorLight: '#F3EFFE' },
  { id: 'transport', name: 'Transport', icon: 'bus', color: '#3B82F6', colorLight: '#EBF4FF' },
  { id: 'rent', name: 'Rent / Housing', icon: 'home-outline', color: '#F59E0B', colorLight: '#FEF9E7' },
  { id: 'education', name: 'Education', icon: 'book-open-variant', color: '#14B8A6', colorLight: '#E8FAF6' },
  { id: 'entertainment', name: 'Entertainment', icon: 'gamepad-variant-outline', color: '#EC4899', colorLight: '#FEF0F7' },
  { id: 'bills', name: 'Bills & Utilities', icon: 'receipt', color: '#6366F1', colorLight: '#EEEFFD' },
  { id: 'healthcare', name: 'Healthcare', icon: 'hospital-box-outline', color: '#EF4444', colorLight: '#FEF0F0' },
  { id: 'others', name: 'Others', icon: 'dots-horizontal-circle-outline', color: '#6B7280', colorLight: '#F3F4F6' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'allowance', name: 'Salary / Allowance', icon: 'cash-multiple', color: '#0D8C4C', colorLight: '#E8F5EE' },
  { id: 'freelance', name: 'Freelance', icon: 'laptop', color: '#3B82F6', colorLight: '#EBF4FF' },
  { id: 'bonus', name: 'Bonus', icon: 'gift-outline', color: '#F4A261', colorLight: '#FEF3E2' },
  { id: 'refund', name: 'Refund', icon: 'cash-refund', color: '#14B8A6', colorLight: '#E8FAF6' },
  { id: 'other_income', name: 'Other Income', icon: 'plus-circle-outline', color: '#6B7280', colorLight: '#F3F4F6' },
];

export const PAYMENT_METHODS = [
  { id: 'upi', name: 'UPI', icon: 'cellphone' },
  { id: 'cash', name: 'Cash', icon: 'cash' },
  { id: 'card', name: 'Card', icon: 'credit-card-outline' },
  { id: 'bank', name: 'Bank Transfer', icon: 'bank-outline' },
  { id: 'wallet', name: 'Wallet', icon: 'wallet-outline' },
] as const;

export const getCategoryById = (id: string): Category | undefined => {
  return [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].find(c => c.id === id);
};

export const getCategoryColor = (id: string): string => {
  return getCategoryById(id)?.color ?? '#6B7280';
};

export const getCategoryIcon = (id: string): string => {
  return getCategoryById(id)?.icon ?? 'help-circle-outline';
};
