# ADR-002: Clients depend inward through typed ports

- Status: Accepted
- Date: 2026-09-21
- Owners: Architecture, domain, API, mobile, web, data, and security owners
- Supersedes: No prior ADR; narrows implementation under ADR-001

## Context

MoneyKai has two supported clients, shared domain and generated API packages, a canonical FastAPI
backend, Firebase identity/data SDKs, and several local persistence and provider integrations. The
repository also contains transitional duplication: the native mobile entry uses React Navigation
while an excluded Expo Router tree remains, stores import persistence directly, network calls are
spread across service modules, and a mobile Firestore service can bypass the intended backend
boundary.

Folder names alone do not stop UI, state, SDK, and financial policy from becoming mutually
dependent. That ambiguity makes correctness, offline recovery, provider replacement, testing, and
authorization harder to prove.

## Decision

MoneyKai remains a modular monolith. Client dependencies point inward:

```text
UI -> application -> domain/ports <- adapters <- platform/provider SDKs
```

- `packages/domain` owns portable financial values, invariants, validation, and reconciliation
  semantics. It has no app, transport, persistence, or provider dependency.
- `packages/api-client` owns the reviewed, generated, runtime-free `/v1` schema types. Each
  supported client has exactly one product-API transport adapter.
- Application use cases own orchestration, including pending/offline/conflict/recovery states.
- Firebase, storage, network, analytics, and native/provider SDKs implement typed ports and are
  wired only at an application composition root.
- Firebase Auth establishes identity; FastAPI verifies identity and authorizes protected actions.
- FastAPI `/v1` is the only authoritative financial-write path. Client Firestore writes, web-edge
  financial handlers, and origin fallback are prohibited.
- Local persistence may hold versioned preferences, drafts, queues, and bounded caches. It is never
  the canonical balance or authorization source.
- The active entry points and migration exceptions are maintained in
  [MoneyKai Application Dependency Direction](../application-dependency-direction.md).

## Allowed Exceptions

Composition roots may import concrete adapters for wiring. Generated API types may retain
generator-owned internals. Existing migration shims may remain only when listed with an owner,
closure task, and no-new-feature rule in the canonical dependency document. A new exception needs
time-bounded risk acceptance and must expire before the milestone gate it affects.

No exception allows duplicate financial rules, canonical client-side financial writes, a second
product API, or credentials in ordinary local storage.

## Consequences

Positive consequences:

- financial behaviour has one portable test surface and one server authority;
- screens and use cases can be tested without Firebase, device, or network SDKs;
- provider and persistence migrations have explicit seams and failure translation;
- offline intent remains distinguishable from canonical server state; and
- import rules and contract drift become enforceable in CI.

Costs and trade-offs:

- current stores/services require incremental extraction and persisted-state migrations;
- an additional port/use-case abstraction is required at real integration seams;
- generated API types do not themselves provide a runtime client; and
- M03 cannot close until transitional paths are removed and CI proves the graph.

The design rejects both a feature-wide service locator and premature microservices. Ports are
capability-specific and introduced where platform replacement, failure translation, or business
authority requires them.

## Migration and Enforcement

M03.2 moves duplicated financial/validation rules to the domain package. M03.3 consolidates the
canonical API path and removes unauthorized parallel paths. M03.4 introduces typed adapters for
Firebase, persistence, network, analytics, and native integrations. M03.5 adds forbidden-import,
entry-point, OpenAPI drift, and platform-leakage CI checks.

Rollback for an individual migration restores the prior adapter behind the same port and persisted
schema compatibility; it never restores a second server authority or client financial write.

## Alternatives Rejected

- **Keep conventions informal:** rejected because existing duplicate routes and direct SDK imports
  show that convention is not an enforceable boundary.
- **Put every concern in shared packages:** rejected because UI/platform behaviour and app-specific
  orchestration would create a cross-client monolith.
- **Let clients write Firestore directly for responsiveness:** rejected because authorization,
  idempotency, lineage, reconciliation, and incident ownership would split.
- **Generate a heavyweight universal runtime client:** rejected for now; the runtime-free schema
  authority plus one transport adapter per app preserves platform-specific cancellation and storage
  without duplicating the contract.
- **Split into microservices:** rejected because present scale and operating capacity do not justify
  distributed data ownership and operational cost.
