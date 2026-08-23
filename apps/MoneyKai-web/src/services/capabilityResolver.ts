import { backendApi } from './backendApi';
import type {
  CapabilityKey,
  CapabilityStatus,
  CapabilityStatusResponse,
} from '@/types/capabilities';

export interface CapabilityPresentation {
  kind: 'ready' | 'partial' | 'restricted' | 'unavailable';
  blocking: boolean;
  headline: string;
  detail: string;
}

const CACHE_TTL_MS = 30_000;
let cachedResponse: CapabilityStatusResponse | null = null;
let cachedAt = 0;
let inFlight: Promise<CapabilityStatusResponse> | null = null;

export const resolveCapability = (
  response: CapabilityStatusResponse,
  key: CapabilityKey,
): CapabilityStatus =>
  response.capabilities.find((capability) => capability.key === key) ?? {
    key,
    state: 'unavailable',
    reasonCode: 'CAPABILITY_STATUS_MISSING',
    message: 'This capability is unavailable because the server did not return a verified status.',
    retryable: true,
    dependencies: ['capability_status'],
  };

export const presentCapability = (capability: CapabilityStatus): CapabilityPresentation => {
  if (capability.state === 'available') {
    return { kind: 'ready', blocking: false, headline: 'Capability ready', detail: capability.message };
  }
  if (capability.state === 'degraded') {
    return { kind: 'partial', blocking: false, headline: 'Limited capability', detail: capability.message };
  }
  if (capability.state === 'unavailable') {
    return { kind: 'unavailable', blocking: true, headline: 'Capability unavailable', detail: capability.message };
  }
  return {
    kind: 'restricted',
    blocking: true,
    headline: capability.state === 'disabled' ? 'Capability disabled' : 'Setup required',
    detail: capability.message,
  };
};

export const loadCapabilityStatus = async (options: { force?: boolean } = {}): Promise<CapabilityStatusResponse> => {
  const now = Date.now();
  if (!options.force && cachedResponse && now - cachedAt < CACHE_TTL_MS) {
    return cachedResponse;
  }
  if (!options.force && inFlight) {
    return inFlight;
  }

  inFlight = backendApi.getCapabilities();
  try {
    cachedResponse = await inFlight;
    cachedAt = Date.now();
    return cachedResponse;
  } finally {
    inFlight = null;
  }
};

export const loadCapability = async (
  key: CapabilityKey,
  options: { force?: boolean } = {},
): Promise<CapabilityStatus> => resolveCapability(await loadCapabilityStatus(options), key);

export const clearCapabilityCache = (): void => {
  cachedResponse = null;
  cachedAt = 0;
  inFlight = null;
};
