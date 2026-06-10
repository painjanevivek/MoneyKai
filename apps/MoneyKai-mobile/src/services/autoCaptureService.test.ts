import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ingestSmsCapture, importRecentSmsTransactionsFromInbox } from './autoCaptureService';

const mocks = vi.hoisted(() => ({
  isSmsResearchBuildEnabled: vi.fn(),
  importRecentNativeSmsTransactions: vi.fn(),
  ingestSignal: vi.fn(),
  confirmDraft: vi.fn(),
  drafts: [] as Array<{ id: string; category?: string }>,
  monthlyAllowance: 10000,
}));

vi.mock('@/config/environment', () => ({
  isSmsResearchBuildEnabled: mocks.isSmsResearchBuildEnabled,
}));

vi.mock('@/services/nativeCaptureBridge', () => ({
  importRecentNativeSmsTransactions: mocks.importRecentNativeSmsTransactions,
}));

vi.mock('@/stores/useCaptureStore', () => ({
  useCaptureStore: {
    getState: () => ({
      ingestSignal: mocks.ingestSignal,
      confirmDraft: mocks.confirmDraft,
      drafts: mocks.drafts,
    }),
  },
}));

vi.mock('@/stores/useBudgetStore', () => ({
  useBudgetStore: {
    getState: () => ({
      settings: {
        monthly_allowance: mocks.monthlyAllowance,
      },
    }),
  },
}));

describe('autoCaptureService SMS research gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.monthlyAllowance = 10000;
    mocks.drafts = [];
  });

  it('ignores SMS signals when the research build flag is disabled', () => {
    mocks.isSmsResearchBuildEnabled.mockReturnValue(false);

    const result = ingestSmsCapture({
      sender: 'HDFCBK',
      body: 'Rs 321.00 debited from account for UPI payment to TEST SHOP.',
      receivedAt: '2026-06-09T10:00:00.000Z',
    });

    expect(result).toEqual({ status: 'ignored', reason: 'sms research build is disabled' });
    expect(mocks.ingestSignal).not.toHaveBeenCalled();
  });

  it('routes SMS signals through capture only for explicitly enabled research builds', () => {
    mocks.isSmsResearchBuildEnabled.mockReturnValue(true);
    mocks.ingestSignal.mockReturnValue({ status: 'ignored', reason: 'sms capture is research-only' });

    const result = ingestSmsCapture({
      sender: 'HDFCBK',
      body: 'Rs 321.00 debited from account for UPI payment to TEST SHOP.',
      receivedAt: '2026-06-09T10:00:00.000Z',
    });

    expect(result).toEqual({ status: 'ignored', reason: 'sms capture is research-only' });
    expect(mocks.ingestSignal).toHaveBeenCalledWith({
      source: 'sms',
      sender: 'HDFCBK',
      body: 'Rs 321.00 debited from account for UPI payment to TEST SHOP.',
      receivedAt: '2026-06-09T10:00:00.000Z',
    });
  });

  it('blocks SMS import until a monthly budget exists', () => {
    mocks.isSmsResearchBuildEnabled.mockReturnValue(true);
    mocks.monthlyAllowance = 0;

    const result = ingestSmsCapture({
      sender: 'HDFCBK',
      body: 'Rs 321.00 debited from account for UPI payment to TEST SHOP.',
      receivedAt: '2026-06-09T10:00:00.000Z',
    });

    expect(result).toEqual({ status: 'ignored', reason: 'set a monthly budget before fetching transactions' });
    expect(mocks.ingestSignal).not.toHaveBeenCalled();
  });

  it('imports recent inbox SMS and confirms categorized drafts', async () => {
    mocks.isSmsResearchBuildEnabled.mockReturnValue(true);
    mocks.importRecentNativeSmsTransactions.mockResolvedValue({
      status: 'imported',
      importedCount: 2,
      scannedCount: 4,
      ignoredCount: 2,
      signals: [
        {
          source: 'sms',
          sender: 'AX-HDFCBK',
          body: 'Rs 321.00 debited from account for UPI payment to TEST SHOP.',
          receivedAt: '2026-06-09T10:00:00.000Z',
        },
        {
          source: 'sms',
          sender: 'VK-ICICIB',
          body: 'Rs 99.00 debited from account at CAFE.',
          receivedAt: '2026-06-08T10:00:00.000Z',
        },
      ],
    });
    mocks.ingestSignal
      .mockReturnValueOnce({ status: 'drafted', draftId: 'draft_1', reason: 'matched category keyword' })
      .mockReturnValueOnce({ status: 'drafted', draftId: 'draft_2', reason: 'needs category review' });
    mocks.drafts = [
      { id: 'draft_1', category: 'shopping' },
      { id: 'draft_2' },
    ];
    mocks.confirmDraft.mockReturnValue(true);

    const summary = await importRecentSmsTransactionsFromInbox();

    expect(summary).toMatchObject({
      status: 'imported',
      scannedCount: 4,
      nativeImportedCount: 2,
      nativeIgnoredCount: 2,
      draftedCount: 2,
      confirmedCount: 1,
      pendingReviewCount: 1,
    });
    expect(mocks.confirmDraft).toHaveBeenCalledWith('draft_1', 'shopping');
  });
});
