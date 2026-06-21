import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aiClient } from './aiClient';

const mocks = vi.hoisted(() => ({
  isBackendConfigured: vi.fn(() => true),
  getAiProviderStatus: vi.fn(),
  chatWithAi: vi.fn(),
  getAiTransactionInsights: vi.fn(),
  getAiBudgetCoach: vi.fn(),
}));

vi.mock('./backendApi', () => ({
  isBackendConfigured: mocks.isBackendConfigured,
  backendApi: {
    getAiProviderStatus: mocks.getAiProviderStatus,
    getAiModelStatus: vi.fn(),
    getAiOpsStatus: vi.fn(),
    chatWithAi: mocks.chatWithAi,
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
    mocks.getAiProviderStatus.mockReset();
    mocks.chatWithAi.mockReset();
    mocks.getAiTransactionInsights.mockReset();
    mocks.getAiBudgetCoach.mockReset();
  });

  it('uses a mobile fallback status when the backend AI status route is missing', async () => {
    mocks.getAiProviderStatus.mockRejectedValue(
      Object.assign(new Error('MoneyKai backend route was not found.'), { status: 404 })
    );

    await expect(aiClient.getProviderStatus()).resolves.toMatchObject({
      enabled: true,
      configured: true,
      provider: 'moneykai-mobile',
      attachmentsEnabled: false,
    });
  });

  it('returns a practical local chat reply when the backend AI chat route is missing', async () => {
    mocks.chatWithAi.mockRejectedValue(
      Object.assign(new Error('MoneyKai backend route was not found.'), { status: 404 })
    );

    const response = await aiClient.chat({
      task: 'general_chat',
      messages: [{ role: 'user', content: 'How do I reduce food delivery spend?' }],
    });

    expect(response.provider).toBe('moneykai-mobile');
    expect(response.message).toContain('food delivery spend');
    expect(response.safety.reviewRequired).toBe(true);
  });

  it('keeps local fallback replies from showing hidden prompt style instructions', async () => {
    mocks.chatWithAi.mockRejectedValue(Object.assign(new Error('NOT_FOUND'), { status: 404 }));

    const response = await aiClient.chat({
      task: 'general_chat',
      messages: [
        {
          role: 'user',
          content:
            'How do I reduce food delivery spend?\n\nStyle: Reply in plain, natural text. Do not use Markdown, bold markers, headings, tables, or code formatting. Keep the tone practical and human.',
        },
      ],
    });

    expect(response.message).toContain('food delivery spend');
    expect(response.message).not.toContain('Style:');
    expect(response.message).not.toContain('Markdown');
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
