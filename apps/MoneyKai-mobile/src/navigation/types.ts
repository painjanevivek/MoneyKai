import type { NavigatorScreenParams } from '@react-navigation/native';
import type { GraphTransactionContext } from '@/utils/dashboardGraph';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Transactions: undefined;
  Add: undefined;
  Groups: { transactionId?: string; startSplit?: boolean } | undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  NotFound: undefined;
  Budget: undefined;
  Auth: undefined;
  App: NavigatorScreenParams<AppTabParamList> | undefined;
  ProfileEdit: undefined;
  Notifications: undefined;
  Notes: undefined;
  Groups: undefined;
  Learn: undefined;
  Savings: undefined;
  AiReview: undefined;
  Settings: { focus?: 'password' | 'cloud' | 'notifications' | 'appLock' | 'export' } | undefined;
  AutoCapture: undefined;
  SmsParser: undefined;
  ReviewDrafts: undefined;
  ArchiveTransactions: undefined;
  BeforeYouBuy: { name?: string; pricePaise?: number } | undefined;
  Legal: { document: 'privacy' | 'terms' };
  Subscriptions: undefined;
  TrustCenter: undefined;
  PrivacySecurity: undefined;
  GraphInsights: undefined;
  GraphTransactions: GraphTransactionContext;
};
