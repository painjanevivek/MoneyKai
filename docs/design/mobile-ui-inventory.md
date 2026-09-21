# MoneyKai Android V1 UI Inventory and Rebuild Map

**Version:** 1.0.0

**Status:** Approved implementation baseline for M02

**Captured:** 2026-09-21

**Owner:** Mobile / design system

**Product boundary:** [Android V1 Launch Scope](../product/android-v1-scope.md)

## Decision

MoneyKai will redesign the active React Navigation application in place. The existing feature and
service behaviour remains intact, but production navigation, presentation, and interaction patterns
will be rebuilt around one light-only token system and one progressively disclosed V1 journey.

The unused Expo Router tree is not a second production surface. It is inventory-only input for M02
and must be removed or isolated under M03 after active behaviour has an explicit owner. The preserved
dirty mobile redesign is also reference material only: useful patterns may be rebuilt selectively,
but its 51 changed and 16 untracked mobile paths are not merged wholesale.

## Runtime Surface

`apps/MoneyKai-mobile/index.js` registers `App.tsx`. `App.tsx` mounts `RootNavigator`, so the active
application is the React Navigation tree under `src/navigation/` and `src/screens/`. Files under
`src/app/` import Expo Router but are not reached from the registered native entry point.

### Active route disposition

| Current route | V1 disposition | Always visible | Progressively disclosed | Required state coverage |
|---|---|---|---|---|
| Login | Rebuild and certify | Google sign-in, email sign-in entry, value/trust summary, recovery | Password form, account creation, policy detail, demo access in non-production only | Restoring, submitting, cancelled, validation, provider collision, offline, error |
| Sign up | Retain as secondary auth route | Identity choice and consequence | Password requirements and policy detail | Validation, submitting, collision, offline, error, success |
| Forgot password | Retain as recovery route | Recovery outcome and destination | Troubleshooting/support | Validation, submitting, offline, error, success |
| Home | Rebuild as monthly overview | Income, expense, budget remaining, recent records, sync status | Calculation detail, older records, secondary insight | Loading, empty, offline, pending, synced, failed, retry |
| Transactions | Rebuild and certify | Records, search, add/import entry, balance consequence | Filters, edit/delete, duplicate/invalid import detail | Loading, empty, validation, offline, conflict, error, success, retry |
| Add | Rebuild as focused composer | Expense/income choice, amount, date, category, payment method, consequence | Optional note and additional metadata | Draft, validation, offline queued, submitting, error, success |
| Budget | Rebuild and certify | Period, total, spent, remaining/over, category limits | Source records and edit history | Loading, empty, validation, offline, conflict, error, success |
| More | Rebuild as secondary hub | Groups, Trust Center, account, support | Export/deletion, diagnostics, settings | Loading, permission denial, offline, error, success |
| Groups | Rebuild and certify | Membership, group expenses, participant positions, settlement history | Split calculation and member management | Loading, empty, unauthorized, offline, conflict, error, success |
| Settings | Retain only approved preferences | Notifications, haptics, app lock where supported | Currency remains INR-locked; diagnostics/support | Loading, permission denial, error, success |
| Profile edit | Rename/reframe as Account | Verified identity, provider state, sign out | Profile edits, linking/revocation/recovery | Loading, validation, disabled/deleted, offline, error, success |
| Notifications | Retain only operational notices | Sync/security/lifecycle notices | Read history | Loading, empty, error, success |
| Notes | Remove from V1 navigation | None | None | Existing data must remain recoverable during migration |
| Learn | Replace with contextual help/support | Support and recovery entry | Educational detail from the relevant task | Loading, offline, error |
| Savings | Remove from V1 navigation | None | None | Existing data must not be destroyed |
| AI review | Exclude from production V1 | None | Research builds only if visibly labelled and isolated | No production path |
| Auto capture | Exclude from production V1 | None | Research builds only if visibly labelled and isolated | No production path or sensitive permission |
| Subscriptions | Exclude from production V1 | None | None | No dead production route |

### Unreachable duplicate tree

The Expo Router tree contains 23 TSX routes, including alternate Home, Transactions, Budget,
Settings, notifications, accounts, auto-capture, AI, portfolio, wealth, savings, public/legal, and
navigation-shell implementations. It duplicates route ownership and exposes multiple non-goal
concepts. M02 will not extend it. M03 must remove or explicitly isolate it after behaviour parity is
confirmed.

## Component and Style Inventory

The source baseline contains 251 TypeScript/TSX files. A diagnostic scan found:

| Finding | Baseline | Required response |
|---|---:|---|
| Raw hex literals in `src` | 498 occurrences across 29 files | Move production visual values into semantic tokens; retain only documented brand/data exceptions |
| Inline style object signatures | 1,838 diagnostic matches | Replace repeated production patterns with focused components/tokens; do not mechanically rewrite one-off layout |
| Dark/theme references | 170 diagnostic matches | Remove every production dark-mode path, palette selector, toggle, persisted dark state, and dark navigation theme |
| Theme/palette implementations | 10 color modes plus four palette choices | Replace with one approved light semantic palette |
| Accessibility labels | 46 occurrences | Name every non-text interactive control and verify state/hint only where needed |
| Accessibility roles | 57 occurrences | Normalize roles and selected/disabled/expanded/busy states |
| Pressable/Touchable elements | 167 JSX signatures | Verify 44x44 targets, focus semantics, disabled state, and predictable feedback |
| Active and duplicate navigation shells | 2 | Keep React Navigation for M02; resolve the duplicate tree in M03 |
| Oversized presentation files | 20 TSX files above 300 lines | Extract only repeated/stateful presentation seams; preserve domain behaviour |

Counts are discovery baselines, not success metrics by themselves. M02 closes only when reachable
production UI uses the approved token/component layer and the acceptance checks pass.

### Existing primitives to evolve

| Primitive | Action |
|---|---|
| `Button`, `Input`, `Card`, `GlassCard` | Consolidate variants around semantic tokens, accessible states, and 44x44 minimum targets |
| `ModalSheet`, `AppDialog` | Standardize title, consequence, focus/escape, destructive confirmation, loading, and recovery patterns |
| `EmptyState`, `ScreenState` | Replace generic state copy with actionable loading/empty/offline/error/conflict/success/retry variants |
| `AppScreenHeader`, `ScreenBackButton` | Establish compact structured headers and predictable back/focus semantics |
| `AppTabs` | Replace with compact five-destination restrained-glass navigation and reduced-motion transitions |
| `TransactionComposerSheet` | Decompose presentation from validation/state while preserving financial behaviour |

### Preserved redesign patterns eligible for selective rebuild

The read-only dirty redesign introduced `AppIcon`, `Disclosure`, `EditorialLayout`,
`StructuredScreenHeader`, `useAppMotion`, `GlassTabBar`, and V1-oriented Home, Account, Groups,
Shared Ledger, Record Transaction, and Trust Center screens. These names align with the approved
direction, but the code has not passed the clean branch's tests, accessibility gate, or feature
parity review. M02 may reimplement the concepts only after comparing them with the active component
and state contracts.

## Accessibility Defect Baseline

The current product cannot claim `A11Y-01`:

- runtime motion uses timing/spring animations without a single reduced-motion decision;
- active status/navigation themes can switch to dark even though dark mode is a V1 non-goal;
- many icon-only or custom press targets lack a demonstrated accessible name/state contract;
- repeated fixed heights, fixed label widths, and very large screen components have not been proven
  at 200% text;
- there is no durable focus-order, screen-reader, switch-control, or TalkBack evidence;
- loading/error/empty components exist, but offline, conflict, queued, recovered, and destructive
  lifecycle states are not applied consistently across primary journeys;
- the current navigation bar is opaque, 72 px high, and uses wide item allocation; it does not meet
  the requested compact restrained-glass treatment or documented legibility evidence; and
- contrast has not been measured for the current translucent and theme variants.

## Approved M02 Visual Direction

The production system is light-only and solid-first:

- warm off-white canvas;
- near-black primary text;
- high-contrast lime primary action;
- olive accent/status support;
- cream secondary/support surfaces;
- no gradients and no appearance/theme selector;
- restrained glass only for compact navigation or overlays when the solid fallback, contrast, and
  device performance remain acceptable;
- Material Community Icons through one typed `AppIcon` adapter; branded provider marks remain
  separate and must follow their brand rules; and
- short state-preserving transitions with a no-motion fallback, never animation-first navigation.

## Progressive Disclosure Contract

Progressive disclosure reduces decision load, not accountability.

Always visible at the decision point:

- financial amount, currency, reporting period, and balance consequence;
- source/sync state and whether an operation is pending, offline, failed, or conflicted;
- privacy choice, requested permission, and why it is needed;
- destructive consequence, recovery boundary, export availability, and support route; and
- the primary next action plus any blocking validation.

Eligible for disclosure:

- optional note/metadata fields;
- advanced filters and calculation breakdowns;
- secondary diagnostics and historical technical detail;
- provider/linking troubleshooting after the primary identity choice; and
- supporting education that is also reachable from its task context.

Disclosure controls must expose accessible expanded/collapsed state, preserve entered values, avoid
nested accordions on primary paths, and never default-open optional complexity solely to fill space.

## State Matrix Required Before M02 Gate

Every primary surface must explicitly support the applicable states below:

| State | Visible contract |
|---|---|
| Loading/restoring | Named operation, bounded feedback, no false success |
| Empty | Why it is empty and the primary safe next action |
| Validation | Field/problem identification, correction guidance, retained input |
| Offline/queued | Local outcome, sync consequence, retry/reconnect expectation |
| Error | Plain-language failure, retained safe state, retry or support route |
| Conflict | Competing versions, financial consequence, explicit resolution |
| Success | What changed, where it is reflected, next useful action |
| Destructive pending | Exact scope, reversibility, export/recovery option, explicit confirmation |

## Expo SDK 56 Constraints

Implementation follows the exact versioned SDK 56 documentation:

- SDK 56 targets React Native 0.85, React 19.2.3, Android 7+, and Android compile/target API 36.
- `expo-blur` is optional. On Android, blur requires a `BlurTargetView` reference and a supported
  `blurMethod`; a solid fallback is mandatory. Do not add blur until the pinned dependency and
  physical-device performance are validated.
- font loading must use the SDK 56 `expo-font` configuration/runtime contract if a bundled font is
  retained; otherwise the system font stack is the safe fallback.
- Android system/status/navigation bar integration must use the SDK 56 APIs and avoid deprecated
  edge-to-edge assumptions.

## Task Handoff

- M02.2 owns the single light token contract and removal of theme/dark/gradient paths.
- M02.3 owns the reusable primitives and compact navigation shell.
- M02.4 owns application of those primitives and the disclosure/state contract to V1 journeys.
- M02.5 owns device, screen-reader, focus, 200% text, reduced-motion, target-size, contrast, and
  glass-fallback evidence.
- M03 owns final duplicate-router removal and architectural boundary enforcement.

No feature is credited as production-ready from this inventory. It only establishes the bounded,
evidence-backed rebuild plan.
