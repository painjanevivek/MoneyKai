import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Transaction } from '@/types/transaction';
import type { DraftTransaction } from '@/types/capture';
import { useCaptureStore } from './useCaptureStore';
import { SMS_CONSENT_VERSION, SMS_AUTO_ADD_CONSENT_VERSION } from '@/constants/smsConsent';

const mocks = vi.hoisted(() => ({
  owner: 'phase3g-user',
  addTransaction: vi.fn(),
  monthlyAllowance: 10000,
  recordAppNotification: vi.fn(),
  setNativeApprovedSmsAccounts: vi.fn(),
  transactions: [] as Transaction[],
  paymentApps: { google_pay: true, phonepe: true, paytm: true },
}));

vi.mock('react-native', () => ({ NativeModules: {} }));
vi.mock('./useConnectStore', () => ({ useConnectStore: { getState: () => ({ notificationAppsByUser: { 'phase3g-user': mocks.paymentApps } }) } }));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

vi.mock('@/services/notificationService', () => ({
  recordAppNotification: mocks.recordAppNotification,
}));

vi.mock('@/services/nativeCaptureBridge', () => ({
  setNativeApprovedSmsAccounts: mocks.setNativeApprovedSmsAccounts,
}));

vi.mock('./useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({
      user: {
        id: mocks.owner,
        email: 'phase3g@example.com',
        full_name: 'Phase 3G User',
      },
    }),
  },
}));

vi.mock('./useTransactionStore', () => ({
  useTransactionStore: {
    getState: () => ({
      addTransaction: mocks.addTransaction,
      transactions: mocks.transactions,
    }),
  },
}));

vi.mock('./useBudgetStore', () => ({
  useBudgetStore: {
    getState: () => ({
      settings: {
        monthly_allowance: mocks.monthlyAllowance,
      },
    }),
  },
}));

const resetCaptureStore = () => {
  mocks.owner = 'phase3g-user';
  mocks.paymentApps = { google_pay: true, phonepe: true, paytm: true };
  useCaptureStore.setState({
    settings: {
      autoCaptureEnabled: false,
      notificationCaptureEnabled: true,
      reviewNotificationsEnabled: false,
      smsResearchModeEnabled: false,
      aiSmsAssistEnabled: false,
      notificationAccessStatus: 'unknown',
      notificationExplainerAcceptedAt: '2026-06-09T09:00:00Z',
      smsAccessStatus: 'unknown',
      smsImportRangeId: '1_month',
    },
    signals: [],
    drafts: [],
    merchantRules: [],
    monitoredAccounts: [],
  });
};

describe('explicit Allow All draft approval', () => {
  const draft = (id: string, changes: Partial<DraftTransaction> = {}): DraftTransaction => ({
    id, signalId: id, user_id: 'phase3g-user', type: 'expense', amount: 150, description: `Synthetic ${id}`,
    merchantKey: id, payment_method: 'upi', transaction_date: '2026-06-09', captureSource: 'sms',
    confidence: 0.7, status: 'pending', createdAt: '2026-06-09T10:00:00Z', ...changes,
  });
  beforeEach(() => { vi.clearAllMocks(); mocks.monthlyAllowance = 10000; mocks.addTransaction.mockReturnValue(true); resetCaptureStore(); });
  it('adds every owned pending source through the normal ledger path and never trains bulk guesses', () => {
    useCaptureStore.setState({ drafts: [draft('sms', { suggestedCategory: 'food' }), draft('notification', { captureSource: 'notification' }), draft('credit', { captureSource: 'aa', type: 'income' }), draft('reviewed', { status: 'confirmed' }), draft('ignored', { status: 'ignored' }), draft('foreign', { user_id: 'other' })] });
    const ids = useCaptureStore.getState().drafts.map(item => item.id);
    expect(useCaptureStore.getState().confirmAllDrafts('phase3g-user', ids)).toEqual({ added: 3, pending: 0, interrupted: false });
    expect(mocks.addTransaction.mock.calls.map(([item]) => [item.captureSource, item.category])).toEqual([['sms', 'food'], ['notification', 'others'], ['aa', 'other_income']]);
    expect(mocks.addTransaction.mock.calls.every(([item]) => item.automaticallyRecorded === false)).toBe(true);
    expect(useCaptureStore.getState().merchantRules).toEqual([]);
    expect(useCaptureStore.getState().drafts.find(item => item.id === 'foreign')?.status).toBe('pending');
    expect(useCaptureStore.getState().confirmAllDrafts('phase3g-user', ids).added).toBe(0);
    expect(mocks.addTransaction).toHaveBeenCalledTimes(3);
  });
  it('uses only the dialog snapshot, deduplicates IDs and honors explicit category choices', () => {
    useCaptureStore.setState({ drafts: [draft('approved'), draft('arrived-later')] });
    expect(useCaptureStore.getState().confirmAllDrafts('phase3g-user', ['approved', 'approved'], { approved: 'medical-invalid' })).toMatchObject({ added: 1 });
    expect(mocks.addTransaction).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ category: 'others' }));
    expect(useCaptureStore.getState().drafts[1].status).toBe('pending');
    useCaptureStore.getState().confirmAllDrafts('phase3g-user', ['arrived-later'], { 'arrived-later': 'healthcare' });
    expect(mocks.addTransaction).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'healthcare' }));
  });
  it('keeps malformed and duplicate-blocked drafts pending without misreporting them as added', () => {
    useCaptureStore.setState({ drafts: [draft('valid'), draft('duplicate'), draft('bad', { amount: -5 }), draft('future', { transaction_date: '2099-01-01' })] });
    mocks.addTransaction.mockReturnValueOnce(true).mockReturnValueOnce(false);
    expect(useCaptureStore.getState().confirmAllDrafts('phase3g-user', ['valid', 'duplicate', 'bad', 'future'])).toEqual({ added: 1, pending: 3, interrupted: false });
    expect(useCaptureStore.getState().drafts.filter(item => item.status === 'confirmed')).toHaveLength(1);
    expect(mocks.addTransaction).toHaveBeenCalledTimes(2);
  });
  it('cannot approve after the owner changes or without a budget', () => {
    useCaptureStore.setState({ drafts: [draft('one')] });
    mocks.owner = 'other';
    expect(useCaptureStore.getState().confirmAllDrafts('phase3g-user', ['one'])).toMatchObject({ added: 0, pending: 1, interrupted: true });
    mocks.owner = 'phase3g-user'; mocks.monthlyAllowance = 0;
    expect(useCaptureStore.getState().confirmAllDrafts('phase3g-user', ['one'])).toMatchObject({ added: 0, pending: 1 });
    expect(mocks.addTransaction).not.toHaveBeenCalled();
  });
  it('stops immediately on a ledger exception without trying subsequent drafts or learning rules', () => {
    useCaptureStore.setState({ drafts: [draft('one'), draft('two')] });
    mocks.addTransaction.mockImplementationOnce(() => { throw new Error('Synthetic write failure'); });
    expect(useCaptureStore.getState().confirmAllDrafts('phase3g-user', ['one', 'two'])).toEqual({ added: 0, pending: 2, interrupted: true });
    expect(mocks.addTransaction).toHaveBeenCalledTimes(1);
    expect(useCaptureStore.getState().merchantRules).toEqual([]);
  });
});

describe('selective SMS auto-add store integration', () => {
  it('rejects notification events without selected-app consent or from another account', () => {
    useCaptureStore.setState(state => ({ settings: { ...state.settings, autoCaptureEnabled: true } }));
    const alert = { source: 'notification' as const, body: 'You paid Rs 150 to Corner Cafe via UPI.', rawPayload: { rawPackageName: 'com.google.android.apps.nbu.paisa.user', notificationOwnerId: 'phase3g-user' } };
    expect(useCaptureStore.getState().ingestSignal({ ...alert, rawPayload: { ...alert.rawPayload, notificationOwnerId: 'other' } }).status).toBe('ignored');
    expect(useCaptureStore.getState().ingestSignal({ ...alert, rawPayload: { ...alert.rawPayload, rawPackageName: 'com.unrelated.app' } }).status).toBe('ignored');
    useCaptureStore.setState(state => ({ settings: { ...state.settings, notificationExplainerAcceptedAt: undefined } }));
    expect(useCaptureStore.getState().ingestSignal(alert).status).toBe('ignored');
    expect(useCaptureStore.getState().signals).toEqual([]);
    expect(useCaptureStore.getState().drafts).toEqual([]);
  });
  it('stops draft creation immediately when an app is deselected', () => {
    useCaptureStore.setState(state => ({ settings: { ...state.settings, autoCaptureEnabled: true } }));
    mocks.paymentApps.google_pay = false;
    expect(useCaptureStore.getState().ingestSignal({ source: 'notification', body: 'You paid Rs 150 to Corner Cafe via UPI.', rawPayload: { rawPackageName: 'com.google.android.apps.nbu.paisa.user', notificationOwnerId: 'phase3g-user' } }).status).toBe('ignored');
    expect(useCaptureStore.getState().drafts).toEqual([]);
  });
  it.each([['Google Pay', 'com.google.android.apps.nbu.paisa.user'], ['PhonePe', 'com.phonepe.app'], ['Paytm', 'net.one97.paytm']])('creates review-only drafts from selected %s alerts', (sourceApp, rawPackageName) => {
    useCaptureStore.setState(state => ({ settings: { ...state.settings, autoCaptureEnabled: true } }));
    const result = useCaptureStore.getState().ingestSignal({ source: 'notification', sourceApp, body: 'You paid Rs 150 to Corner Cafe via UPI.', rawPayload: { rawPackageName, notificationOwnerId: 'phase3g-user' } });
    expect(result.status).toBe('drafted');
    expect(useCaptureStore.getState().drafts[0]).toMatchObject({ amount: 150, captureSource: 'notification', reviewRequired: true });
    expect(mocks.addTransaction).not.toHaveBeenCalled();
  });
  it.each(['OTP 123456 for payment of Rs 500', 'You paid Rs 500, payment failed', 'You paid Rs 500, still pending', 'Get cashback offer Rs 500'])('never retains unsafe notification content: %s', body => {
    useCaptureStore.setState(state => ({ settings: { ...state.settings, autoCaptureEnabled: true } }));
    expect(useCaptureStore.getState().ingestSignal({ source: 'notification', body, rawPayload: { rawPackageName: 'com.google.android.apps.nbu.paisa.user', notificationOwnerId: 'phase3g-user' } }).status).toBe('ignored');
    expect(useCaptureStore.getState().signals).toEqual([]);
    expect(useCaptureStore.getState().drafts).toEqual([]);
  });
  const sms = (merchant = 'Corner Cafe', hash = 'a') => ({ source: 'sms' as const, sender: 'AX-HDFCBK', receivedAt: '2026-06-09T10:00:00Z',
    body: `A/c [masked] debited by Rs 299.00 for UPI payment to ${merchant} on 09/06/2026. UPI Ref [ref].`,
    rawPayload: { captureOrigin: 'android_sms_inbox_import', smsAutoRecordSafe: true, smsReferenceHash: hash.repeat(64), smsAccountHint: 'ending 4321', smsMessageId: hash } });
  const activate = () => {
    useCaptureStore.setState((state) => ({ settings: { ...state.settings, autoCaptureEnabled: true, smsResearchModeEnabled: true, smsAccessStatus: 'granted',
      smsConsentUserId: 'phase3g-user', smsConsentVersion: SMS_CONSENT_VERSION, smsResearchExplainerAcceptedAt: '2026-06-09T09:00:00Z' } }));
    useCaptureStore.getState().discoverSmsAccounts([sms()]);
    useCaptureStore.getState().approveMonitoredAccount('sms:hdfcbk:ending4321');
  };
  beforeEach(() => { vi.clearAllMocks(); mocks.monthlyAllowance = 10000; mocks.addTransaction.mockReturnValue(true); mocks.transactions = []; resetCaptureStore(); });
  it('defaults to review and never silently changes an old consent into auto-add permission', () => {
    activate();
    expect(useCaptureStore.getState().ingestSignal(sms()).status).toBe('drafted');
    expect(mocks.addTransaction).not.toHaveBeenCalled();
    useCaptureStore.setState((state) => ({ settings: { ...state.settings, autoAddRecognizedSms: true } }));
    expect(useCaptureStore.getState().ingestSignal(sms('Corner Cafe', 'b')).status).toBe('drafted');
  });
  it('auto-adds reliable new captures exactly once and never trains on its own guesses', () => {
    activate(); useCaptureStore.getState().setAutoAddRecognizedSms(true);
    expect(useCaptureStore.getState().ingestSignal(sms()).status).toBe('confirmed');
    expect(mocks.addTransaction).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ category: 'food', description: 'Corner Cafe', automaticallyRecorded: true, captureSource: 'sms' }));
    expect(useCaptureStore.getState().drafts[0]).toMatchObject({ status: 'confirmed', automaticallyRecorded: true });
    expect(useCaptureStore.getState().merchantRules).toHaveLength(0);
    expect(useCaptureStore.getState().ingestSignal(sms()).status).toBe('duplicate');
    expect(mocks.addTransaction).toHaveBeenCalledTimes(1);
    // The successful ledger write now owns its one Android success notification.
    expect(mocks.recordAppNotification).not.toHaveBeenCalledWith(expect.objectContaining({ title: 'SMS transaction auto-added' }));
  });
  it.each(['Vivek Naresh Painjane', 'Swiggy Instamart', 'Wellness Spa', 'Unknown Store'])('keeps uncertain %s under review', merchant => {
    activate(); useCaptureStore.getState().setAutoAddRecognizedSms(true);
    expect(useCaptureStore.getState().ingestSignal(sms(merchant)).status).toBe('drafted');
    expect(mocks.addTransaction).not.toHaveBeenCalled();
  });
  it('learns an exact person category after confirmation and preserves the surname on a later payment', () => {
    activate(); useCaptureStore.getState().setAutoAddRecognizedSms(true);
    const first = useCaptureStore.getState().ingestSignal(sms('Vivek Naresh Painjane'));
    expect(first.status).toBe('drafted');
    expect(useCaptureStore.getState().confirmDraft(first.draftId!, 'personal_transfer')).toBe(true);
    expect(useCaptureStore.getState().merchantRules[0]).toMatchObject({ userId: 'phase3g-user', transactionType: 'expense', category: 'personal_transfer', merchantLabel: 'Vivek Naresh Painjane', usageCount: 1 });
    const second = useCaptureStore.getState().ingestSignal(sms('Vivek Naresh Painjane', 'b'));
    expect(second.status).toBe('confirmed');
    expect(mocks.addTransaction.mock.calls[1][0]).toMatchObject({ category: 'personal_transfer', counterpartyKind: 'person', description: 'Vivek Naresh Painjane' });
    expect(useCaptureStore.getState().merchantRules[0].usageCount).toBe(1);
  });
  it('falls back to review on a rejected ledger write', () => {
    activate(); useCaptureStore.getState().setAutoAddRecognizedSms(true); mocks.addTransaction.mockReturnValue(false);
    expect(useCaptureStore.getState().ingestSignal(sms()).status).toBe('drafted');
    expect(useCaptureStore.getState().drafts[0]).toMatchObject({ status: 'pending', reviewRequired: true, automaticallyRecorded: false });
    expect(mocks.recordAppNotification).not.toHaveBeenCalledWith(expect.objectContaining({ title: 'SMS transaction auto-added' }));
  });
  it('does not auto-add for another owner, revoked permission, missing budget or paused bank', () => {
    activate(); useCaptureStore.getState().setAutoAddRecognizedSms(true);
    useCaptureStore.setState((state) => ({ settings: { ...state.settings, smsAutoAddConsentUserId: 'other', smsAutoAddConsentVersion: SMS_AUTO_ADD_CONSENT_VERSION } }));
    expect(useCaptureStore.getState().ingestSignal(sms()).status).toBe('drafted');
    useCaptureStore.getState().setAutoAddRecognizedSms(true); useCaptureStore.getState().setSmsAccessStatus('denied');
    expect(useCaptureStore.getState().ingestSignal(sms('Corner Cafe', 'b')).status).toBe('drafted');
    mocks.monthlyAllowance = 0;
    expect(useCaptureStore.getState().ingestSignal(sms('Corner Cafe', 'c')).status).toBe('ignored');
    mocks.monthlyAllowance = 10000; useCaptureStore.getState().setSmsAccessStatus('granted');
    useCaptureStore.getState().pauseMonitoredAccount('sms:hdfcbk:ending4321');
    expect(useCaptureStore.getState().ingestSignal(sms('Corner Cafe', 'c')).status).toBe('ignored');
    expect(mocks.addTransaction).not.toHaveBeenCalled();
  });
  it('a manual correction of an auto-added transaction updates only an owner-specific local rule', () => {
    const transaction: Transaction = { id: 'tx', user_id: 'phase3g-user', type: 'expense', amount: 299, category: 'healthcare', description: 'Corner Cafe', counterpartyName: 'Corner Cafe', captureSource: 'sms', automaticallyRecorded: true, payment_method: 'upi', transaction_date: '2026-06-09', created_at: '2026-06-09T10:00:00Z' };
    mocks.transactions = [transaction]; useCaptureStore.getState().learnSmsCategoryFromTransaction('tx');
    expect(useCaptureStore.getState().merchantRules[0]).toMatchObject({ userId: transaction.user_id, category: 'healthcare', merchantKey: 'corner cafe' });
    mocks.transactions = [{ ...transaction, id: 'other', user_id: 'other-user' }];
    useCaptureStore.getState().learnSmsCategoryFromTransaction('other');
    expect(useCaptureStore.getState().merchantRules).toHaveLength(1);
  });
  it('leaves existing pending drafts untouched when auto-add is switched on', () => {
    activate(); const first = useCaptureStore.getState().ingestSignal(sms());
    useCaptureStore.getState().setAutoAddRecognizedSms(true);
    expect(useCaptureStore.getState().drafts.find(draft => draft.id === first.draftId)?.status).toBe('pending');
    expect(mocks.addTransaction).not.toHaveBeenCalled();
  });
});

describe('useCaptureStore production safety controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.monthlyAllowance = 10000;
    mocks.addTransaction.mockReturnValue(true);
    mocks.transactions = [];
    resetCaptureStore();
  });

  it('ignores new capture signals after Auto Capture is disabled', () => {
    useCaptureStore.getState().setAutoCaptureEnabled(true);
    useCaptureStore.getState().disableAutoCapture();

    const result = useCaptureStore.getState().ingestSignal({
      source: 'notification',
      rawPayload: { rawPackageName: 'com.google.android.apps.nbu.paisa.user', notificationOwnerId: 'phase3g-user' },
      sourceApp: 'HDFC Bank',
      title: 'Debit alert',
      body: 'Rs 321.00 debited from account for UPI payment to DISABLED TEST. UPI Ref 555566667777.',
      receivedAt: '2026-06-09T10:00:00.000Z',
    });

    expect(result).toEqual({ status: 'ignored', reason: 'auto capture is disabled' });
    expect(useCaptureStore.getState().drafts).toHaveLength(0);
    expect(useCaptureStore.getState().signals).toHaveLength(0);
    expect(mocks.addTransaction).not.toHaveBeenCalled();
    expect(mocks.recordAppNotification).not.toHaveBeenCalled();
  });

  it('clears pending and ignored capture data while preserving confirmed transaction history', () => {
    useCaptureStore.setState((state) => ({
      settings: {
        ...state.settings,
        autoCaptureEnabled: true,
      },
    }));

    const confirmed = useCaptureStore.getState().ingestSignal({
      source: 'notification',
      rawPayload: { rawPackageName: 'com.google.android.apps.nbu.paisa.user', notificationOwnerId: 'phase3g-user' },
      sourceApp: 'HDFC Bank',
      title: 'Debit alert',
      body: 'A/c debited by Rs 650.00 for UPI payment to CONFIRMED CAFE. UPI Ref 100000000001.',
      receivedAt: '2026-06-09T10:00:00.000Z',
    });
    const pending = useCaptureStore.getState().ingestSignal({
      source: 'notification',
      rawPayload: { rawPackageName: 'com.google.android.apps.nbu.paisa.user', notificationOwnerId: 'phase3g-user' },
      sourceApp: 'HDFC Bank',
      title: 'Debit alert',
      body: 'Rs 999.00 debited from account for UPI payment to SECOND CAFE. UPI Ref 100000000002.',
      receivedAt: '2026-06-09T10:05:00.000Z',
    });
    const ignored = useCaptureStore.getState().ingestSignal({
      source: 'notification',
      rawPayload: { rawPackageName: 'com.google.android.apps.nbu.paisa.user', notificationOwnerId: 'phase3g-user' },
      sourceApp: 'Bank Promo',
      title: 'Offer',
      body: 'Get 10% cashback on your next shopping voucher. No transaction has happened.',
      receivedAt: '2026-06-09T10:10:00.000Z',
    });

    expect(confirmed.status).toBe('drafted');
    expect(pending.status).toBe('drafted');
    expect(ignored.status).toBe('ignored');

    const confirmedDraftId = confirmed.draftId;
    expect(confirmedDraftId).toBeDefined();
    expect(useCaptureStore.getState().confirmDraft(confirmedDraftId as string, 'food')).toBe(true);

    useCaptureStore.getState().clearCaptureInbox();

    expect(mocks.addTransaction).toHaveBeenCalledTimes(1);
    expect(useCaptureStore.getState().drafts).toEqual([
      expect.objectContaining({
        id: confirmedDraftId,
        status: 'confirmed',
      }),
    ]);
    expect(useCaptureStore.getState().signals).toEqual([
      expect.objectContaining({
        id: confirmed.signalId,
        processingStatus: 'confirmed',
      }),
    ]);
  });

  it('creates reviewable SMS drafts only when SMS Research Mode is enabled', () => {
    useCaptureStore.setState((state) => ({
      settings: {
        ...state.settings,
        autoCaptureEnabled: true,
        smsResearchModeEnabled: true,
      },
    }));

    const input = {
      source: 'sms',
      sender: 'HDFCBK',
      body: 'Rs 321.00 debited from account on 08-06-26 for UPI payment to SMS TEST CAFE. UPI Ref 555566667777.',
      receivedAt: '2026-06-09T10:00:00.000Z',
      rawPayload: { body: 'should not be used by the manual import path' },
    } as const;
    useCaptureStore.getState().discoverSmsAccounts([input]);
    useCaptureStore.getState().approveMonitoredAccount('sms:hdfcbk:sender');

    const result = useCaptureStore.getState().ingestSignal(input);

    expect(result.status).toBe('drafted');
    expect(useCaptureStore.getState().drafts).toEqual([
      expect.objectContaining({
        captureSource: 'sms',
        sourceApp: 'HDFCBK',
        transaction_date: '2026-06-08',
        status: 'pending',
      }),
    ]);
    expect(useCaptureStore.getState().signals).toEqual([
      expect.objectContaining({
        source: 'sms',
        body: expect.not.stringContaining('555566667777'),
      }),
    ]);

    expect(useCaptureStore.getState().confirmDraft(result.draftId as string, 'food')).toBe(true);
    expect(mocks.addTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        transaction_date: '2026-06-08',
        captureSource: 'sms',
      })
    );
  });

  it('does not retain unrelated or credential-bearing SMS, even as ignored capture history', () => {
    useCaptureStore.setState((state) => ({
      settings: {
        ...state.settings,
        autoCaptureEnabled: true,
        smsResearchModeEnabled: true,
      },
    }));

    for (const body of [
      'Rs 500 cashback offer when you pay this week.',
      'Rs 500 debited. Your PIN is 1234.',
      'Rs 500 spent. Your CVV is 123.',
      'OTP 123456 for payment of Rs 500.',
    ]) {
      const result = useCaptureStore.getState().ingestSignal({ source: 'sms', sender: 'AX-HDFCBK', body });
      expect(result.status).toBe('ignored');
    }

    expect(useCaptureStore.getState().monitoredAccounts).toHaveLength(0);
    expect(useCaptureStore.getState().signals).toHaveLength(0);
    expect(useCaptureStore.getState().drafts).toHaveLength(0);
    expect(mocks.addTransaction).not.toHaveBeenCalled();
  });

  it('requires SMS bank account approval before creating SMS drafts', () => {
    useCaptureStore.setState((state) => ({
      settings: {
        ...state.settings,
        autoCaptureEnabled: true,
        smsResearchModeEnabled: true,
      },
    }));

    const input = {
      source: 'sms' as const,
      sender: 'AX-HDFCBK',
      body: 'A/c XX4321 debited by Rs 321.00 for UPI payment to ACCOUNT APPROVAL TEST. UPI Ref 555566667777.',
      receivedAt: '2026-06-09T10:00:00.000Z',
      rawPayload: {
        smsAccountHint: 'ending 4321',
      },
    };

    const blocked = useCaptureStore.getState().ingestSignal(input);

    expect(blocked).toEqual({ status: 'ignored', reason: 'sms bank account monitoring needs approval' });
    expect(useCaptureStore.getState().drafts).toHaveLength(0);
    expect(useCaptureStore.getState().monitoredAccounts).toEqual([
      expect.objectContaining({
        id: 'sms:hdfcbk:ending4321',
        status: 'pending',
        accountHint: 'ending 4321',
      }),
    ]);
    expect(mocks.recordAppNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Bank account found',
        actionRoute: '/(tabs)/notifications',
        localOnly: true,
      })
    );

    useCaptureStore.getState().approveMonitoredAccount('sms:hdfcbk:ending4321');
    const drafted = useCaptureStore.getState().ingestSignal(input);

    expect(drafted.status).toBe('drafted');
    expect(useCaptureStore.getState().drafts).toEqual([
      expect.objectContaining({
        captureSource: 'sms',
        sourceApp: 'AX-HDFCBK',
        captureAccountId: 'sms:hdfcbk:ending4321',
        captureAccountLabel: 'HDFC Bank - A/c ending 4321',
      }),
    ]);
  });

  it('uses short generated descriptions for bank deposits', () => {
    useCaptureStore.setState((state) => ({
      settings: {
        ...state.settings,
        autoCaptureEnabled: true,
      },
    }));

    const result = useCaptureStore.getState().ingestSignal({
      source: 'notification',
      rawPayload: { rawPackageName: 'com.google.android.apps.nbu.paisa.user', notificationOwnerId: 'phase3g-user' },
      sourceApp: 'Axis Bank',
      title: 'Credit Alert',
      body: 'INR 25,000.00 credited to A/c XX8888 from ACME PAYROLL as salary. UTR 333344445555.',
      receivedAt: '2026-06-09T09:40:00.000Z',
    });

    expect(result.status).toBe('drafted');
    expect(useCaptureStore.getState().drafts[0]).toEqual(
      expect.objectContaining({
        type: 'income',
        category: undefined,
        suggestedCategory: 'allowance',
        description: 'Salary from ACME PAYROLL',
      })
    );
  });

  it('keeps compatible approved SMS accounts approved for future sender variants', () => {
    useCaptureStore.setState((state) => ({
      settings: {
        ...state.settings,
        autoCaptureEnabled: true,
        smsResearchModeEnabled: true,
      },
    }));

    const approvedInput = {
      source: 'sms' as const,
      sender: 'AD-SBIPSG-T',
      body: 'A/c XX9929 debited by Rs 321.00 for UPI payment to APPROVED ACCOUNT. UPI Ref 555566667777.',
      receivedAt: '2026-06-09T10:00:00.000Z',
      rawPayload: { smsAccountHint: 'ending 9929' },
    };
    useCaptureStore.getState().discoverSmsAccounts([approvedInput]);
    useCaptureStore.getState().approveMonitoredAccount('sms:sbipsg:ending9929');

    const futureInput = {
      source: 'sms' as const,
      sender: 'SBI',
      body: 'A/c XX9929 debited by Rs 122.00 for UPI payment to SAME ACCOUNT SHOP. UPI Ref 555566667778.',
      receivedAt: '2026-06-09T10:05:00.000Z',
      rawPayload: { smsAccountHint: 'ending 9929' },
    };

    const result = useCaptureStore.getState().ingestSignal(futureInput);

    expect(result.status).toBe('drafted');
    expect(useCaptureStore.getState().monitoredAccounts.filter((account) => account.status === 'pending')).toHaveLength(0);
    expect(useCaptureStore.getState().drafts[0]).toEqual(
      expect.objectContaining({
        captureAccountId: 'sms:sbipsg:ending9929',
        captureAccountLabel: 'SBI - A/c ending 9929',
      })
    );
  });

  it('pauses and resumes approved SMS account monitoring while syncing native IDs', () => {
    const input = {
      source: 'sms' as const,
      sender: 'AX-HDFCBK',
      body: 'A/c XX4321 debited by Rs 321.00 for UPI payment to ACCOUNT LIFECYCLE. UPI Ref 555566667777.',
      receivedAt: '2026-06-09T10:00:00.000Z',
      rawPayload: { smsAccountHint: 'ending 4321' },
    };

    useCaptureStore.getState().discoverSmsAccounts([input]);
    useCaptureStore.getState().approveMonitoredAccount('sms:hdfcbk:ending4321');
    expect(mocks.setNativeApprovedSmsAccounts).toHaveBeenLastCalledWith(['sms:hdfcbk:ending4321']);

    useCaptureStore.getState().pauseMonitoredAccount('sms:hdfcbk:ending4321');
    expect(useCaptureStore.getState().monitoredAccounts[0]).toEqual(
      expect.objectContaining({ status: 'paused', pausedAt: expect.any(String) })
    );
    expect(mocks.setNativeApprovedSmsAccounts).toHaveBeenLastCalledWith([]);

    useCaptureStore.getState().resumeMonitoredAccount('sms:hdfcbk:ending4321');
    expect(useCaptureStore.getState().monitoredAccounts[0]).toEqual(
      expect.objectContaining({ status: 'approved', resumedAt: expect.any(String) })
    );
    expect(mocks.setNativeApprovedSmsAccounts).toHaveBeenLastCalledWith(['sms:hdfcbk:ending4321']);
  });

  it('routes captured draft alerts to the notifications inbox', () => {
    useCaptureStore.setState((state) => ({
      settings: {
        ...state.settings,
        autoCaptureEnabled: true,
      },
    }));

    const result = useCaptureStore.getState().ingestSignal({
      source: 'notification',
      rawPayload: { rawPackageName: 'com.google.android.apps.nbu.paisa.user', notificationOwnerId: 'phase3g-user' },
      sourceApp: 'HDFC Bank',
      title: 'Debit alert',
      body: 'Rs 321.00 debited from account for UPI payment to NOTIFICATION ROUTE TEST. UPI Ref 555566667777.',
      receivedAt: '2026-06-09T10:00:00.000Z',
    });

    expect(result.status).toBe('drafted');
    expect(mocks.recordAppNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'transaction',
        actionRoute: '/(tabs)/notifications',
        localOnly: true,
      })
    );
  });

  it('persists only safe SMS capture metadata and never raw SMS payload fields', () => {
    useCaptureStore.setState((state) => ({
      settings: {
        ...state.settings,
        autoCaptureEnabled: true,
        smsResearchModeEnabled: true,
      },
    }));

    const rawBody = 'Rs 321.00 debited from account for UPI payment to RAW PAYLOAD TEST. UPI Ref 555566667777.';
    const input = {
      source: 'sms',
      sender: 'AXISBK',
      body: rawBody,
      receivedAt: '2026-06-09T10:00:00.000Z',
      rawPayload: {
        body: rawBody,
        sender: 'AXISBK',
        captureOrigin: 'android_sms_receiver',
        rawBodyStored: 'false',
        smsSubscriptionId: '2',
        smsSlot: '1',
        smsPhoneId: '1',
      },
    } as const;
    useCaptureStore.getState().discoverSmsAccounts([input]);
    useCaptureStore.getState().approveMonitoredAccount('sms:axisbk:sender');

    const result = useCaptureStore.getState().ingestSignal(input);

    expect(result.status).toBe('drafted');
    expect(useCaptureStore.getState().signals[0]).toEqual(
      expect.objectContaining({
        body: expect.not.stringContaining('555566667777'),
        rawPayload: {
          captureOrigin: 'android_sms_receiver',
          rawBodyStored: 'false',
          smsSubscriptionId: '2',
          smsSlot: '1',
          smsPhoneId: '1',
        },
      })
    );
    expect(useCaptureStore.getState().signals[0].rawPayload).not.toHaveProperty('body');
    expect(useCaptureStore.getState().signals[0].rawPayload).not.toHaveProperty('sender');
  });

  it('blocks captured transactions until a monthly budget exists', () => {
    mocks.monthlyAllowance = 0;
    useCaptureStore.setState((state) => ({
      settings: {
        ...state.settings,
        autoCaptureEnabled: true,
      },
    }));

    const result = useCaptureStore.getState().ingestSignal({
      source: 'notification',
      rawPayload: { rawPackageName: 'com.google.android.apps.nbu.paisa.user', notificationOwnerId: 'phase3g-user' },
      sourceApp: 'Axis Bank',
      title: 'Debit alert',
      body: 'INR 293.00 debited for UPI payment to SWIGGY INSTAMART. UPI Ref 652670076603.',
      receivedAt: '2026-06-09T10:00:00.000Z',
    });

    expect(result).toEqual({ status: 'ignored', reason: 'set a monthly budget before fetching transactions' });
    expect(useCaptureStore.getState().drafts).toHaveLength(0);
    expect(useCaptureStore.getState().signals).toHaveLength(0);
    expect(mocks.addTransaction).not.toHaveBeenCalled();
  });

  it('does not confirm old drafts after the monthly budget is removed', () => {
    useCaptureStore.setState((state) => ({
      settings: {
        ...state.settings,
        autoCaptureEnabled: true,
      },
    }));

    const result = useCaptureStore.getState().ingestSignal({
      source: 'notification',
      rawPayload: { rawPackageName: 'com.google.android.apps.nbu.paisa.user', notificationOwnerId: 'phase3g-user' },
      sourceApp: 'Axis Bank',
      title: 'Debit alert',
      body: 'INR 315.00 debited for UPI payment to SWIGGY. UPI Ref 652604639717.',
      receivedAt: '2026-06-09T10:00:00.000Z',
    });

    mocks.monthlyAllowance = 0;

    expect(result.status).toBe('drafted');
    expect(useCaptureStore.getState().confirmDraft(result.draftId as string, 'food')).toBe(false);
    expect(mocks.addTransaction).not.toHaveBeenCalled();
    expect(useCaptureStore.getState().drafts[0]).toEqual(
      expect.objectContaining({
        id: result.draftId,
        status: 'pending',
      })
    );
  });

  it('confirms only the selected pending draft when one category is chosen', () => {
    useCaptureStore.setState((state) => ({
      settings: {
        ...state.settings,
        autoCaptureEnabled: true,
      },
    }));

    const first = useCaptureStore.getState().ingestSignal({
      source: 'notification',
      rawPayload: { rawPackageName: 'com.google.android.apps.nbu.paisa.user', notificationOwnerId: 'phase3g-user' },
      sourceApp: 'Google Pay',
      title: 'Payment successful',
      body: 'You paid Rs 120 to SAME PERSON via UPI.',
      receivedAt: '2026-06-09T09:00:00.000Z',
    });
    const second = useCaptureStore.getState().ingestSignal({
      source: 'notification',
      rawPayload: { rawPackageName: 'com.google.android.apps.nbu.paisa.user', notificationOwnerId: 'phase3g-user' },
      sourceApp: 'Google Pay',
      title: 'Payment successful',
      body: 'You paid Rs 180 to SAME PERSON via UPI.',
      receivedAt: '2026-06-09T09:31:00.000Z',
    });

    expect(first.status).toBe('drafted');
    expect(second.status).toBe('drafted');

    expect(useCaptureStore.getState().confirmDraft(first.draftId as string, 'food')).toBe(true);

    expect(mocks.addTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.addTransaction).toHaveBeenCalledWith(expect.objectContaining({ amount: 120, category: 'food' }));
    expect(useCaptureStore.getState().drafts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: first.draftId, status: 'confirmed', category: 'food' }),
        expect.objectContaining({ id: second.draftId, status: 'pending' }),
      ])
    );
  });

  it('blocks one real transaction captured from SMS and notification variants', () => {
    useCaptureStore.setState((state) => ({
      settings: {
        ...state.settings,
        autoCaptureEnabled: true,
        smsResearchModeEnabled: true,
      },
    }));

    const smsInput = {
      source: 'sms',
      sender: 'AX-HDFCBK',
      body: 'A/c XX4321 debited by Rs 1.00 for UPI payment to AKSHAY PAINJANE. UPI Ref 555566667777.',
      receivedAt: '2026-06-09T10:00:00.000Z',
      rawPayload: { smsAccountHint: 'ending 4321', smsMessageId: '42' },
    } as const;

    useCaptureStore.getState().discoverSmsAccounts([smsInput]);
    useCaptureStore.getState().approveMonitoredAccount('sms:hdfcbk:ending4321');

    const smsDraft = useCaptureStore.getState().ingestSignal(smsInput);
    const notificationDuplicate = useCaptureStore.getState().ingestSignal({
      source: 'notification',
      rawPayload: { rawPackageName: 'com.google.android.apps.nbu.paisa.user', notificationOwnerId: 'phase3g-user' },
      sourceApp: 'HDFC Bank',
      title: 'Debit alert',
      body: 'Rs 1.00 debited from account for UPI payment to AKSHAY PAINJANE. UPI Ref 555566667777.',
      receivedAt: '2026-06-09T10:02:00.000Z',
    });

    expect(smsDraft.status).toBe('drafted');
    expect(notificationDuplicate.status).toBe('duplicate');
    expect(useCaptureStore.getState().drafts).toHaveLength(1);
  });

  it('does not retain inaccessible notification content', () => {
    useCaptureStore.setState((state) => ({
      settings: {
        ...state.settings,
        autoCaptureEnabled: true,
      },
    }));

    const result = useCaptureStore.getState().ingestSignal({
      source: 'notification',
      sourceApp: 'Messages',
      title: 'Axis Bank',
      body: 'Notification content hidden by Android privacy settings',
      receivedAt: '2026-06-09T10:00:00.000Z',
      rawPayload: { privacyStatus: 'content_hidden', rawPackageName: 'com.google.android.apps.nbu.paisa.user', notificationOwnerId: 'phase3g-user' },
    });

    expect(result.status).toBe('ignored');
    expect(result.reason).toContain('hidden');
    expect(useCaptureStore.getState().drafts).toHaveLength(0);
    expect(useCaptureStore.getState().signals).toEqual([]);
  });

  it('persists separate manual parsing consent in encrypted capture settings, without enabling inbox access', () => {
    useCaptureStore.getState().acceptManualSmsDisclosure();
    const settings = useCaptureStore.getState().settings;
    expect(settings.manualSmsConsentUserId).toBe('phase3g-user');
    expect(settings.manualSmsConsentVersion).toBe('2026-09-30-v1');
    expect(Number.isFinite(Date.parse(settings.manualSmsConsentAcceptedAt!))).toBe(true);
    expect(settings.smsResearchModeEnabled).toBe(false);
    const snapshot = useCaptureStore.persist.getOptions().partialize?.(useCaptureStore.getState());
    expect(snapshot).toMatchObject({ settings: {
      manualSmsConsentUserId: settings.manualSmsConsentUserId,
      manualSmsConsentVersion: settings.manualSmsConsentVersion,
      manualSmsConsentAcceptedAt: settings.manualSmsConsentAcceptedAt,
    } });
  });

  it('records SMS research consent before enabling and clears only unconfirmed SMS research data', () => {
    useCaptureStore.setState((state) => ({
      settings: {
        ...state.settings,
        autoCaptureEnabled: true,
        smsResearchModeEnabled: true,
      },
    }));

    useCaptureStore.getState().acceptSmsResearchExplainer();
    expect(useCaptureStore.getState().settings.smsResearchExplainerAcceptedAt).toBeDefined();

    const smsInput = {
      source: 'sms',
      sender: 'HDFCBK',
      body: 'Rs 321.00 debited from account for UPI payment to SMS CLEAR TEST. UPI Ref 555566667777.',
      receivedAt: '2026-06-09T10:00:00.000Z',
    } as const;
    useCaptureStore.getState().discoverSmsAccounts([smsInput]);
    useCaptureStore.getState().approveMonitoredAccount('sms:hdfcbk:sender');

    const smsDraft = useCaptureStore.getState().ingestSignal(smsInput);
    const notificationDraft = useCaptureStore.getState().ingestSignal({
      source: 'notification',
      rawPayload: { rawPackageName: 'com.google.android.apps.nbu.paisa.user', notificationOwnerId: 'phase3g-user' },
      sourceApp: 'HDFC Bank',
      title: 'Debit alert',
      body: 'Rs 654.00 debited from account for UPI payment to NOTIFICATION KEEP TEST. UPI Ref 555566667778.',
      receivedAt: '2026-06-09T10:05:00.000Z',
    });

    expect(smsDraft.status).toBe('drafted');
    expect(notificationDraft.status).toBe('drafted');

    useCaptureStore.getState().clearSmsResearchData();

    expect(useCaptureStore.getState().drafts).toEqual([
      expect.objectContaining({
        id: notificationDraft.draftId,
        captureSource: 'notification',
      }),
    ]);
    expect(useCaptureStore.getState().signals).toEqual([
      expect.objectContaining({
        id: notificationDraft.signalId,
        source: 'notification',
      }),
    ]);
  });
});
