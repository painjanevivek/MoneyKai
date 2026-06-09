import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Transaction } from '@/types/transaction';
import { useCaptureStore } from './useCaptureStore';

const mocks = vi.hoisted(() => ({
  addTransaction: vi.fn(),
  recordAppNotification: vi.fn(),
}));

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

vi.mock('./useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({
      user: {
        id: 'phase3g-user',
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
      transactions: [] as Transaction[],
    }),
  },
}));

const resetCaptureStore = () => {
  useCaptureStore.setState({
    settings: {
      autoCaptureEnabled: false,
      notificationCaptureEnabled: true,
      reviewNotificationsEnabled: false,
      smsResearchModeEnabled: false,
      notificationAccessStatus: 'unknown',
    },
    signals: [],
    drafts: [],
    merchantRules: [],
  });
};

describe('useCaptureStore production safety controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCaptureStore();
  });

  it('ignores new capture signals after Auto Capture is disabled', () => {
    useCaptureStore.getState().setAutoCaptureEnabled(true);
    useCaptureStore.getState().disableAutoCapture();

    const result = useCaptureStore.getState().ingestSignal({
      source: 'notification',
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
      sourceApp: 'HDFC Bank',
      title: 'Debit alert',
      body: 'A/c debited by Rs 650.00 for UPI payment to CONFIRMED CAFE. UPI Ref 100000000001.',
      receivedAt: '2026-06-09T10:00:00.000Z',
    });
    const pending = useCaptureStore.getState().ingestSignal({
      source: 'notification',
      sourceApp: 'HDFC Bank',
      title: 'Debit alert',
      body: 'Rs 999.00 debited from account for UPI payment to SECOND CAFE. UPI Ref 100000000002.',
      receivedAt: '2026-06-09T10:05:00.000Z',
    });
    const ignored = useCaptureStore.getState().ingestSignal({
      source: 'notification',
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

    const result = useCaptureStore.getState().ingestSignal({
      source: 'sms',
      sender: 'HDFCBK',
      body: 'Rs 321.00 debited from account for UPI payment to SMS TEST CAFE. UPI Ref 555566667777.',
      receivedAt: '2026-06-09T10:00:00.000Z',
      rawPayload: { body: 'should not be used by the manual import path' },
    });

    expect(result.status).toBe('drafted');
    expect(useCaptureStore.getState().drafts).toEqual([
      expect.objectContaining({
        captureSource: 'sms',
        sourceApp: 'HDFCBK',
        status: 'pending',
      }),
    ]);
    expect(useCaptureStore.getState().signals).toEqual([
      expect.objectContaining({
        source: 'sms',
        body: expect.not.stringContaining('555566667777'),
      }),
    ]);
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

    const smsDraft = useCaptureStore.getState().ingestSignal({
      source: 'sms',
      sender: 'HDFCBK',
      body: 'Rs 321.00 debited from account for UPI payment to SMS CLEAR TEST. UPI Ref 555566667777.',
      receivedAt: '2026-06-09T10:00:00.000Z',
    });
    const notificationDraft = useCaptureStore.getState().ingestSignal({
      source: 'notification',
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
