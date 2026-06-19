import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  type DocumentData,
} from 'firebase/firestore';
import { firebaseDb, isFirebaseConfigured } from './firebase';
import type { Transaction } from '../types/transaction';
import type { Note } from '../types/note';
import type { Group, GroupExpense } from '../types/group';
import type { Challenge } from '../types/challenge';
import type { Badge } from '../types/badge';
import { DEFAULT_THEME_PALETTE, getThemeModeForPalette, type ThemeMode, type ThemePaletteId } from '../constants/theme';
import type { DashboardTrendChartType, DashboardTrendMetric, DashboardTrendRange } from '@/stores/useSettingsStore';
import type { LinkedAccount } from '@moneykai/domain';

type AppSettingsDoc = {
  theme: ThemeMode;
  themePalette: ThemePaletteId;
  darkModeEnabled: boolean;
  dashboardTrendRange: DashboardTrendRange;
  dashboardTrendMetric: DashboardTrendMetric;
  dashboardTrendChartType: DashboardTrendChartType;
  currency: string;
  currencySymbol: string;
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  tourCompleted: boolean;
};

type BudgetSettingsDoc = {
  settings: {
    monthly_allowance: number;
    reset_day: number;
    auto_reset: boolean;
    carry_forward: boolean;
    currency: string;
  };
  adjustments: { amount: number; type: 'add' | 'subtract'; reason: string; date: string }[];
  isEmergencyMode: boolean;
  resetHistory: { date: string; amount: number; carryForward: number }[];
};

export type FirestoreUserSnapshot = {
  profile: { id: string; email: string; full_name: string; avatar_url?: string; auth_provider?: string };
  settings: {
    app: AppSettingsDoc;
    budget: BudgetSettingsDoc;
  };
  data: {
    transactions: Transaction[];
    notes: Note[];
    groups: Group[];
    groupExpenses: GroupExpense[];
    challenges: Challenge[];
    savings: Challenge[];
    badges: Badge[];
    notifications: DocumentData[];
    linkedAccounts: LinkedAccount[];
  };
};

const DEFAULT_APP_SETTINGS: AppSettingsDoc = {
  theme: getThemeModeForPalette(DEFAULT_THEME_PALETTE, false),
  themePalette: DEFAULT_THEME_PALETTE,
  darkModeEnabled: false,
  dashboardTrendRange: '1m',
  dashboardTrendMetric: 'spending',
  dashboardTrendChartType: 'line',
  currency: 'INR',
  currencySymbol: '₹',
  notificationsEnabled: true,
  hapticEnabled: true,
  tourCompleted: false,
};

const DEFAULT_BUDGET_SETTINGS: BudgetSettingsDoc = {
  settings: {
    monthly_allowance: 0,
    reset_day: 1,
    auto_reset: true,
    carry_forward: false,
    currency: 'INR',
  },
  adjustments: [],
  isEmergencyMode: false,
  resetHistory: [],
};

const ensure = () => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured.');
  }
  return firebaseDb;
};

const normalize = <T,>(docs: { id: string; data: () => DocumentData }[]): T[] =>
  docs.map((item) => ({ id: item.id, ...item.data() })) as T[];

export const loadUserFirestoreSnapshot = async (uid: string, profile: FirestoreUserSnapshot['profile']): Promise<FirestoreUserSnapshot> => {
  const db = ensure();

  const [transactionsSnap, notesSnap, groupsSnap, badgesSnap, notificationsSnap, savingsSnap, linkedAccountsSnap, appSettingsSnap, budgetSnap] =
    await Promise.all([
      getDocs(collection(db, 'users', uid, 'transactions')),
      getDocs(collection(db, 'users', uid, 'notes')),
      getDocs(collection(db, 'users', uid, 'groups')),
      getDocs(collection(db, 'users', uid, 'badges')),
      getDocs(collection(db, 'users', uid, 'notifications')),
      getDocs(collection(db, 'users', uid, 'savings')),
      getDocs(collection(db, 'users', uid, 'linkedAccounts')),
      getDoc(doc(db, 'users', uid, 'settings', 'app')),
      getDoc(doc(db, 'users', uid, 'budgets', 'current')),
    ]);

  const groupDocs = normalize<Group>(groupsSnap.docs);
  const groupExpenses = (
    await Promise.all(
      groupDocs.map(async (group) => {
        const expensesSnap = await getDocs(collection(db, 'users', uid, 'groups', group.id, 'expenses'));
        return normalize<GroupExpense>(expensesSnap.docs);
      })
    )
  ).flat();

  return {
    profile,
    settings: {
      app: appSettingsSnap.exists() ? ({ ...DEFAULT_APP_SETTINGS, ...(appSettingsSnap.data() as Partial<AppSettingsDoc>) } as AppSettingsDoc) : DEFAULT_APP_SETTINGS,
      budget: budgetSnap.exists() ? ({ ...DEFAULT_BUDGET_SETTINGS, ...(budgetSnap.data() as Partial<BudgetSettingsDoc>) } as BudgetSettingsDoc) : DEFAULT_BUDGET_SETTINGS,
    },
    data: {
      transactions: normalize<Transaction>(transactionsSnap.docs),
      notes: normalize<Note>(notesSnap.docs),
      groups: groupDocs,
      groupExpenses,
      challenges: normalize<Challenge>(savingsSnap.docs),
      savings: normalize<Challenge>(savingsSnap.docs),
      badges: normalize<Badge>(badgesSnap.docs),
      notifications: notificationsSnap.docs.map((item) => ({ id: item.id, ...item.data() })),
      linkedAccounts: normalize<LinkedAccount>(linkedAccountsSnap.docs),
    },
  };
};

export const saveUserAppSettings = async (uid: string, data: Partial<AppSettingsDoc>) => {
  const db = ensure();
  await setDoc(doc(db, 'users', uid, 'settings', 'app'), data, { merge: true });
};

export const saveUserBudgetSettings = async (uid: string, data: Partial<BudgetSettingsDoc>) => {
  const db = ensure();
  await setDoc(doc(db, 'users', uid, 'budgets', 'current'), data, { merge: true });
};

export const upsertUserDoc = async <T extends { id: string }>(collectionName: string, uid: string, value: T) => {
  const db = ensure();
  await setDoc(doc(db, 'users', uid, collectionName, value.id), value, { merge: true });
};

export const deleteUserDoc = async (collectionName: string, uid: string, id: string) => {
  const db = ensure();
  await deleteDoc(doc(db, 'users', uid, collectionName, id));
};

export const upsertUserGroup = async <T extends Group>(uid: string, value: T) => {
  const db = ensure();
  await setDoc(doc(db, 'users', uid, 'groups', value.id), value, { merge: true });
};

export const deleteUserGroup = async (uid: string, id: string) => {
  const db = ensure();
  const groupRef = doc(db, 'users', uid, 'groups', id);
  const expenses = await getDocs(collection(db, 'users', uid, 'groups', id, 'expenses'));
  await Promise.all(expenses.docs.map((expense) => deleteDoc(expense.ref)));
  await deleteDoc(groupRef);
};

export const upsertUserGroupExpense = async <T extends GroupExpense>(uid: string, groupId: string, value: T) => {
  const db = ensure();
  await setDoc(doc(db, 'users', uid, 'groups', groupId, 'expenses', value.id), value, { merge: true });
};

export const deleteUserGroupExpense = async (uid: string, groupId: string, expenseId: string) => {
  const db = ensure();
  await deleteDoc(doc(db, 'users', uid, 'groups', groupId, 'expenses', expenseId));
};
