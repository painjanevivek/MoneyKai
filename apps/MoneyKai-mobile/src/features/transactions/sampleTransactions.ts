import type { Transaction } from '@/types/transaction';

const dateDaysAgo = (days: number): string =>
  new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

export const buildSampleTransactions = (): Transaction[] => {
  const today = dateDaysAgo(0);
  const yesterday = dateDaysAgo(1);
  const twoDaysAgo = dateDaysAgo(2);
  const threeDaysAgo = dateDaysAgo(3);
  const fiveDaysAgo = dateDaysAgo(5);

  return [
    { id: '1', user_id: 'sample', type: 'expense', amount: 350, category: 'food', description: 'Zomato', payment_method: 'upi', transaction_date: today, created_at: today },
    { id: '2', user_id: 'sample', type: 'expense', amount: 120, category: 'transport', description: 'Metro Card Recharge', payment_method: 'upi', transaction_date: today, created_at: today },
    { id: '3', user_id: 'sample', type: 'expense', amount: 1250, category: 'shopping', description: 'Amazon', payment_method: 'card', transaction_date: yesterday, created_at: yesterday },
    { id: '4', user_id: 'sample', type: 'expense', amount: 480, category: 'entertainment', description: 'BookMyShow', payment_method: 'upi', transaction_date: twoDaysAgo, created_at: twoDaysAgo },
    { id: '5', user_id: 'sample', type: 'income', amount: 15000, category: 'income', description: 'Salary', payment_method: 'bank', transaction_date: fiveDaysAgo, created_at: fiveDaysAgo },
    { id: '6', user_id: 'sample', type: 'expense', amount: 2500, category: 'rent', description: 'Room Rent Share', payment_method: 'bank', transaction_date: fiveDaysAgo, created_at: fiveDaysAgo },
    { id: '7', user_id: 'sample', type: 'expense', amount: 650, category: 'food', description: 'Swiggy Groceries', payment_method: 'upi', transaction_date: threeDaysAgo, created_at: threeDaysAgo },
    { id: '8', user_id: 'sample', type: 'expense', amount: 200, category: 'transport', description: 'Uber', payment_method: 'upi', transaction_date: threeDaysAgo, created_at: threeDaysAgo },
    { id: '9', user_id: 'sample', type: 'expense', amount: 450, category: 'bills', description: 'Mobile Recharge', payment_method: 'upi', transaction_date: twoDaysAgo, created_at: twoDaysAgo },
    { id: '10', user_id: 'sample', type: 'expense', amount: 180, category: 'food', description: 'Cafe Coffee Day', payment_method: 'cash', transaction_date: yesterday, created_at: yesterday },
    { id: '11', user_id: 'sample', type: 'expense', amount: 800, category: 'education', description: 'Udemy Course', payment_method: 'card', transaction_date: threeDaysAgo, created_at: threeDaysAgo },
    { id: '12', user_id: 'sample', type: 'expense', amount: 320, category: 'healthcare', description: 'Pharmacy', payment_method: 'cash', transaction_date: yesterday, created_at: yesterday },
    { id: '13', user_id: 'sample', type: 'expense', amount: 900, category: 'food', description: 'Dominos Pizza', payment_method: 'upi', transaction_date: today, created_at: today },
    { id: '14', user_id: 'sample', type: 'expense', amount: 1050, category: 'shopping', description: 'Myntra', payment_method: 'card', transaction_date: twoDaysAgo, created_at: twoDaysAgo },
  ];
};
