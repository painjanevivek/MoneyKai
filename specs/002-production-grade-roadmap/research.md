# Research and Decisions

## R01 — Isolated roadmap delivery

**Decision**: create `codex/production-roadmap` from `origin/main` in an isolated worktree and commit only this specification directory.

**Rationale**: the primary worktree contains a substantial mobile redesign and two local commits ahead of `origin/main`. Isolation prevents accidental staging or coupling.

**Alternatives considered**: commit on dirty `main`; bundle roadmap and application changes. Both weaken reviewability and violate the approved boundary.

## R02 — Expo SDK 56 is version-pinned guidance

**Decision**: use the exact SDK 56 documentation for Expo implementation. Its reference targets Android API 36 and Android 7+.

**Rationale**: the repository uses Expo SDK 56 and EAS-related configuration. Version-pinned guidance avoids incompatible latest-version assumptions.

**Sources**: [Expo SDK 56](https://docs.expo.dev/versions/v56.0.0/), [EAS configuration](https://docs.expo.dev/build/eas-json/).

## R03 — Bruno is the Git-native API assurance layer

**Decision**: add Bruno in M09 with committed collections, safe environment placeholders, negative tests, golden-journey orchestration, and CI reports.

**Rationale**: Bruno collections are file-based and reviewable, run through CLI automation, and complement OpenAPI and application tests.

**Alternatives considered**: manual-only testing, cloud-only collections, or replacing all API tests. None provides the required repository ownership and coverage balance.

**Sources**: [Bruno CI use cases](https://docs.usebruno.com/agents/use-cases), [Bruno variables](https://docs.usebruno.com/v2/variables/interpolation).

## R04 — Firebase remains the identity foundation

**Decision**: use Firebase Google sign-in and explicit provider linking with one stable user identity. Demo authentication is excluded from production.

**Rationale**: this preserves MoneyKai web parity. Linking collisions and data merge behavior require explicit recovery tests.

**Source**: [Firebase Android account linking](https://firebase.google.com/docs/auth/android/account-linking).

## R05 — AAB is the Play artifact; APK is for QA

**Decision**: submit a signed AAB through Play App Signing; use APKs for local, preview, and physical-device QA. Re-check store policy before every submission.

**Rationale**: the production EAS profile already specifies `app-bundle`. On the roadmap date, new apps/updates must target API 36; SDK 56 aligns with that level.

**Sources**: [Play target API](https://developer.android.com/google/play/requirements/target-sdk), [Expo SDK 56 platform matrix](https://docs.expo.dev/versions/v56.0.0/).

## R06 — Play Integrity uses tiered enforcement

**Decision**: verify request-bound Play Integrity signals server-side for high-value actions and use tiered remediation.

**Rationale**: integrity is an anti-abuse input, not a replacement for authentication/authorization; strongest-integrity-only blocking can exclude legitimate users.

**Source**: [Play Integrity overview](https://developer.android.com/google/play/integrity/overview).

## R07 — Progressive disclosure protects comprehension

**Decision**: show current financial state and the primary action immediately; disclose advanced controls and education on demand. Never conceal risk, privacy, cost, destructive consequence, or sync state.

**Rationale**: trust comes from understandable state and consequences, not removing necessary information.

## R08 — Solid visual system with bounded glass

**Decision**: centralize a lime/olive/cream/warm-off-white/near-black palette, exclude gradients and dark mode, and restrict glass to legible navigation/transient surfaces.

**Rationale**: this implements the approved calm premium direction while keeping contrast measurable.

## R09 — Atomic commits and evidence-based closure

**Decision**: every file-changing task receives one focused commit/push; each milestone receives a completion commit only when status/evidence changes. No empty commits.

**Rationale**: history remains reviewable, reversible, and auditable.

## R10 — Staged production is controlled exposure

**Decision**: use 5%, 20%, 50%, and 100% Play stages with observation windows, stop conditions, incident ownership, and rollback readiness.

**Rationale**: staged exposure limits blast radius and makes telemetry an explicit release decision.
