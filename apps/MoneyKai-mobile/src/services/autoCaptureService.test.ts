import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ingestSmsCapture } from './autoCaptureService';

const mocks = vi.hoisted(() => ({
  isSmsResearchBuildEnabled: vi.fn(),
  ingestSignal: vi.fn(),
  monthlyAllowance: 10000,
}));

vi.mock('@/config/environment', () => ({
  isSmsResearchBuildEnabled: mocks.isSmsResearchBuildEnabled,
}));

vi.mock('@/stores/useCaptureStore', () => ({
  useCaptureStore: {
    getState: () => ({
      ingestSignal: mocks.ingestSignal,
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
});
