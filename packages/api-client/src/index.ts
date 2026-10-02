import type { components, operations, paths } from './schema';

export type ApiComponents = components;
export type ApiOperations = operations;
export type ApiPaths = paths;
export type SyncConsent = components['schemas']['SyncConsent'];
export type SyncAvailability = components['schemas']['SyncAvailability'];
export type ImportJob = components['schemas']['ImportJob'];
export type ImportProgress = components['schemas']['ImportProgress'];
export type ApprovedTransactionBatch = components['schemas']['ApprovedTransactionBatch'];
export type BatchReceipt = components['schemas']['BatchReceipt'];

export type ApiErrorEnvelope = components['schemas']['ApiErrorEnvelope'];
export type AiPolicyAcknowledgement = components['schemas']['AiPolicyAcknowledgement'];
export type PublicAiChatRequest = components['schemas']['PublicAiChatRequest'];
