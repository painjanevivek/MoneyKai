# MoneyKai Application Dependency Direction

**Version:** 1.0.0

**Status:** Canonical for new work; existing exceptions are migration work

**Effective:** 2026-09-21

**Owner:** Architecture owner, with domain, API, mobile, web, security, and data reviewers

## Purpose

This document makes the MoneyKai modular-monolith boundary mechanically understandable. It defines
which runtime entry points are active, which layer may depend on which other layer, where identity,
storage, network, and financial authority live, and how the repository moves from its current mixed
state to the target without creating another implementation path.

It complements, and does not replace:

- [ADR-001: FastAPI owns the canonical product API](decisions/adr-001-canonical-api.md);
- [ADR-002: Clients depend inward through ports](decisions/adr-002-modular-application-boundaries.md);
- [API contract governance](api-contract-governance.md); and
- [Runtime API boundary](runtime-api-boundary.md).

## Supported Runtime Entry Points

| Surface | Active entry | Runtime status | Architectural consequence |
|---|---|---|---|
| Android mobile | `apps/MoneyKai-mobile/index.js` -> `App.tsx` -> `src/navigation/RootNavigator.tsx` | Canonical native client | React Navigation owns reachable routes. `src/app/**` is not a second application entry. |
| Web | `apps/MoneyKai-web/package.json` -> `expo-router/entry` -> `src/app/_layout.tsx` | Canonical browser client | Expo Router route modules are presentation/composition roots, not domain or persistence owners. |
| Android native host | `apps/MoneyKai-mobile/android/` | Platform host for the canonical mobile client | Native modules expose adapters; business rules do not move into Kotlin/Gradle configuration. |
| FastAPI | Sibling private `MoneyKai-backend` deployment under `/v1` | Canonical product API and financial-write boundary | Every protected product request and authoritative financial mutation terminates here. |
| Web edge | root `api/` paths listed in `runtime-api-boundary.md` | Narrow infrastructure boundary | Health, consented analytics, monitoring, and temporary billing only; never financial or identity authority. |
| Flutter | `apps/MoneyKai-flutter/` | Read-only reference, not a supported release client | No production feature is implemented or credited there. Reuse requires an architecture decision. |
| Mobile Expo Router tree | `apps/MoneyKai-mobile/src/app/**` | Unreachable duplicate retained temporarily | No new work. Remove after parity inventory under M03; it must never be registered as a fallback. |
| Root legacy product API sources | root `api/v1/**` where retained | Deployment-excluded compatibility evidence | No imports from clients and no production routing; delete after evidence dependencies are migrated. |

Adding or changing a supported entry point is an architecture decision, not a local convenience.

## Dependency Rule

Dependencies point inward:

```text
UI / route composition
        |
        v
application use cases and state orchestration
        |
        v
domain rules + port interfaces
        ^
        |
outbound adapters (API, storage, auth, analytics, native platform)
        ^
        |
platform and provider SDKs
```

The composition root may construct an adapter and supply it to an application port. That wiring
exception does not let UI or domain code call the adapter directly.

| Layer | Owns | May depend on | Must not depend on |
|---|---|---|---|
| UI / presentation | Rendering, accessible interaction, navigation intent, view-only formatting | Application commands/queries, immutable view models, design primitives | Firebase, `fetch`, AsyncStorage/MMKV, native SDKs, repository implementations, financial calculations |
| Application | Use-case orchestration, state transitions, cancellation, retry policy, conflict/recovery decisions | Domain values/rules and typed ports | React components, route modules, concrete provider SDKs, raw persistence/network APIs |
| Domain | Amounts, currency/date policy, validation, transaction/budget/group invariants, reconciliation semantics, port contracts where business meaning matters | Standard TypeScript only and other domain modules | React/React Native, Expo, Firebase, storage, HTTP, analytics, generated UI state |
| API contract | Reviewed OpenAPI mirror, generated operation/schema types, stable error/idempotency contract | Contract generator/runtime-free types | UI, storage, Firebase, product-specific fallback routing |
| Outbound adapters | Port implementations for API transport, persistence, auth, analytics, providers, and native facilities | Application/domain ports, generated contract types, one concrete SDK | UI ownership, duplicated financial policy, cross-adapter backdoors |
| Platform/provider | Firebase, AsyncStorage/MMKV/secure storage, NetInfo, Sentry, Android modules, HTTP runtime | Vendor/platform SDKs | Domain decisions or direct screen/store ownership |

### Import invariants

1. `packages/domain` imports no app, adapter, generated API, platform, or provider module.
2. `packages/api-client` is the reviewed, generated, runtime-free `/v1` contract authority. Apps do
   not redefine response/request envelopes or hand-maintain competing API types.
3. Screens, route modules, and reusable components do not import Firebase, storage, networking,
   analytics, or native provider libraries.
4. Application code invokes capability-oriented ports; adapters translate vendor failures into
   typed application errors without exposing tokens or provider payloads.
5. Cross-feature imports use a public feature contract, shared domain module, or application port;
   they never reach into another feature's store or adapter internals.
6. A retry or offline queue preserves the same use case and idempotency identity. It is not a second
   write implementation.

## Authority by Concern

| Concern | Authority | Client responsibility | Prohibited parallel authority |
|---|---|---|---|
| Financial rules | `packages/domain` plus corresponding FastAPI domain invariants | Validate for feedback, send typed intent, render canonical result | Screen/store-local balance, rounding, split, settlement, or reconciliation rules |
| Financial records and balances | FastAPI `/v1` backed by tenant-scoped canonical persistence | Maintain explicitly labelled draft/cache state and reconcile with server result | Direct client Firestore financial writes or cache-derived canonical balances |
| API shape | FastAPI OpenAPI, reviewed mirror at `contracts/openapi/v1.json`, generated `packages/api-client` types | One transport adapter per supported app, canonical origin plus `/v1` | Handwritten duplicate schemas, web-origin fallback, feature-specific raw HTTP clients |
| Identity | Firebase Auth issues identity; FastAPI verifies bearer identity and authorizes every protected operation | Auth adapter handles provider flow/session events; secure-token adapter handles approved material | UI/store imports of Firebase, client-only authorization, identity implementation in web edge |
| Local storage | A single storage adapter per storage class | Persist drafts, preferences, queues, and bounded caches with version/migration/ownership metadata | Treating AsyncStorage/MMKV as financial source of truth; arbitrary keys in screens/features |
| Analytics/diagnostics | Typed, consent-aware telemetry port with redaction policy | Emit allow-listed event names and metadata only | Direct SDK calls from UI/domain; amounts, tokens, document content, or identity headers in events |
| Platform capability | Typed adapter for network, permissions, notifications, file access, biometrics, and device APIs | Ask through a use case and present truthful denial/recovery state | Platform imports in domain or route-level business logic |

## API Client and Backend-Only Financial Writes

The OpenAPI document is published from FastAPI and reviewed into
`contracts/openapi/v1.json`. `packages/api-client/src/schema.d.ts` is generated and must not be
hand-edited. The package remains runtime-free: each supported app supplies one HTTP transport
adapter that consumes generated operation/schema types and the canonical error envelope.

All authenticated financial creates, changes, imports, group expenses, budget changes,
reconciliation actions, restore actions, and destructive lifecycle operations go through FastAPI
`/v1`. The server performs authorization, invariant validation, idempotency, canonical persistence,
lineage/audit recording, and response construction. A client may stage an offline intent, but it
must display that state as queued/pending and submit the same idempotent command when connected.

Client-side Firebase access is limited to identity until an explicit, reviewed non-financial read
contract says otherwise. No production client may write canonical financial data directly to
Firestore. Root web-edge functions never proxy or reimplement that write path.

## Storage and Authentication Ownership

Storage is split by data class, not convenience:

- **session credentials:** approved secure-storage adapter only; migration closes in M05;
- **drafts and offline operations:** versioned local adapter with user scope, idempotency identity,
  bounded retention, conflict state, and explicit purge on account/lifecycle events;
- **preferences:** versioned local adapter, never used to authorize or calculate money;
- **bounded cache:** disposable, user-scoped, expiry-aware, and always reconstructable; and
- **canonical records:** server-owned persistence behind FastAPI repositories.

Firebase provider calls live in an auth adapter. Application code sees session/user results and
typed failures such as cancelled, offline, expired, disabled, collision, or revoked. It does not see
Firebase SDK objects. Logout, revocation, account deletion, and user change invalidate every
user-scoped cache/queue through application orchestration.

## Allowed Exceptions

An exception must be explicit, narrow, owner-assigned, tested, and have a removal task. There are
only three standing exception classes:

1. **Composition roots** may import concrete adapters solely to wire them to ports.
2. **Generated contract code** may use generator-owned structures inside `packages/api-client`; it
   remains runtime-free and cannot contain business behaviour.
3. **Migration shims** listed below may remain only until their named M03 task closes. They cannot
   receive new features or grow their dependency surface.

No exception permits direct financial writes, duplicate domain rules, a fallback product API, or
credentials in ordinary local storage. Any new exception requires the governance risk-acceptance
template, an expiry before the relevant milestone gate, and architecture/security approval.

## Current Exceptions and Removal Plan

| Current repository evidence | Classification | Removal / migration path | Closure task |
|---|---|---|---|
| `apps/MoneyKai-mobile/src/app/**` duplicates the active React Navigation surface and is excluded by mobile `tsconfig.json` | Unreachable duplicate entry tree | Confirm behaviour parity, then delete or move non-runtime reference material outside app source | M03.3 |
| Mobile and web stores import AsyncStorage directly | Storage adapter leakage | Introduce typed storage classes and migrations; inject through application persistence boundaries | M03.4 |
| Mobile `services/authService.ts` and `firebase/firebaseConfig.ts` directly own Firebase SDKs | Adapter exists but is not expressed as a port | Preserve provider implementation behind typed auth/session ports; prevent imports outside adapter/composition paths | M03.4 |
| Mobile `services/firestoreService.ts` can access Firestore and financial models | Prohibited canonical-write ambiguity | Move protected operations to the canonical API adapter, verify backend parity, then remove financial client writes | M03.3–M03.4 |
| Web `services/backendApi.ts`, auth gateway, news/currency/provider services, and mobile service clients call `fetch` independently | Network adapters are fragmented | Establish one product API transport per app; keep external public/provider calls as named adapters with separate policy | M03.3–M03.4 |
| Financial/validation helpers exist in stores, services, and app utility files | Domain duplication risk | Inventory equivalence, move rules to `packages/domain`, add contract/fixture tests, then remove callers' copies | M03.2 |
| Root `api/v1/**` compatibility sources remain deployment-excluded | Legacy server implementation evidence | Preserve exclusion while dependent tests migrate; delete only after boundary tests no longer require source | M03.3 |
| Flutter implementation remains in the monorepo | Unsupported client reference | Keep read-only and excluded from product claims; archive/remove only through a separately reviewed decision | Not an M03 runtime migration |

## Enforcement Plan

M03 implements the decision in dependency order:

1. **M03.1 — document:** this contract and ADR establish the authoritative direction.
2. **M03.2 — domain extraction:** identify duplicated financial/validation rules, move one rule at a
   time to `packages/domain`, and prove consumer-equivalent contract fixtures.
3. **M03.3 — API authority:** use generated contract types through one product transport per app,
   remove duplicate route/fallback paths, and prove all canonical financial writes terminate at
   FastAPI.
4. **M03.4 — ports/adapters:** isolate auth, storage, network, analytics, and native/provider SDKs;
   migrate persisted state without data loss and translate failures at the boundary.
5. **M03.5 — mechanical controls:** add dependency-cruiser/ESLint or an equivalent import graph
   check, OpenAPI drift verification, entry-point assertions, forbidden raw-network/platform import
   rules, and focused negative fixtures. CI must identify the importing file and violated rule.

The M03 gate requires zero unapproved architecture violations, the `API-01` production gate, all
affected type/test/contract suites, and durable evidence at the reviewed revision. Documentation is
not evidence that later migration or enforcement tasks have passed.

## Review Checklist

- Is the change reached through a supported entry point?
- Does each dependency point inward, with adapter wiring confined to a composition root?
- Is financial meaning owned by the shared domain and canonical backend rather than UI/state code?
- Does a protected mutation use the generated contract, canonical origin, authorization, and an
  idempotency identity?
- Is local state visibly draft, queued, or cached rather than presented as canonical?
- Can platform/provider code be replaced by a fake through a typed port?
- Did the change avoid extending a listed migration shim?
- Do the relevant boundary, contract, negative, migration, and recovery checks pass?
