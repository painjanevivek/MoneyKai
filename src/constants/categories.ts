export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  colorLight: string;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: 'silverware-fork-knife', color: '#111111', colorLight: '#F4F4F4' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping-outline', color: '#2B2B2B', colorLight: '#F2F2F2' },
  { id: 'transport', name: 'Transport', icon: 'bus', color: '#444444', colorLight: '#ECECEC' },
  { id: 'rent', name: 'Rent / Housing', icon: 'home-outline', color: '#5A5A5A', colorLight: '#E8E8E8' },
  { id: 'education', name: 'Education', icon: 'book-open-variant', color: '#707070', colorLight: '#F0F0F0' },
  { id: 'entertainment', name: 'Entertainment', icon: 'gamepad-variant-outline', color: '#8A8A8A', colorLight: '#EFEFEF' },
  { id: 'bills', name: 'Bills & Utilities', icon: 'receipt', color: '#A3A3A3', colorLight: '#F2F2F2' },
  { id: 'healthcare', name: 'Healthcare', icon: 'hospital-box-outline', color: '#BDBDBD', colorLight: '#F6F6F6' },
  { id: 'others', name: 'Others', icon: 'dots-horizontal-circle-outline', color: '#6B7280', colorLight: '#F3F3F3' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'allowance', name: 'Salary / Allowance', icon: 'cash-multiple', color: '#111111', colorLight: '#F4F4F4' },
  { id: 'freelance', name: 'Freelance', icon: 'laptop', color: '#2B2B2B', colorLight: '#F2F2F2' },
  { id: 'bonus', name: 'Bonus', icon: 'gift-outline', color: '#444444', colorLight: '#ECECEC' },
  { id: 'refund', name: 'Refund', icon: 'cash-refund', color: '#5A5A5A', colorLight: '#E8E8E8' },
  { id: 'other_income', name: 'Other Income', icon: 'plus-circle-outline', color: '#6B7280', colorLight: '#F3F3F3' },
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
