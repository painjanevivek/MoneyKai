# MoneyKai Mobile Component Contracts

**Version:** 1.0.0

**Status:** Required for Android V1 presentation work

## Navigation Shell

`ProductionAppTabs` is the active five-destination shell in this order: Home, Transactions, Add,
Budget, More. `GlassTabBar` presents them in a compact floating dock with 2 px inter-item gaps,
44+ px targets, visible labels, a high-contrast lime Add action, a solid 92% white fallback, and no
blur dependency. The selection surface moves in 180 ms or immediately when reduced motion is on.

The tab shell uses a fade transition. Native-stack and authentication transitions use a directional
or fade transition and resolve to `none` from the same `useAppMotion` decision. Keyboard appearance
hides the floating tab dock so it cannot cover form actions.

## Icons

`AppIcon` is the application icon adapter. It maps existing Material Community semantic names to
one Feather line-icon family, matching the reference's calm outline treatment without forcing
screen implementations to know the provider. Unknown names fall through to Feather for a bounded
migration period. Provider brand marks do not use this adapter.

An icon-only control must provide a spoken label. Decorative icons remain inaccessible and sit
beside visible text. Icons do not carry financial or status meaning alone.

## Buttons and Press Feedback

`Button` owns size, color, busy, disabled, icon, label, and accessibility state. The production
primary pair is lime `action` with near-black `onAction`; white-on-lime is prohibited. Secondary,
outline, ghost, inverse-surface, and danger treatments remain solid.

`PressableScale` uses the shared 0.98 press response and central spring. Reduced motion holds scale
at 1. Controls are at least 44 px high and keep their spoken label while busy.

## Fields

`Input` owns label, required marker, supporting/error copy, prefix/suffix, secure reveal, focus,
disabled state, keyboard intent, and test identity. Focus and validation are visually distinct.
Error copy announces politely and entered content is retained. Password reveal is a 44x44 labeled
control; helper copy is never replaced with placeholder-only guidance.

## Cards and Glass

`Card` defaults to a flat solid surface. `outlined`, `support`, `raised`/`elevated`, and `glass`
variants are explicit. Normal cards no longer receive glass plus elevation by default. Raised depth
is shallow; support hierarchy prefers cream surfaces.

`GlassCard` remains a compatibility wrapper using the same solid translucent fallback and olive
border. It has no dark branch or blur effect. M03 may remove it after callers migrate to `Card`.

## Sheets

`ModalSheet` provides bottom/side presentation, title and optional explanation, 44x44 close target,
scrim dismissal, Android back handling, web Escape handling, initial close focus, scrolling, footer,
safe-area padding, and gesture dismissal. It uses the central reduced-motion decision and the
semantic overlay token.

Destructive sheets must keep consequence, reversibility, export/recovery, and confirmation visible.
The sheet is a container contract; callers own domain validation and idempotency.

## Disclosure

`Disclosure` exposes title, optional summary, and accessible expanded state. Collapsed descendants
are removed from accessibility traversal and pointer interaction. Content is mounted after first
use so entered values persist across later collapse/expand cycles. It uses the shared motion
duration and becomes immediate with reduced motion.

Do not use disclosure for balances, transaction consequences, sync state, permission purpose,
destructive outcomes, recovery, or blocking validation. Avoid nested disclosures on primary paths.

## Feedback and Screen States

`FeedbackBanner` supports neutral, information, success, warning, danger, and offline messages with
explicit foreground, background, border, icon, copy, and optional 44 px action. Danger announces
assertively; other updates announce politely.

`ScreenState` supports loading, empty, offline, error, conflict, success, and neutral states through
one tested map. It retains older `tone`/`loading` props while screens migrate. `EmptyState` uses the
same icon family and flat surface rules. Every state must explain what happened and provide a safe
next action when one exists.

## Composition Rules

- Screens own data and domain orchestration; primitives own presentation and interaction contracts.
- Prefer a small component plus children over a feature-specific prop explosion.
- Do not duplicate colors, motion, target sizes, icon-provider knowledge, or state palettes.
- New variants require a real user/state need and affected accessibility evidence.
- Primary screen application and copy belong to M02.4; rendered/device acceptance belongs to M02.5.
