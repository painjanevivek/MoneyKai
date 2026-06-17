import firestore, { type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { isFirebaseConfigured, requireFirebaseConfigured } from '@/firebase/firebaseConfig';
import type { Transaction } from '@/types/transaction';
import type { Note } from '@/types/note';
import type { Group, GroupExpense } from '@/types/group';
import type { Challenge } from '@/types/challenge';
import type { Badge } from '@/types/badge';
import type { ThemeMode } from '@/constants/theme';
import type { LinkedAccount } from '@moneykai/domain';
import { retryAsync } from './networkClient';
import { useSyncStore } from '@/stores/useSyncStore';

type FirestoreDocumentData = FirebaseFirestoreTypes.DocumentData;

type AppSettingsDoc = {
  theme: ThemeMode;
  currency: string;
  currencySymbol: string;
  notificationsEnabled: boolean;
  hapticEnabled: boolean;
  tourCompleted: boolean;
  appLockEnabled: boolean;
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
    notifications: FirestoreDocumentData[];
    linkedAccounts: LinkedAccount[];
  };
};

export type FirestoreBackupRecord<TSnapshot> = {
  backup_name: string;
  snapshot: TSnapshot;
  createdAt?: FirebaseFirestoreTypes.FieldValue;
  createdAtMs: number;
};

const DEFAULT_APP_SETTINGS: AppSettingsDoc = {
  theme: 'light',
  currency: 'INR',
  currencySymbol: '\u20b9',
  notificationsEnabled: true,
  hapticEnabled: true,
  tourCompleted: false,
  appLockEnabled: false,
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

const db = () => {
  requireFirebaseConfigured();
  return firestore();
};

const normalize = <T,>(docs: FirebaseFirestoreTypes.QueryDocumentSnapshot[]): T[] =>
  docs.map((item) => ({ id: item.id, ...item.data() })) as T[];

const userCollection = (uid: string, collectionName: string) =>
  db().collection('users').doc(uid).collection(collectionName);

export { isFirebaseConfigured };

const runFirestoreMutation = async <T,>(task: () => Promise<T>): Promise<T> => {
  useSyncStore.getState().startSync();
  try {
    const result = await retryAsync(task, { retries: 2, baseDelayMs: 450 });
    useSyncStore.getState().finishSync();
    return result;
  } catch (error) {
    useSyncStore.getState().failSync(
      error instanceof Error ? error.message : 'Cloud sync failed. Your local changes are still on this device.',
    );
    throw error;
  }
};

export const loadUserFirestoreSnapshot = async (
  uid: string,
  profile: FirestoreUserSnapshot['profile']
): Promise<FirestoreUserSnapshot> => {
  const database = db();
  const userDoc = database.collection('users').doc(uid);

  const [
    transactionsSnap,
    notesSnap,
    groupsSnap,
    badgesSnap,
    notificationsSnap,
    savingsSnap,
    linkedAccountsSnap,
    appSettingsSnap,
    budgetSnap,
  ] = await Promise.all([
    userDoc.collection('transactions').get(),
    userDoc.collection('notes').get(),
    userDoc.collection('groups').get(),
    userDoc.collection('badges').get(),
    userDoc.collection('notifications').get(),
    userDoc.collection('savings').get(),
    userDoc.collection('linkedAccounts').get(),
    userDoc.collection('settings').doc('app').get(),
    userDoc.collection('budgets').doc('current').get(),
  ]);

  const groupDocs = normalize<Group>(groupsSnap.docs);
  const groupExpenses = (
    await Promise.all(
      groupDocs.map(async (group) => {
        const expensesSnap = await userDoc.collection('groups').doc(group.id).collection('expenses').get();
        return normalize<GroupExpense>(expensesSnap.docs);
      })
    )
  ).flat();

  return {
    profile,
    settings: {
      app: appSettingsSnap.exists()
        ? ({ ...DEFAULT_APP_SETTINGS, ...(appSettingsSnap.data() as Partial<AppSettingsDoc>) } as AppSettingsDoc)
        : DEFAULT_APP_SETTINGS,
      budget: budgetSnap.exists()
        ? ({ ...DEFAULT_BUDGET_SETTINGS, ...(budgetSnap.data() as Partial<BudgetSettingsDoc>) } as BudgetSettingsDoc)
        : DEFAULT_BUDGET_SETTINGS,
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
  await runFirestoreMutation(() =>
    db().collection('users').doc(uid).collection('settings').doc('app').set(data, { merge: true })
  );
};

export const saveUserBudgetSettings = async (uid: string, data: Partial<BudgetSettingsDoc>) => {
  await runFirestoreMutation(() =>
    db().collection('users').doc(uid).collection('budgets').doc('current').set(data, { merge: true })
  );
};

export const upsertUserDoc = async <T extends { id: string }>(collectionName: string, uid: string, value: T) => {
  await runFirestoreMutation(() =>
    userCollection(uid, collectionName).doc(value.id).set(value, { merge: true })
  );
};

export const deleteUserDoc = async (collectionName: string, uid: string, id: string) => {
  await runFirestoreMutation(() => userCollection(uid, collectionName).doc(id).delete());
};

export const upsertUserGroup = async <T extends Group>(uid: string, value: T) => {
  await runFirestoreMutation(() => userCollection(uid, 'groups').doc(value.id).set(value, { merge: true }));
};

export const deleteUserGroup = async (uid: string, id: string) => {
  await runFirestoreMutation(async () => {
    const groupRef = userCollection(uid, 'groups').doc(id);
    const expenses = await groupRef.collection('expenses').get();
    await Promise.all(expenses.docs.map((expense) => expense.ref.delete()));
    await groupRef.delete();
  });
};

export const upsertUserGroupExpense = async <T extends GroupExpense>(uid: string, groupId: string, value: T) => {
  await runFirestoreMutation(() =>
    userCollection(uid, 'groups').doc(groupId).collection('expenses').doc(value.id).set(value, { merge: true })
  );
};

export const deleteUserGroupExpense = async (uid: string, groupId: string, expenseId: string) => {
  await runFirestoreMutation(() =>
    userCollection(uid, 'groups').doc(groupId).collection('expenses').doc(expenseId).delete()
  );
};

export const saveUserBackup = async <TSnapshot>(uid: string, snapshot: TSnapshot) => {
  await runFirestoreMutation(() =>
    userCollection(uid, 'backups').add({
      backup_name: `Backup ${new Date().toLocaleString()}`,
      snapshot,
      createdAt: firestore.FieldValue.serverTimestamp(),
      createdAtMs: Date.now(),
    } satisfies FirestoreBackupRecord<TSnapshot>)
  );
};

export const getLatestUserBackup = async <TSnapshot>(uid: string): Promise<TSnapshot | null> => {
  const results = await userCollection(uid, 'backups').orderBy('createdAtMs', 'desc').limit(1).get();
  const latestBackup = results.docs[0]?.data();
  return latestBackup?.snapshot ? (latestBackup.snapshot as TSnapshot) : null;
};
