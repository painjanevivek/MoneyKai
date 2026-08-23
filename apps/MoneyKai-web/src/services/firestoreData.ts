import { backendApi } from './backendApi';
import type { Group, GroupExpense } from '../types/group';
import type { ThemeMode, ThemePaletteId } from '../constants/theme';
import type { DashboardTrendChartType, DashboardTrendMetric, DashboardTrendRange } from '@/stores/useSettingsStore';
import type { BackendSnapshot } from '@/types/backend';

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

export type FirestoreUserSnapshot = BackendSnapshot;

export const loadUserFirestoreSnapshot = async (uid: string, profile: FirestoreUserSnapshot['profile']): Promise<FirestoreUserSnapshot> => {
  void uid;
  void profile;
  return backendApi.getBootstrap();
};

export const saveUserAppSettings = async (uid: string, data: Partial<AppSettingsDoc>) => {
  void uid;
  await backendApi.updateAppSettings(data);
};

export const saveUserBudgetSettings = async (uid: string, data: Partial<BudgetSettingsDoc>) => {
  void uid;
  await backendApi.updateBudgetSettings(data);
};

export const upsertUserDoc = async <T extends { id: string }>(collectionName: string, uid: string, value: T) => {
  void uid;
  if (collectionName === 'savings') {
    await backendApi.updateChallenge(value.id, value);
    return;
  }
  if (collectionName === 'linkedAccounts') {
    await backendApi.updateLinkedAccount(value.id, value);
    return;
  }
  if (isBackendResource(collectionName)) {
    await backendApi.updateResource(collectionName, value.id, value);
    return;
  }
  throw new Error(`Unsupported backend-owned collection: ${collectionName}`);
};

export const deleteUserDoc = async (collectionName: string, uid: string, id: string) => {
  void uid;
  if (collectionName === 'savings') {
    await backendApi.deleteChallenge(id);
    return;
  }
  if (collectionName === 'linkedAccounts') {
    await backendApi.deleteLinkedAccount(id);
    return;
  }
  if (isBackendResource(collectionName)) {
    await backendApi.deleteResource(collectionName, id);
    return;
  }
  throw new Error(`Unsupported backend-owned collection: ${collectionName}`);
};

export const upsertUserGroup = async <T extends Group>(uid: string, value: T) => {
  void uid;
  await backendApi.createGroup(value);
};

export const deleteUserGroup = async (uid: string, id: string) => {
  void uid;
  await backendApi.deleteGroup(id);
};

export const upsertUserGroupExpense = async <T extends GroupExpense>(uid: string, groupId: string, value: T) => {
  void uid;
  await backendApi.createGroupExpense(groupId, value);
};

export const deleteUserGroupExpense = async (uid: string, groupId: string, expenseId: string) => {
  void uid;
  await backendApi.deleteGroupExpense(groupId, expenseId);
};

const isBackendResource = (
  collectionName: string,
): collectionName is 'transactions' | 'notes' | 'badges' | 'notifications' =>
  ['transactions', 'notes', 'badges', 'notifications'].includes(collectionName);
