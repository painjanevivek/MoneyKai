import type { components, operations, paths } from './schema';

export type ApiComponents = components;
export type ApiOperations = operations;
export type ApiPaths = paths;

export type ApiErrorEnvelope = components['schemas']['ApiErrorEnvelope'];
export type AiPolicyAcknowledgement = components['schemas']['AiPolicyAcknowledgement'];
export type PublicAiChatRequest = components['schemas']['PublicAiChatRequest'];
