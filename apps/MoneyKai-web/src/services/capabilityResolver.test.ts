import { describe, expect, it } from 'vitest';
import { presentCapability, resolveCapability } from './capabilityResolver';
import type { CapabilityStatusResponse } from '@/types/capabilities';

const response: CapabilityStatusResponse = {
  schemaVersion: '2026-08-24',
  generatedAt: '2026-08-24T00:00:00Z',
  capabilities: [
    {
      key: 'financial_documents',
      state: 'unavailable',
      reasonCode: 'DURABLE_STORAGE_REQUIRED',
      message: 'Durable storage is required.',
      retryable: false,
      dependencies: ['durable_object_storage'],
    },
  ],
};

describe('resolveCapability', () => {
  it('returns the server-resolved capability without changing its reason', () => {
    expect(resolveCapability(response, 'financial_documents')).toEqual(response.capabilities[0]);
  });

  it('fails closed when the server omits a sensitive capability', () => {
    expect(resolveCapability(response, 'ai_attachments')).toMatchObject({
      key: 'ai_attachments',
      state: 'unavailable',
      reasonCode: 'CAPABILITY_STATUS_MISSING',
    });
  });

  it('allows degraded capabilities to render with a partial-state disclosure', () => {
    expect(
      presentCapability({
        ...response.capabilities[0],
        state: 'degraded',
        reasonCode: 'PARTIAL_PROVIDER_DATA',
      })
    ).toMatchObject({ kind: 'partial', blocking: false });
  });

  it('blocks unavailable capabilities with a truthful recovery state', () => {
    expect(presentCapability(response.capabilities[0])).toMatchObject({
      kind: 'unavailable',
      blocking: true,
      detail: 'Durable storage is required.',
    });
  });
});
