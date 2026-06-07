import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Enter a valid amount'),
  category: z.string().min(1, 'Please select a category'),
  description: z.string().min(1, 'Please add a description'),
  payment_method: z.string().min(1, 'Select a payment method'),
  transaction_date: z.date(),
});

export const budgetAdjustmentSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Enter a valid amount'),
  type: z.enum(['add', 'subtract']),
  reason: z.string().optional(),
});

export const groupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters'),
  type: z.enum(['flatmates', 'friends', 'trip', 'event']),
  description: z.string().optional(),
});

export const noteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
  type: z.enum(['note', 'ledger', 'checklist']),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type TransactionFormData = z.infer<typeof transactionSchema>;
export type BudgetAdjustmentFormData = z.infer<typeof budgetAdjustmentSchema>;
export type GroupFormData = z.infer<typeof groupSchema>;
export type NoteFormData = z.infer<typeof noteSchema>;
