import { privateDeviceStorage } from '@/services/privateDeviceStorage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { recordAppNotification } from '@/services/notificationService';
import { isNotificationCaptureEnabled } from '@/config/environment';
import { DEFAULT_SMS_IMPORT_RANGE_ID } from '@/constants/smsImportRanges';
import {
  buildMonitoredAccount,
  findMatchingCaptureAccount,
  formatMonitoredAccountLabel,
  identifyCaptureAccount,
} from '@/services/captureAccountIdentifier';
import { buildCaptureDedupeKeys } from '@/services/captureDedupe';
import { normalizeMerchantKey, parseCapturedSignal } from '@/services/captureParser';
import { MANUAL_SMS_CONSENT_VERSION, SMS_CONSENT_VERSION, SMS_AUTO_ADD_CONSENT_VERSION, hasCurrentSmsAutoAddConsent, hasCurrentSmsConsent } from '@/constants/smsConsent';
import { bulkDraftCategory, draftConfirmationError } from '@/utils/draftReview';
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
import { normalizeSmsInterval } from '@/constants/smsSchedule';
import { useConnectStore } from './useConnectStore';
import { PAYMENT_CONNECTIONS } from '@/constants/paymentConnections';

const MAX_CAPTURED_SIGNALS = 100;
const DEFAULT_CAPTURE_SETTINGS: CaptureSettings = {
  autoCaptureEnabled: false,
  notificationCaptureEnabled: isNotificationCaptureEnabled(),
  reviewNotificationsEnabled: true,
  smsResearchModeEnabled: false,
  aiSmsAssistEnabled: false,
  autoAddRecognizedSms: false,
  notificationAccessStatus: 'unknown',
  smsAccessStatus: 'unknown',
  smsImportRangeId: DEFAULT_SMS_IMPORT_RANGE_ID,
  smsParseIntervalMinutes: 60,
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
  setAutoAddRecognizedSms: (enabled: boolean) => void;
  setSmsImportRangeId: (rangeId: SmsImportRangeId) => void;
  setSmsParseIntervalMinutes: (minutes: number) => void;
  acceptNotificationExplainer: () => void;
  acceptSmsResearchExplainer: () => void;
  acceptManualSmsDisclosure: () => void;
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
  confirmDraft: (draftId: string, category: string, automatically?: boolean, learnCategory?: boolean) => boolean;
  confirmAllDrafts: (owner: string, draftIds: string[], categories?: Record<string, string>) => { added: number; pending: number; interrupted: boolean };
  learnSmsCategoryFromTransaction: (transactionId: string) => void;
  ignoreDraft: (draftId: string) => void;
  clearCaptureInbox: () => void;
}

const createOrStrengthenRule = (
  rules: MerchantCategoryRule[],
  draft: DraftTransaction,
  category: string
): MerchantCategoryRule[] => {
  const now = new Date().toISOString();
  const merchantLabel = draft.counterpartyName || draft.description || draft.merchantKey || 'Unknown merchant';
  const merchantKey = draft.merchantKey ?? normalizeMerchantKey(merchantLabel);
  const existing = rules.find((rule) => rule.merchantKey === merchantKey && rule.userId === draft.user_id && rule.transactionType === draft.type);

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
      userId: draft.user_id,
      transactionType: draft.type,
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
        set((state) => ({
          settings: {
            ...state.settings,
            notificationCaptureEnabled: isNotificationCaptureEnabled() && enabled,
          },
        })),

      setReviewNotificationsEnabled: () =>
        set((state) => ({ settings: { ...state.settings, reviewNotificationsEnabled: true } })),

      setSmsResearchModeEnabled: (enabled) =>
        set((state) => ({ settings: { ...state.settings, smsResearchModeEnabled: enabled } })),

      setAiSmsAssistEnabled: (enabled) =>
        set((state) => ({ settings: { ...state.settings, aiSmsAssistEnabled: enabled } })),

      setAutoAddRecognizedSms: (enabled) => {
        const owner = useAuthStore.getState().user?.id;
        if (enabled && (!owner || !hasCurrentSmsConsent(get().settings, owner))) return;
        set((state) => ({ settings: { ...state.settings, autoAddRecognizedSms: enabled,
          ...(enabled ? { smsAutoAddConsentVersion: SMS_AUTO_ADD_CONSENT_VERSION, smsAutoAddConsentUserId: owner, smsAutoAddConsentAcceptedAt: new Date().toISOString() } : {}) } }));
      },

      setSmsImportRangeId: (rangeId) =>
        set((state) => ({ settings: { ...state.settings, smsImportRangeId: rangeId } })),
      setSmsParseIntervalMinutes: (minutes) =>
        set((state) => ({ settings: { ...state.settings, smsParseIntervalMinutes: normalizeSmsInterval(minutes) } })),

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
            smsConsentVersion: SMS_CONSENT_VERSION,
            smsConsentUserId: useAuthStore.getState().user?.id,
          },
        })),

      acceptManualSmsDisclosure: () => {
        const owner = useAuthStore.getState().user?.id;
        if (!owner) return;
        set((state) => ({ settings: {
          ...state.settings,
          manualSmsConsentVersion: MANUAL_SMS_CONSENT_VERSION,
          manualSmsConsentUserId: owner,
          manualSmsConsentAcceptedAt: new Date().toISOString(),
        } }));
      },

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
            localOnly: true,
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

        if (useBudgetStore.getState().settings.monthly_allowance <= 0) {
          return { status: 'ignored', reason: 'set a monthly budget before fetching transactions' };
        }

        const owner = useAuthStore.getState().user?.id;
        if (input.source === 'notification') {
          const packageName = input.rawPayload?.rawPackageName;
          const app = PAYMENT_CONNECTIONS.find(item => item.packageName === packageName);
          if (!owner || !isNotificationCaptureEnabled() || !settings.notificationExplainerAcceptedAt ||
            input.rawPayload?.notificationOwnerId !== owner || !app || !useConnectStore.getState().notificationAppsByUser[owner]?.[app.id]) {
            return { status: 'ignored', reason: 'payment notification consent or selected app is not current' };
          }
        }
        const parsed = parseCapturedSignal(input, merchantRules.filter((rule) => !rule.userId || rule.userId === owner));
        if ((input.source === 'sms' || input.source === 'notification') && (parsed.parseStatus === 'ignore' || !parsed.amount)) {
          return { status: 'ignored', reason: parsed.ignoreReason ?? parsed.reason };
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

        const now = new Date().toISOString();
        const accountIdentity = input.source === 'sms' ? identifyCaptureAccount(input) : undefined;
        const monitoredAccount = accountIdentity
          ? findMatchingCaptureAccount(get().monitoredAccounts, accountIdentity, ['approved'])
          : undefined;
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
        const autoAdd = hasCurrentSmsConsent(settings, owner) && hasCurrentSmsAutoAddConsent(settings, owner) && settings.smsAccessStatus === 'granted';
        const reviewDecision = getCaptureReviewDecision(parsed, input.source, autoAdd);
        const draft: DraftTransaction = {
          id: buildId('draft'),
          signalId: signal.id,
          user_id: userId,
          type: parsed.type ?? 'expense',
          amount: parsed.amount,
          category: reviewDecision.approvedCategory,
          suggestedCategory: reviewDecision.suggestedCategory,
          description: buildDraftDescription(parsed, input),
          counterpartyName: parsed.merchantLabel,
          counterpartyKind: parsed.counterpartyKind,
          automaticallyRecorded: !reviewDecision.reviewRequired,
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
          drafts: [draft, ...state.drafts],
        }));

        if (!reviewDecision.reviewRequired && reviewDecision.approvedCategory && get().confirmDraft(draft.id, reviewDecision.approvedCategory, true)) {
          return { signalId: signal.id, draftId: draft.id, status: 'confirmed', reason: 'recognized SMS transaction auto-added' };
        }
        // If the ledger write is rejected, never represent the pending record as saved.
        if (!reviewDecision.reviewRequired) set((state) => ({ drafts: state.drafts.map((item) => item.id === draft.id ? { ...item, category: undefined, reviewRequired: true, automaticallyRecorded: false } : item) }));

        void recordAppNotification({
          title: draft.suggestedCategory ? 'Transaction draft ready' : 'Category needed',
          schedule: false,
          body: draft.suggestedCategory
            ? `${draft.description} was captured and is ready to review.`
            : `${draft.description} needs a category before it is added.`,
          type: 'transaction',
          actionRoute: '/(tabs)/notifications',
          localOnly: true,
        });

        return { signalId: signal.id, draftId: draft.id, status: 'drafted', reason: parsed.reason };
      },

      confirmDraft: (draftId, category, automatically = false, learnCategory = true) => {
        const draft = get().drafts.find((item) => item.id === draftId);
        if (!draft || draft.status !== 'pending' || automatically && draft.category !== category) return false;
        const owner = useAuthStore.getState().user?.id;
        if (draftConfirmationError(draft, owner, category, useBudgetStore.getState().settings.monthly_allowance)) return false;
        if (automatically && (draft.captureSource !== 'sms' || draft.reviewRequired !== false || draft.automaticallyRecorded !== true || !get().settings.autoCaptureEnabled || !get().settings.smsResearchModeEnabled || get().settings.smsAccessStatus !== 'granted' || !hasCurrentSmsConsent(get().settings, owner) || !hasCurrentSmsAutoAddConsent(get().settings, owner) || !get().monitoredAccounts.some((account) => account.id === draft.captureAccountId && account.status === 'approved'))) return false;

        const confirmedAt = new Date().toISOString();
        const didAddTransaction = useTransactionStore.getState().addTransaction({
          user_id: draft.user_id,
          type: draft.type,
          amount: draft.amount,
          category,
          description: draft.description,
          counterpartyName: draft.counterpartyName,
          counterpartyKind: category === 'personal_transfer' ? 'person' : draft.counterpartyKind,
          automaticallyRecorded: automatically,
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
            item.id === draft.id ? { ...item, category, status: 'confirmed', confirmedAt, automaticallyRecorded: automatically } : item
          ),
          signals: state.signals.map((signal) =>
            signal.id === draft.signalId ? { ...signal, processingStatus: 'confirmed' } : signal
          ),
          merchantRules: automatically || !learnCategory ? state.merchantRules : createOrStrengthenRule(state.merchantRules, draft, category),
        }));

        return true;
      },

      confirmAllDrafts: (owner, draftIds, categories = {}) => {
        let added = 0;
        let interrupted = false;
        // Freeze the approved batch: captures arriving after the dialog aren't approved.
        const ids = new Set(draftIds);
        for (const id of ids) {
          if (!owner || useAuthStore.getState().user?.id !== owner) { interrupted = true; break; }
          const draft = get().drafts.find((item) => item.id === id);
          if (!draft || draft.user_id !== owner || draft.status !== 'pending') continue;
          try {
            // Share the normal validation/duplicate/privacy path, but never learn
            // merchant rules from bulk-approved parser guesses or fallback labels.
            if (get().confirmDraft(id, bulkDraftCategory(draft, categories[id]), false, false)) added++;
          } catch {
            // A write may have partially completed. Stop and ask the owner to check
            // Transactions rather than blindly retrying the rest of the batch.
            interrupted = true;
            break;
          }
        }
        return { added, pending: get().drafts.filter((draft) => ids.has(draft.id) && draft.user_id === owner && draft.status === 'pending').length, interrupted };
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

      learnSmsCategoryFromTransaction: (transactionId) => {
        const transaction = useTransactionStore.getState().transactions.find((item) => item.id === transactionId);
        const owner = useAuthStore.getState().user?.id;
        if (!transaction || !owner || transaction.user_id !== owner || transaction.captureSource !== 'sms' || !transaction.counterpartyName) return;
        const draft: DraftTransaction = { id: transaction.id, signalId: '', user_id: owner, type: transaction.type, amount: transaction.amount, category: transaction.category,
          description: transaction.description, counterpartyName: transaction.counterpartyName, merchantKey: normalizeMerchantKey(transaction.counterpartyName),
          payment_method: transaction.payment_method, transaction_date: transaction.transaction_date, confidence: 1, captureSource: 'sms', status: 'pending', createdAt: transaction.created_at };
        if (draftConfirmationError(draft, owner, transaction.category, useBudgetStore.getState().settings.monthly_allowance)) return;
        set((state) => ({ merchantRules: createOrStrengthenRule(state.merchantRules, draft, transaction.category) }));
      },

      clearCaptureInbox: () =>
        set((state) => ({
          signals: state.signals.filter((signal) => signal.processingStatus === 'confirmed'),
          drafts: state.drafts.filter((draft) => draft.status === 'confirmed'),
        })),
    }),
    {
      name: 'moneykai-auto-capture',
      storage: createJSONStorage(() => privateDeviceStorage),
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
