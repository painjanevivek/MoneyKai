# MoneyKai Android V1 Launch Scope

**Version:** 1.0.0  
**Status:** Frozen for M02-M16 implementation; final adoption occurs when the M01 pull request merges  
**Owner:** Founder / product owner (`@painjanevivek`)  
**Target surface:** Expo SDK 56 Android application, package `com.moneykai.mobile`  
**Launch locale/currency:** English (India), INR-certified calculations and presentation  
**Supersedes for the target release:** Earlier local-only Flutter submission assumptions

## Scope Rule

A capability is in Android V1 only if it is listed under **Required launch capabilities** and
passes its mapped roadmap gates. Existing code, a visible menu item, an older AAB, marketing copy,
or a partially working prototype does not make a feature launch scope.

The V1 product must deliver one coherent loop:

> Sign in → record or review money → understand the month → synchronize and recover → export or leave.

## Required Launch Capabilities

| ID | Capability | User-visible acceptance boundary | Owning gates |
|---|---|---|---|
| `V1-01` | Progressive onboarding | State the product value and data model; let the user reach first value without completing optional setup | `PROD-01`, `DESIGN-03`, `A11Y-01`, `UX-01` |
| `V1-02` | Firebase identity | Google sign-in plus email/password parity, reset, provider-link recovery, session restoration, logout, and revocation; demo access excluded from production | `SEC-04`, `PRIV-01` |
| `V1-03` | Monthly home | Show current-month income, expense, budget remaining, recent records, and visible sync status with links to contributing records | `TRUST-01`, `TRUST-02`, `FIN-01` |
| `V1-04` | Manual transactions | Create, view, edit, and delete income/expense records with amount, date, category, payment method, and optional note; show the balance consequence | `FIN-01`-`FIN-03`, `UX-01` |
| `V1-05` | Review-first import | Import the versioned MoneyKai CSV format through a user-selected file, preview valid/invalid/duplicate rows, edit or exclude rows, then commit once | `FIN-02`, `API-01`, `TRUST-01` |
| `V1-06` | Monthly budget | Set and revise one monthly total plus category limits; show spent, remaining/over, source records, and reporting period | `FIN-01`, `TRUST-01`, `UX-01` |
| `V1-07` | Explainable groups | Create a group, manage authorized membership, record payer/participants/split, show calculation and settlement history, and never imply MoneyKai moved money | `API-03`, `FIN-01`, `TRUST-01` |
| `V1-08` | Offline-safe synchronization | Keep supported reads/actions usable offline, label state, queue idempotent writes, reconcile conflicts, retry safely, and expose recovery | `TRUST-02`, `FIN-02`, `REL-04` |
| `V1-09` | Reinstall recovery | Restore the authenticated user's supported records and balances after reinstall, then reconcile record counts and totals | `REL-04`, `GOLDEN-01` |
| `V1-10` | Trust and lifecycle | Trust Center, contextual permission explanations, portable JSON export with transaction CSV, resumable deletion, terminal state, and support escalation | `TRUST-03`, `TRUST-04`, `PRIV-01` |
| `V1-11` | Support and diagnostics | In-app support route, privacy-safe diagnostic reference, published response expectations, and recovery guidance without exposing financial content | `OPS-01`, `PRIV-01` |
| `V1-12` | Production-quality shell | Light-only solid palette, no gradients, restrained legible glass navigation, reduced-motion support, accessible states, and no dead controls | `DESIGN-01`-`DESIGN-03`, `A11Y-01`, `UX-01` |

## Navigation and Progressive Disclosure Boundary

The compact bottom navigation contains exactly five primary destinations:

1. **Home** — monthly position, budget attention, recent records, sync state.
2. **Transactions** — review, search, filter, edit, delete, and import.
3. **Add** — the visually clear primary action for income or expense.
4. **Budget** — monthly total, categories, progress, and explanation.
5. **More** — Groups, Trust Center, export/deletion, account, and support.

The bar may use a restrained translucent/glass treatment only when contrast, focus, motion, and
touch-target gates pass. Advanced filters, diagnostics, calculation detail, and account controls
are disclosed from their relevant context. Amounts, consequences, sync state, privacy choices,
destructive actions, recovery, and support are never hidden solely to make a screen look simpler.

## Required Data Boundary

- The canonical identity is a verified Firebase user ID; email is display/contact data, not authority.
- The canonical synchronized data path is the approved backend contract, not direct ungoverned client writes.
- Launch-certified financial records are transactions, budget settings, groups/members/expenses,
  synchronization operations, backup/recovery records, export operations, and deletion operations.
- INR is the only launch-certified currency. Storage and contracts retain an explicit ISO currency
  code so future currencies require fixtures and approval rather than reinterpretation.
- Import accepts only the published MoneyKai CSV schema in V1. Unsupported columns/files fail with
  an explanation; they are never guessed into financial records.
- Product analytics never receives raw amounts, notes, merchant text, emails, file contents, or group names.

## Explicit V1 Non-Goals

The following are excluded from the production build and store claims:

- iOS release, additional locales, or non-INR certified calculations;
- dark mode, gradients, theme marketplace, decorative 3D, or animation-first navigation;
- SMS inbox access, notification-listener access, Gmail scanning, contact harvesting, or background capture;
- bank/card/account aggregation, UPI history ingestion, broker sync, or automatic financial-account linking;
- AI categorization, chat, advice, predictions, autonomous changes, or financial recommendations;
- investment/portfolio/wealth tracking, tax, credit, lending, insurance, crypto, or business accounting;
- payment collection, bill payment, settlement execution, remittance, custody, or money movement;
- live cursors/presence, chat, or unrestricted real-time collaborative editing in groups;
- social feed, gamification, ads, referrals, subscriptions, paywalls, or marketing push notifications;
- receipt OCR, camera/microphone/location access, broad storage permission, or all-files access;
- custom categories, recurring-rule automation, multi-budget envelopes, and advanced reports unless a
  later scope change proves they can ship without displacing a required capability; and
- production demo credentials, authentication bypasses, or reviewer-only hidden behaviour.

Research/debug builds may contain visibly labelled experimental adapters only when they cannot be
enabled in production and their permissions, data, and credentials remain isolated.

## Launch-Critical Journeys

The release candidate must pass these journeys before V1 may ship:

1. Clean install → Google sign-in → first manual transaction → understandable Home update.
2. Select MoneyKai CSV → review and correct → commit → zero duplicate records.
3. Set budget → add/edit/delete expense → exact budget and balance reconciliation.
4. Create group expense → explain payer, split, participant positions, and settlement state.
5. Create offline → reconnect → synchronize once → visible terminal state.
6. Reinstall → sign in → restore → exact record/count/balance reconciliation.
7. Export → validate readable content → delete account → documented terminal state.

M13 repeats the roadmap golden journey ten consecutive times from Play internal testing.

## Cut Order if Schedule Is Threatened

Required trust, correctness, privacy, accessibility, identity, synchronization, recovery, export,
and deletion behaviour cannot be cut. Remove optional richness in this order:

1. decorative motion and secondary illustrations;
2. saved filters and nonessential chart variants;
3. category customization and secondary budget views;
4. group convenience actions that do not affect the certified shared-ledger journey.

If the remaining scope still cannot pass, delay release. Do not replace a failed gate with a
disclaimer, hide the feature, or ship a dead/“coming soon” production control.

## Scope Change Control

Any addition before M16 requires a written problem statement, user evidence, privacy/security and
Play impact, owner, test/gate mapping, and an explicit displaced item or schedule change. The
product owner approves the version change through an ADR. Removing a required capability requires
re-opening `PROD-01`, affected roadmap gates, store declarations, and the golden journey.
