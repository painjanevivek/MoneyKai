# Implementation Plan: MoneyKai Production-to-MNC Program

**Branch**: `codex/production-roadmap` | **Date**: 2026-09-21 | **Spec**: [spec.md](./spec.md)

## Summary

Execute a gated program from governance and product definition through Android Play production, product-market fit, and MNC-grade operations. Preserve the monorepo's mobile, web, domain, API-client, Firebase, security, and release investments; add a canonical milestone/evidence model; and introduce Bruno as one layer in a broader quality matrix.

## Technical Context

**Language/Version**: TypeScript 6, Node.js 22.13+, Kotlin/Gradle for Android integration

**Primary Dependencies**: React 19, React Native 0.85, Expo SDK 56 where used, Firebase Auth/Firestore, Zod, Zustand, Sentry, OpenAPI-generated client

**Storage**: Firestore/canonical backend persistence, MMKV/AsyncStorage caches, repository evidence files

**Testing**: Vitest, Node test, Playwright, Cypress, Gradle/device checks, Firebase/security scripts, and planned Bruno CLI

**Target Platform**: Android 7+ during SDK 56 compatibility and Google Play first; modern web browsers; iOS portability without an M16 iOS release

**Project Type**: Mobile + web monorepo with shared domain/API packages and an externally invoked backend

**Performance Goals**: cold-start p75 at most 2.5 seconds on the reference low-end device; local interaction response p95 at most 150 ms; API budgets in the gate contract

**Constraints**: offline-capable financial workflows, strict privacy, no production auth bypass, no gradients/dark mode, current Play target API, durable evidence

**Scale/Scope**: 20 sequential milestones across product, engineering, security, release, growth, support, and operations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The repository constitution is currently an unratified template. M00 makes ratification an explicit gate. Until then, these approved constraints are binding:

- Preserve user work and isolate roadmap changes from the dirty mobile worktree.
- Use the exact Expo SDK 56 documentation before Expo implementation.
- Keep contracts typed, modules cohesive, dependencies one-directional, and platform integrations isolated.
- Require tests and durable evidence proportional to financial, privacy, security, and release risk.
- Never commit credentials, production tokens, signing material, or demo bypasses.
- Do not close milestones using empty commits or unverified claims.

**Pre-research gate**: PASS. No unresolved decision is required to author the roadmap.

**Post-design gate**: PASS. Research, milestone entities, interface contracts, validation, and tasks are defined.

## Project Structure

### Documentation (this feature)

```text
specs/002-production-grade-roadmap/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
└── contracts/
    └── production-gates.md
```

### Source Code (repository root)

```text
apps/MoneyKai-mobile/     Android-first React Native product and release surface
apps/MoneyKai-web/        Web experience and Expo SDK 56 surface
packages/domain/          Shared financial and product rules
packages/api-client/      Generated canonical OpenAPI client
contracts/openapi/        Versioned API authority
firebase*.json/rules      Firebase configuration and policy boundaries
scripts/                  Quality, release, security, backup, and backend runners
.github/workflows/        Required CI and release gates
api-tests/                Planned Bruno collections and safe environments
docs/operations/          Operational evidence and runbooks
```

**Structure decision**: retain and strengthen the existing monorepo. Do not create a parallel app or duplicate financial rules. Bruno consumes the canonical API and is never a runtime dependency or source of API truth.

## Delivery Strategy

- Merge this documentation-only roadmap first.
- Execute each milestone on a short-lived `codex/mNN-description` branch from updated `origin/main`.
- Complete and push one focused commit per file-changing task after focused validation.
- Close a milestone only after prerequisites, evidence, and required gates pass.

## Architecture and Data Flow

1. Mobile/web UIs call shared domain rules and the generated API client.
2. The canonical backend authorizes/persists remote data; retained Firebase access remains deny-by-default.
3. Client caches expose pending, synchronized, failed, conflicted, and recovered states.
4. OpenAPI checks and Bruno black-box suites verify complementary contract properties.
5. Sentry, server telemetry, Play vitals, and operational dashboards provide launch evidence.

## Design, Reliability, and Security

- Centralize color, spacing, typography, elevation, motion, shape, and icon tokens.
- Use solid lime/olive/cream/warm-off-white/near-black; no gradients or dark mode.
- Restrict glass to readable compact navigation/transient surfaces.
- Keep primary jobs, financial status, and consequences visible; progressively disclose secondary detail.
- Represent money deterministically and centralize currency, rounding, and time-zone behavior.
- Require idempotency, bounded retries, cancellation, cursors, conflict semantics, and explicit offline state.
- Keep demo login non-production; use provider linking without silent duplicate identities.
- Apply request-bound Play Integrity with tiered server-side enforcement for high-value actions.

## Rollout

1. M00-M09 establish governance, contracts, trust, security, reliability, and API assurance.
2. M10-M13 certify the product and golden journey.
3. M14-M15 validate internal and closed-beta health.
4. M16 rolls out through 5%, 20%, 50%, and 100%.
5. M17-M19 develop product-market fit, MNC operations, and category leadership without weakening production gates.

Rollback is mandatory whenever a stop condition in [production-gates.md](./contracts/production-gates.md) is met.

## Complexity Tracking

No new runtime application, backend, or data authority is introduced. Bruno is a black-box test surface. The process structure is justified by financial correctness, privacy, security, and Play evidence requirements.
