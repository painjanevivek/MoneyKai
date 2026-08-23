import { beforeEach, describe, expect, it, vi } from 'vitest';
import { portfolioApi } from './portfolioApi';

const mocks = vi.hoisted(() => ({
  backendApi: {
    getPortfolioState: vi.fn(),
    createPortfolioHolding: vi.fn(),
    syncPortfolioConnection: vi.fn(),
  },
  localPortfolioApi: {
    getState: vi.fn(),
    createHolding: vi.fn(),
    syncConnection: vi.fn(),
  },
}));

vi.mock('@/config/environment', () => ({ isWealthTabEnabled: () => true }));
vi.mock('./backendApi', () => ({ backendApi: mocks.backendApi }));
vi.mock('./localPortfolioApi', () => ({ localPortfolioApi: mocks.localPortfolioApi }));

describe('portfolioApi containment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retains read-only fallback for a temporarily unavailable backend', async () => {
    const localState = { enabled: true, accounts: [], holdings: [], transactions: [], snapshot: { id: 'local' } };
    mocks.backendApi.getPortfolioState.mockRejectedValue(new Error('Failed to fetch'));
    mocks.localPortfolioApi.getState.mockResolvedValue(localState);

    await expect(portfolioApi.getState()).resolves.toBe(localState);
    expect(mocks.localPortfolioApi.getState).toHaveBeenCalledOnce();
  });

  it('does not turn a failed holding mutation into a local success', async () => {
    const failure = new Error('Network request failed');
    mocks.backendApi.createPortfolioHolding.mockRejectedValue(failure);

    await expect(
      portfolioApi.createHolding({
        assetType: 'equity',
        name: 'Infosys',
        quantity: 1,
        currentValue: 1500,
      })
    ).rejects.toBe(failure);
    expect(mocks.localPortfolioApi.createHolding).not.toHaveBeenCalled();
  });

  it('does not run a local provider sync when the backend sync fails', async () => {
    const failure = new Error('404 provider route not found');
    mocks.backendApi.syncPortfolioConnection.mockRejectedValue(failure);

    await expect(portfolioApi.syncConnection('account-1')).rejects.toBe(failure);
    expect(mocks.localPortfolioApi.syncConnection).not.toHaveBeenCalled();
  });
});
