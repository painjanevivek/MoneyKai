import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aiClient } from './aiClient';

const mocks = vi.hoisted(() => ({
  isBackendConfigured: vi.fn(() => true),
  getAiTransactionInsights: vi.fn(),
  getAiBudgetCoach: vi.fn(),
}));

vi.mock('./backendApi', () => ({
  isBackendConfigured: mocks.isBackendConfigured,
  backendApi: {
    getAiProviderStatus: vi.fn(),
    getAiModelStatus: vi.fn(),
    getAiOpsStatus: vi.fn(),
    chatWithAi: vi.fn(),
    uploadAiAttachment: vi.fn(),
    analyzeAiAttachment: vi.fn(),
    summarizeAiDocument: vi.fn(),
    getAiTransactionInsights: mocks.getAiTransactionInsights,
    getAiBudgetCoach: mocks.getAiBudgetCoach,
  },
}));

describe('aiClient', () => {
  beforeEach(() => {
    mocks.isBackendConfigured.mockReturnValue(true);
    mocks.getAiTransactionInsights.mockReset();
    mocks.getAiBudgetCoach.mockReset();
  });

  it('delegates transaction insights requests to the backend client', async () => {
    const payload = {
      month: '2026-06',
      totalSpent: 1200,
      totalIncome: 3000,
      categoryTotals: [{ category: 'food', total: 400 }],
    };
    const response = {
      requestId: 'req-insights',
      cards: [],
      reviewRequired: true as const,
      source: 'deterministic' as const,
      cached: false,
      model: null,
    };
    mocks.getAiTransactionInsights.mockResolvedValue(response);

    await expect(aiClient.getTransactionInsights(payload)).resolves.toEqual(response);
    expect(mocks.getAiTransactionInsights).toHaveBeenCalledWith(payload);
  });

  it('delegates budget coach requests to the backend client', async () => {
    const payload = {
      month: '2026-06',
      monthlyAllowance: 10000,
      totalSpent: 4200,
      daysElapsed: 12,
      daysRemaining: 18,
      categoryTotals: [{ category: 'food', total: 900 }],
    };
    const response = {
      requestId: 'req-budget',
      cards: [],
      reviewRequired: true as const,
      source: 'ai' as const,
      cached: false,
      model: 'test-model',
    };
    mocks.getAiBudgetCoach.mockResolvedValue(response);

    await expect(aiClient.getBudgetCoach(payload)).resolves.toEqual(response);
    expect(mocks.getAiBudgetCoach).toHaveBeenCalledWith(payload);
  });

  it('fails fast when the backend is not configured', async () => {
    mocks.isBackendConfigured.mockReturnValue(false);

    await expect(
      aiClient.getBudgetCoach({
        month: '2026-06',
        monthlyAllowance: 10000,
        totalSpent: 4200,
        daysElapsed: 12,
        daysRemaining: 18,
        categoryTotals: [],
      })
    ).rejects.toThrow('AI needs the MoneyKai backend to be configured.');
  });
});
