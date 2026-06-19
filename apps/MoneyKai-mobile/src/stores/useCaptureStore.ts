import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { recordAppNotification } from '@/services/notificationService';
import { DEFAULT_SMS_IMPORT_RANGE_ID } from '@/constants/smsImportRanges';
import {
  buildMonitoredAccount,
  findMatchingCaptureAccount,
  formatMonitoredAccountLabel,
  identifyCaptureAccount,
} from '@/services/captureAccountIdentifier';
import { buildCaptureDedupeKeys } from '@/services/captureDedupe';
import { normalizeMerchantKey, parseCapturedSignal } from '@/services/captureParser';
import { getCaptureReviewDecision } from '@/services/captureReviewPolicy';
import { setNativeApprovedSmsAccounts } from '@/services/nativeCaptureBridge';
import { useAuthStore } from './useAuthStore';
import { useBudgetStore } from './useBudgetStore';
import { useTransactionStore } from './useTransactionStore';
import type {
  CapturedSignal,
  CaptureIngestionResult,
  CaptureParseResult,
  CaptureSettings,
  CaptureSignalInput,
  DraftTransaction,
  MerchantCategoryRule,
  MonitoredAccount,
} from '@/types/capture';
import type { SmsImportRangeId } from '@/types/smsImport';

const MAX_CAPTURED_SIGNALS = 100;
const MAX_DRAFTS = 100;
const DEFAULT_CAPTURE_SETTINGS: CaptureSettings = {
  autoCaptureEnabled: false,
  notificationCaptureEnabled: true,
  reviewNotificationsEnabled: true,
  smsResearchModeEnabled: false,
  aiSmsAssistEnabled: false,
  notificationAccessStatus: 'unknown',
  smsAccessStatus: 'unknown',
  smsImportRangeId: DEFAULT_SMS_IMPORT_RANGE_ID,
};

const buildId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const SAFE_RAW_PAYLOAD_KEYS = new Set([
  'rawPackageName',
  'privacyStatus',
  'captureOrigin',
  'rawBodyStored',
  'smsMessageId',
  'smsSubscriptionId',
  'smsSlot',
  'smsPhoneId',
  'smsAccountHint',
  'discoverySampleRedactedBody',
  'discoverySampleSender',
  'discoverySampleReceivedAt',
  'discoverySampleMessageId',
]);

const sanitizeCaptureRawPayload = (rawPayload?: Record<string, unknown>): Record<string, unknown> | undefined => {
  if (!rawPayload) return undefined;

  const safePayload = Object.entries(rawPayload).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (SAFE_RAW_PAYLOAD_KEYS.has(key) && ['string', 'number', 'boolean'].includes(typeof value)) {
      acc[key] = value;
    }
    return acc;
  }, {});

  return Object.keys(safePayload).length > 0 ? safePayload : undefined;
};

const isSourceFallbackMerchant = (parsed: CaptureParseResult, input: CaptureSignalInput) => {
  const merchant = parsed.merchantLabel?.trim();
  if (!merchant) return true;
  return [input.sender, input.sourceApp, input.title].some((value) => value?.trim() === merchant);
};

const buildDraftDescription = (parsed: CaptureParseResult, input: CaptureSignalInput) => {
  const merchant = parsed.merchantLabel?.trim();
  const hasUsefulMerchant = Boolean(merchant && !isSourceFallbackMerchant(parsed, input));

  if (parsed.type === 'income') {
    const directionTerms = parsed.explanation.matchedDirectionTerms.map((term) => term.toLowerCase());
    if (parsed.category === 'allowance' || directionTerms.includes('salary')) {
      return hasUsefulMerchant ? `Salary from ${merchant}` : 'Salary deposit';
    }
    if (directionTerms.includes('cashback')) {
      return hasUsefulMerchant ? `Cashback from ${merchant}` : 'Cashback received';
    }
    if (parsed.category === 'refund' || directionTerms.includes('refund')) {
      return hasUsefulMerchant ? `Refund from ${merchant}` : 'Refund received';
    }
    if (parsed.category === 'freelance') {
      return hasUsefulMerchant ? `Payment from ${merchant}` : 'Freelance payment';
    }
    return hasUsefulMerchant ? `Deposit from ${merchant}` : 'Bank deposit';
  }

  return merchant || input.sender || input.sourceApp || 'Captured transaction';
};

interface CaptureState {
  settings: CaptureSettings;
  signals: CapturedSignal[];
  drafts: DraftTransaction[];
  merchantRules: MerchantCategoryRule[];
  monitoredAccounts: MonitoredAccount[];
  setAutoCaptureEnabled: (enabled: boolean) => void;
  setNotificationCaptureEnabled: (enabled: boolean) => void;
  setReviewNotificationsEnabled: (enabled: boolean) => void;
  setSmsResearchModeEnabled: (enabled: boolean) => void;
  setAiSmsAssistEnabled: (enabled: boolean) => void;
  setSmsImportRangeId: (rangeId: SmsImportRangeId) => void;
  acceptNotificationExplainer: () => void;
  acceptSmsResearchExplainer: () => void;
  setNotificationAccessStatus: (status: CaptureSettings['notificationAccessStatus']) => void;
  setSmsAccessStatus: (status: CaptureSettings['smsAccessStatus']) => void;
  disableAutoCapture: () => void;
  clearSmsResearchData: () => void;
  discoverSmsAccounts: (inputs: CaptureSignalInput[]) => {
    discoveredCount: number;
    pendingCount: number;
    approvedCount: number;
    declinedCount: number;
  };
  isSignalAccountApproved: (input: CaptureSignalInput) => boolean;
  getApprovedSmsAccountIds: () => string[];
  syncApprovedAccountsToNative: () => void;
  approveMonitoredAccount: (accountId: string) => void;
  declineMonitoredAccount: (accountId: string) => void;
  pauseMonitoredAccount: (accountId: string) => void;
  resumeMonitoredAccount: (accountId: string) => void;
  unselectMonitoredAccount: (accountId: string) => void;
  ingestSignal: (input: CaptureSignalInput) => CaptureIngestionResult;
  confirmDraft: (draftId: string, category: string) => boolean;
  ignoreDraft: (draftId: string) => void;
  clearCaptureInbox: () => void;
}

const createOrStrengthenRule = (
  rules: MerchantCategoryRule[],
  draft: DraftTransaction,
  category: string
): MerchantCategoryRule[] => {
  const now = new Date().toISOString();
  const merchantLabel = draft.description || draft.merchantKey || 'Unknown merchant';
  const merchantKey = draft.merchantKey ?? normalizeMerchantKey(merchantLabel);
  const existing = rules.find((rule) => rule.merchantKey === merchantKey);

  if (existing) {
    return rules.map((rule) =>
      rule.id === existing.id
        ? {
            ...rule,
            category,
            payment_method: draft.payment_method,
            confidence: Math.min(0.95, Math.max(rule.confidence, draft.confidence) + 0.05),
            usageCount: rule.usageCount + 1,
            updatedAt: now,
            lastUsedAt: now,
          }
        : rule
    );
  }

  return [
    {
      id: buildId('rule'),
      merchantKey,
      merchantLabel,
      category,
      payment_method: draft.payment_method,
      source: 'manual',
      confidence: Math.max(0.75, draft.confidence),
      usageCount: 1,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
    },
    ...rules,
  ];
};

const syncApprovedAccountsToNative = (accounts: MonitoredAccount[]) => {
  const approvedAccountIds = accounts
    .filter((account) => account.status === 'approved')
    .map((account) => account.id)
    .sort();

  void setNativeApprovedSmsAccounts(approvedAccountIds);
};

export const useCaptureStore = create<CaptureState>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_CAPTURE_SETTINGS,
      signals: [],
      drafts: [],
      merchantRules: [],
      monitoredAccounts: [],

      setAutoCaptureEnabled: (enabled) =>
        set((state) => ({ settings: { ...state.settings, autoCaptureEnabled: enabled } })),

      setNotificationCaptureEnabled: (enabled) =>
        set((state) => ({ settings: { ...state.settings, notificationCaptureEnabled: enabled } })),

      setReviewNotificationsEnabled: () =>
        set((state) => ({ settings: { ...state.settings, reviewNotificationsEnabled: true } })),

      setSmsResearchModeEnabled: (enabled) =>
        set((state) => ({ settings: { ...state.settings, smsResearchModeEnabled: enabled } })),

      setAiSmsAssistEnabled: (enabled) =>
        set((state) => ({ settings: { ...state.settings, aiSmsAssistEnabled: enabled } })),

      setSmsImportRangeId: (rangeId) =>
        set((state) => ({ settings: { ...state.settings, smsImportRangeId: rangeId } })),

      acceptNotificationExplainer: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            notificationExplainerAcceptedAt: new Date().toISOString(),
          },
        })),

      acceptSmsResearchExplainer: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            smsResearchExplainerAcceptedAt: new Date().toISOString(),
          },
        })),

      setNotificationAccessStatus: (status) =>
        set((state) => ({
          settings: {
            ...state.settings,
            notificationAccessStatus: status,
            notificationAccessLastCheckedAt: new Date().toISOString(),
          },
        })),

      setSmsAccessStatus: (status) =>
        set((state) => ({
          settings: {
            ...state.settings,
            smsAccessStatus: status,
            smsAccessLastCheckedAt: new Date().toISOString(),
          },
        })),

      disableAutoCapture: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            autoCaptureEnabled: false,
          },
        })),

      clearSmsResearchData: () =>
        set((state) => ({
          signals: state.signals.filter(
            (signal) => signal.source !== 'sms' || signal.processingStatus === 'confirmed'
          ),
          drafts: state.drafts.filter(
            (draft) => draft.captureSource !== 'sms' || draft.status === 'confirmed'
          ),
          monitoredAccounts: state.monitoredAccounts.filter((account) => account.status !== 'pending'),
        })),

      discoverSmsAccounts: (inputs) => {
        const now = new Date().toISOString();
        const identities = inputs.map(identifyCaptureAccount).filter((item): item is NonNullable<typeof item> => Boolean(item));
        const uniqueIdentities = identities.filter(
          (identity, index, list) => list.findIndex((item) => item.id === identity.id) === index
        );

        if (uniqueIdentities.length === 0) {
          return { discoveredCount: 0, pendingCount: 0, approvedCount: 0, declinedCount: 0 };
        }

        let nextAccounts = get().monitoredAccounts;
        const newPendingAccounts: MonitoredAccount[] = [];

        uniqueIdentities.forEach((identity) => {
          const existing = findMatchingCaptureAccount(nextAccounts, identity);
          if (existing) {
            nextAccounts = nextAccounts.map((account) =>
              account.id === existing.id
                ? {
                    ...account,
                    bankLabel: identity.bankLabel,
                    accountHint: identity.accountHint ?? account.accountHint,
                    sender: identity.sender ?? account.sender,
                    sampleMessage: identity.sampleMessage ?? account.sampleMessage,
                    sampleCount: account.sampleCount + identities.filter((item) => item.id === identity.id).length,
                    lastSeenAt: now,
                    discoverySample: identity.discoverySample ?? account.discoverySample,
                  }
                : account
            );
            return;
          }

          const account = buildMonitoredAccount(identity, now);
          newPendingAccounts.push(account);
          nextAccounts = [account, ...nextAccounts];
        });

        set({ monitoredAccounts: nextAccounts });

        newPendingAccounts.forEach((account) => {
          void recordAppNotification({
            title: 'Bank account found',
            body: `${formatMonitoredAccountLabel(account)} needs approval before MoneyKai fetches SMS transactions.`,
            type: 'transaction',
            actionRoute: '/(tabs)/notifications',
          });
        });

        const relevantAccounts = uniqueIdentities
          .map((identity) => findMatchingCaptureAccount(nextAccounts, identity))
          .filter((account): account is MonitoredAccount => Boolean(account));

        return {
          discoveredCount: relevantAccounts.length,
          pendingCount: relevantAccounts.filter((account) => account.status === 'pending').length,
          approvedCount: relevantAccounts.filter((account) => account.status === 'approved').length,
          declinedCount: relevantAccounts.filter((account) => account.status === 'declined').length,
        };
      },

      isSignalAccountApproved: (input) => {
        if (input.source !== 'sms') return true;
        const identity = identifyCaptureAccount(input);
        if (!identity) return false;
        return Boolean(findMatchingCaptureAccount(get().monitoredAccounts, identity, ['approved']));
      },

      getApprovedSmsAccountIds: () =>
        get()
          .monitoredAccounts.filter((account) => account.status === 'approved')
          .map((account) => account.id)
          .sort(),

      syncApprovedAccountsToNative: () => {
        syncApprovedAccountsToNative(get().monitoredAccounts);
      },

      approveMonitoredAccount: (accountId) => {
        const now = new Date().toISOString();
        set((state) => ({
          monitoredAccounts: state.monitoredAccounts.map((account) =>
            account.id === accountId
              ? {
                  ...account,
                  status: 'approved',
                  approvedAt: account.approvedAt ?? now,
                  resumedAt: account.status === 'paused' ? now : account.resumedAt,
                  declinedAt: undefined,
                  pausedAt: undefined,
                }
              : account
          ),
        }));
        get().syncApprovedAccountsToNative();
      },

      declineMonitoredAccount: (accountId) => {
        const now = new Date().toISOString();
        set((state) => ({
          monitoredAccounts: state.monitoredAccounts.map((account) =>
            account.id === accountId
              ? {
                  ...account,
                  status: 'declined',
                  declinedAt: now,
                  approvedAt: undefined,
                  pausedAt: undefined,
                  resumedAt: undefined,
                }
              : account
          ),
        }));
        get().syncApprovedAccountsToNative();
      },

      pauseMonitoredAccount: (accountId) => {
        const now = new Date().toISOString();
        set((state) => ({
          monitoredAccounts: state.monitoredAccounts.map((account) =>
            account.id === accountId && account.status === 'approved'
              ? { ...account, status: 'paused', pausedAt: now }
              : account
          ),
        }));
        get().syncApprovedAccountsToNative();
      },

      resumeMonitoredAccount: (accountId) => {
        const now = new Date().toISOString();
        set((state) => ({
          monitoredAccounts: state.monitoredAccounts.map((account) =>
            account.id === accountId && (account.status === 'paused' || account.status === 'declined')
              ? {
                  ...account,
                  status: 'approved',
                  approvedAt: account.approvedAt ?? now,
                  resumedAt: now,
                  declinedAt: undefined,
                  pausedAt: undefined,
                }
              : account
          ),
        }));
        get().syncApprovedAccountsToNative();
      },

      unselectMonitoredAccount: (accountId) =>
        set((state) => ({
          monitoredAccounts: state.monitoredAccounts.map((account) =>
            account.id === accountId
              ? { ...account, status: 'declined', declinedAt: new Date().toISOString(), approvedAt: undefined }
              : account
          ),
        })),

      ingestSignal: (input) => {
        const { settings, signals, merchantRules } = get();

        if (!settings.autoCaptureEnabled) {
          return { status: 'ignored', reason: 'auto capture is disabled' };
        }

        if (input.source === 'notification' && !settings.notificationCaptureEnabled) {
          return { status: 'ignored', reason: 'notification capture is disabled' };
        }

        if (input.source === 'sms' && !settings.smsResearchModeEnabled) {
          return { status: 'ignored', reason: 'sms capture is research-only' };
        }

        if (input.source === 'sms') {
          const discovery = get().discoverSmsAccounts([input]);
          if (!get().isSignalAccountApproved(input)) {
            return {
              status: 'ignored',
              reason:
                discovery.declinedCount > 0
                  ? 'sms bank account monitoring is declined'
                  : 'sms bank account monitoring needs approval',
            };
          }
        }

        if (useBudgetStore.getState().settings.monthly_allowance <= 0) {
          return { status: 'ignored', reason: 'set a monthly budget before fetching transactions' };
        }

        const now = new Date().toISOString();
        const accountIdentity = input.source === 'sms' ? identifyCaptureAccount(input) : undefined;
        const monitoredAccount = accountIdentity
          ? findMatchingCaptureAccount(get().monitoredAccounts, accountIdentity, ['approved'])
          : undefined;
        const parsed = parseCapturedSignal(input, merchantRules);
        const dedupeKeys = buildCaptureDedupeKeys(input, parsed, monitoredAccount?.id);
        const duplicateSignal = signals.find(
          (signal) =>
            signal.sourceFingerprint === dedupeKeys.sourceFingerprint ||
            signal.canonicalTransactionKey === dedupeKeys.canonicalTransactionKey ||
            signal.dedupeKey === dedupeKeys.legacyDedupeKey
        );

        if (duplicateSignal) {
          return { signalId: duplicateSignal.id, status: 'duplicate', reason: 'duplicate capture signal' };
        }

        const duplicateDraft = get().drafts.find(
          (draft) =>
            draft.sourceFingerprint === dedupeKeys.sourceFingerprint ||
            draft.canonicalTransactionKey === dedupeKeys.canonicalTransactionKey
        );

        if (duplicateDraft) {
          return { signalId: duplicateDraft.signalId, draftId: duplicateDraft.id, status: 'duplicate', reason: 'duplicate transaction draft' };
        }

        const signal: CapturedSignal = {
          id: buildId('signal'),
          source: input.source,
          title: input.title,
          sender: input.sender,
          sourceApp: input.sourceApp,
          receivedAt: input.receivedAt ?? now,
          createdAt: now,
          dedupeKey: dedupeKeys.legacyDedupeKey,
          canonicalTransactionKey: dedupeKeys.canonicalTransactionKey,
          sourceFingerprint: dedupeKeys.sourceFingerprint,
          captureAccountId: monitoredAccount?.id,
          processingStatus: parsed.parseStatus === 'ignore' ? 'ignored' : 'drafted',
          parsedAmount: parsed.amount,
          parsedType: parsed.type,
          parsedMerchant: parsed.merchantLabel,
          parsedPaymentMethod: parsed.paymentMethod,
          parseStatus: parsed.parseStatus,
          parseReason: parsed.reason,
          parseExplanation: parsed.explanation,
          ignoreReason: parsed.ignoreReason,
          confidence: parsed.confidence,
          body: parsed.explanation.safeSnippet,
          rawPayload: sanitizeCaptureRawPayload(input.rawPayload),
        };

        if (parsed.parseStatus === 'ignore' || !parsed.amount) {
          set((state) => ({
            signals: [signal, ...state.signals].slice(0, MAX_CAPTURED_SIGNALS),
          }));
          return { signalId: signal.id, status: 'ignored', reason: parsed.ignoreReason ?? parsed.reason };
        }

        const userId = useAuthStore.getState().user?.id ?? 'local';
        const reviewDecision = getCaptureReviewDecision(parsed, input.source);
        const draft: DraftTransaction = {
          id: buildId('draft'),
          signalId: signal.id,
          user_id: userId,
          type: parsed.type ?? 'expense',
          amount: parsed.amount,
          category: reviewDecision.approvedCategory,
          suggestedCategory: reviewDecision.suggestedCategory,
          description: buildDraftDescription(parsed, input),
          merchantKey: parsed.merchantKey,
          canonicalTransactionKey: dedupeKeys.canonicalTransactionKey,
          sourceFingerprint: dedupeKeys.sourceFingerprint,
          payment_method: parsed.paymentMethod ?? 'bank',
          captureAccountId: monitoredAccount?.id,
          captureAccountLabel: monitoredAccount ? formatMonitoredAccountLabel(monitoredAccount) : undefined,
          captureBankLabel: monitoredAccount?.bankLabel,
          captureAccountHint: monitoredAccount?.accountHint,
          transaction_date: parsed.transactionDate ?? new Date(input.receivedAt ?? now).toISOString().split('T')[0],
          confidence: parsed.confidence,
          captureSource: input.source,
          sourceApp: input.sourceApp ?? input.sender,
          parseReason: parsed.reason,
          parseExplanation: parsed.explanation,
          reviewRequired: reviewDecision.reviewRequired,
          status: 'pending',
          createdAt: now,
        };

        set((state) => ({
          signals: [signal, ...state.signals].slice(0, MAX_CAPTURED_SIGNALS),
          drafts: [draft, ...state.drafts].slice(0, MAX_DRAFTS),
        }));

        void recordAppNotification({
          title: draft.suggestedCategory ? 'Transaction draft ready' : 'Category needed',
          body: draft.suggestedCategory
            ? `${draft.description} was captured and is ready to review.`
            : `${draft.description} needs a category before it is added.`,
          type: 'transaction',
          actionRoute: '/(tabs)/notifications',
        });

        return { signalId: signal.id, draftId: draft.id, status: 'drafted', reason: parsed.reason };
      },

      confirmDraft: (draftId, category) => {
        const draft = get().drafts.find((item) => item.id === draftId);
        if (!draft || draft.status !== 'pending') return false;
        if (useBudgetStore.getState().settings.monthly_allowance <= 0) return false;

        const confirmedAt = new Date().toISOString();
        const didAddTransaction = useTransactionStore.getState().addTransaction({
          user_id: draft.user_id,
          type: draft.type,
          amount: draft.amount,
          category,
          description: draft.description,
          payment_method: draft.payment_method,
          captureAccountId: draft.captureAccountId,
          captureAccountLabel: draft.captureAccountLabel,
          captureBankLabel: draft.captureBankLabel,
          captureAccountHint: draft.captureAccountHint,
          captureSource: draft.captureSource,
          canonicalTransactionKey: draft.canonicalTransactionKey,
          sourceFingerprint: draft.sourceFingerprint,
          transaction_date: draft.transaction_date,
        });

        if (!didAddTransaction) return false;

        set((state) => ({
          drafts: state.drafts.map((item) =>
            item.id === draft.id ? { ...item, category, status: 'confirmed', confirmedAt } : item
          ),
          signals: state.signals.map((signal) =>
            signal.id === draft.signalId ? { ...signal, processingStatus: 'confirmed' } : signal
          ),
          merchantRules: createOrStrengthenRule(state.merchantRules, draft, category),
        }));

        return true;
      },

      ignoreDraft: (draftId) =>
        set((state) => {
          const draft = state.drafts.find((item) => item.id === draftId);
          return {
            drafts: state.drafts.map((item) =>
              item.id === draftId ? { ...item, status: 'ignored' } : item
            ),
            signals: draft
              ? state.signals.map((signal) =>
                  signal.id === draft.signalId ? { ...signal, processingStatus: 'ignored' } : signal
                )
              : state.signals,
          };
        }),

      clearCaptureInbox: () =>
        set((state) => ({
          signals: state.signals.filter((signal) => signal.processingStatus === 'confirmed'),
          drafts: state.drafts.filter((draft) => draft.status === 'confirmed'),
        })),
    }),
    {
      name: 'moneykai-auto-capture',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        signals: state.signals,
        drafts: state.drafts,
        merchantRules: state.merchantRules,
        monitoredAccounts: state.monitoredAccounts,
      }),
    }
  )
);
