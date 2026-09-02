# API contract governance

## Authority and publication

The private FastAPI repository is the source of truth for the MoneyKai `/v1` OpenAPI document. Its compatibility gate rejects removed operations or success shapes, type changes, enum narrowing, and newly required inputs unless an intentional baseline change is reviewed.

The client repository publishes the reviewed schema as `contracts/openapi/v1.json`. A pinned `openapi-typescript` version generates `packages/api-client/src/schema.d.ts`; hand-editing generated output is prohibited. `npm run api-client:check` runs generation in check mode and compiles the package, and both pull-request workflows enforce that gate.

The package is runtime-free. Consumers import only the paths, operations, and schema types they use. This avoids shipping schema-generation code or a second request implementation to browsers.

## Compatibility and deployment

Backward-compatible fields and responses may be added within v1. Removing a field, narrowing an enum, adding a required request input, changing an operation, or changing error semantics requires one of:

1. a new versioned route with a measured migration window;
2. a dual-read/dual-write compatibility adapter with an explicit removal date; or
3. a coordinated pre-release baseline update when the affected capability is disabled and no supported client depends on the old contract.

The AI policy acknowledgement uses the third path: AI is disabled by default, the web client is deployed first because the older backend safely ignores the additional field, and the consent-enforcing backend follows only after the web deployment is healthy. Rollback restores the prior backend while keeping AI disabled; it never silently infers consent.

## Error contract

FastAPI errors expose a stable `error.code`, redacted `error.message`, and `error.requestId`. The legacy `detail` member remains during the v1 migration window. The web client prefers the canonical envelope, preserves code/request ID for support, and continues to understand legacy validation details.

Unhandled exceptions return a generic message and metadata-only structured event. Provider errors, tokens, prompts, document text, financial values, and stack-local secrets are not returned to clients.
