import { beforeEach, describe, expect, it, vi } from 'vitest';
import { backendApi } from './backendApi';

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
});
