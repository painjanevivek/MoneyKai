# Recent Financial Imports Refactor Notes

Date: 2026-06-14

Scope:
- Gmail sync card
- financial document review flow
- wealth screen
- reconciliation review
- security hardening card
- mobile and web AI async hooks

Key decisions:
- Separate initial hydrate paths from user-triggered refresh actions.
  Initial loads should not reuse refresh handlers that immediately flip local loading state, because that pattern created fragile effect-driven render cascades and confusing busy-state overwrites.
- Reset modal form state by unmounting sheets instead of mutating local state from effects.
  This keeps the sheet lifecycle simpler and avoids lint violations around synchronous state changes in effects.
- Keep AI request hooks deterministic and lint-safe by using stable callbacks instead of `useEffectEvent` in ordinary event handlers.
  `useEffectEvent` remains valuable for effect-only event flows, but it was the wrong tool for reusable async actions and refresh helpers here.
- Keep mobile and web AI client contracts aligned with explicit backend methods.
  The missing mobile backend methods for transaction insights and budget coach caused drift that typecheck now catches and the new regression test covers.

Expected maintenance rule:
- When adding new backend-backed cards or screens, implement:
  - one hydrate function for initial/background loading
  - one refresh/action wrapper for user-visible loading states
  - conditional rendering for sheet-local form reset when possible
