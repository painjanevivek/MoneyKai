import { beforeEach, describe, expect, it, vi } from 'vitest';
import { backendApi, BackendApiError } from './backendApi';

vi.mock('@/config/environment', () => ({ getBackendBaseUrl: () => 'https://backend.example.test' }));
vi.mock('./firebase', () => ({
  firebaseAuth: {
    currentUser: {
      getIdToken: vi.fn(async () => 'firebase-token'),
    },
  },
}));

describe('backend API authority headers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('adds correlation to reads and idempotency to durable mutations only', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ schemaVersion: '2026-08-24', generatedAt: 'now', capabilities: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ item: { id: 'holding-1' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    await backendApi.getCapabilities();
    await backendApi.createPortfolioHolding({
      assetType: 'equity',
      name: 'Infosys',
      quantity: 1,
      currentValue: 1500,
    });

    const readHeaders = fetchMock.mock.calls[0][1].headers as Headers;
    const mutationHeaders = fetchMock.mock.calls[1][1].headers as Headers;
    expect(readHeaders.get('X-Correlation-Id')).toBeTruthy();
    expect(readHeaders.get('Idempotency-Key')).toBeNull();
    expect(mutationHeaders.get('X-Correlation-Id')).toBeTruthy();
    expect(mutationHeaders.get('Idempotency-Key')).toBeTruthy();
  });

  it('preserves canonical error codes and request ids from the API envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'The request did not satisfy the API contract.',
              requestId: 'request-from-body',
            },
            detail: [],
          }),
          { status: 422, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    const request = backendApi.getCapabilities();

    await expect(request).rejects.toBeInstanceOf(BackendApiError);
    await expect(request).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      correlationId: 'request-from-body',
      message: 'The request did not satisfy the API contract.',
    });
  });

  it('preserves a caller-supplied idempotency key for operation retries', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          item: { data: {}, settings: {} },
          restored: false,
          operation: { status: 'retryable' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await backendApi.restoreLatestBackup('restore-stable-key');

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get('Idempotency-Key')).toBe('restore-stable-key');
  });

  it('encodes bounded continuation and incremental sync cursors', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [], page: { hasMore: false } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ events: [], page: { hasMore: false } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await backendApi.getBootstrapPage('transactions', '2026-08-24T00:00:00Z', 'signed cursor');
    await backendApi.getIncrementalSync('sync token', 'page cursor', '2026-08-24T00:01:00Z');

    expect(fetchMock.mock.calls[0][0]).toContain(
      '/v1/bootstrap/pages/transactions?captured_at=2026-08-24T00%3A00%3A00Z&cursor=signed+cursor',
    );
    expect(fetchMock.mock.calls[1][0]).toContain(
      '/v1/sync?sync_token=sync+token&cursor=page+cursor&window_end=2026-08-24T00%3A01%3A00Z',
    );
  });

  it('preserves review filters and stable action idempotency', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [], page: { hasMore: false } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ item: {}, receipt: {} }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await backendApi.listReviewItems({ status: 'pending', source: 'sms' }, 25, 'signed cursor');
    await backendApi.actionReviewItem('review/1', { action: 'ignore', expectedRevision: 2 }, 'review-stable-key');

    expect(fetchMock.mock.calls[0][0]).toContain(
      '/v1/reviews?limit=25&status=pending&source=sms&cursor=signed+cursor',
    );
    expect(fetchMock.mock.calls[1][0]).toContain('/v1/reviews/review%2F1/actions');
    const headers = fetchMock.mock.calls[1][1].headers as Headers;
    expect(headers.get('Idempotency-Key')).toBe('review-stable-key');
  });

  it('preserves recurring-obligation filters and stable decision idempotency', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [], page: { hasMore: false } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ item: {}, receipt: {} }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const candidate = {
      id: 'recurring_a1b2c3d4',
      label: 'House rent',
      category: 'rent',
      type: 'expense' as const,
      amount: 20_000,
      cadence: 'monthly' as const,
      nextDueDate: '2026-09-01',
      sourceTransactionIds: ['txn-1', 'txn-2'],
      confidence: 'estimated' as const,
    };

    await backendApi.listRecurringObligations('confirmed', 25, 'planning cursor');
    await backendApi.decideRecurringObligation(candidate, 'confirm', 0, 'planning-stable-key');

    expect(fetchMock.mock.calls[0][0]).toContain(
      '/v1/planning/recurring-obligations?limit=25&status=confirmed&cursor=planning+cursor',
    );
    expect(fetchMock.mock.calls[1][0]).toContain('/v1/planning/recurring-obligations/recurring_a1b2c3d4/decision');
    const headers = fetchMock.mock.calls[1][1].headers as Headers;
    expect(headers.get('Idempotency-Key')).toBe('planning-stable-key');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toEqual({
      action: 'confirm',
      expectedRevision: 0,
      candidate: {
        label: 'House rent',
        category: 'rent',
        type: 'expense',
        amount: 20_000,
        cadence: 'monthly',
        nextDueDate: '2026-09-01',
        sourceTransactionIds: ['txn-1', 'txn-2'],
        confidence: 'estimated',
      },
    });
  });

  it('keeps Gmail sync consent and disconnect contracts aligned with backend v1', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            scannedMessageCount: 0,
            financialEmailCount: 0,
            ignoredEmailCount: 0,
            needsReviewCount: 0,
            query: 'statement',
            items: [],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ disconnected: true, revocationPending: false, retryable: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await backendApi.syncGmail({
      metadataScanAcceptedAt: '2026-06-13T00:00:00Z',
      allowedCategories: ['bank_statement'],
      syncWindow: '30d',
      maxResults: 25,
    });
    const disconnect = await backendApi.disconnectGmail();

    expect(fetchMock.mock.calls[0][0]).toContain('/v1/gmail/sync');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
      metadataScanAcceptedAt: '2026-06-13T00:00:00Z',
      allowedCategories: ['bank_statement'],
      syncWindow: '30d',
      maxResults: 25,
    });
    expect((fetchMock.mock.calls[0][1].headers as Headers).get('Idempotency-Key')).toBeTruthy();
    expect(fetchMock.mock.calls[1][0]).toContain('/v1/gmail/disconnect');
    expect(disconnect).toEqual({ disconnected: true, revocationPending: false, retryable: false });
  });
});
