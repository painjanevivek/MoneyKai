# Implementation Plan: Calm Intelligent Experience

**Branch**: `001-calm-intelligent-experience` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-calm-intelligent-experience/spec.md`

**Note**: This template is filled in by the `$speckit-plan` command; its definition describes the execution workflow.

## Summary

Deliver a composed, web-first MoneyKai experience that uses purposeful motion to clarify the product story and financial workspace without visual overload. The work standardizes the visual system, landing-page motion, dashboard/report/settings hierarchy, honest UI states, and the presentation contract for the future guarded AI assistant.

This plan deliberately separates **experience work** from the separate LangGraph/LangChain/RAG backend program. The web UI will be ready to present trusted assistant states, but it will not enable a provider key, vector store, autonomous action, or private-data AI capability.

## Technical Context

**Language/Version**: TypeScript 6, React 19, Expo SDK 56 web application

**Primary Dependencies**: Expo Router, React Native Web, `motion/react` 12, GSAP 3 with `@gsap/react`, React Native Reanimated 4, Expo Image, and existing MoneyKai theme/UI primitives

**Storage**: No new persistence. Existing settings, report, export, authentication, and future assistant data sources remain authoritative. Saved reports/exports require a real record before being shown as saved.

**Testing**: Existing Expo lint and TypeScript checks; app-local Vitest tests; repository Playwright/Cypress suites where suitable; focused manual accessibility and visual validation

**Target Platform**: Responsive web first, served by the Expo export. Existing native-safe components remain compatible with the shared Expo application; no Android release is implied.

**Project Type**: npm-workspace monorepo; primary work is in the Expo web app, with a separate FastAPI backend reserved for the future guarded assistant

**Performance Goals**: Essential landing content and primary actions work without motion; visible/interactive motion stays bounded and is simplified for reduced motion; no always-running animation is introduced in authenticated financial workspaces; existing web quality gates pass without material regression from the current baseline.

**Constraints**: Reuse installed motion libraries; CSS for simple feedback, Motion for declarative state/viewport transitions, scoped GSAP only for justified sequenced web-only compositions, and Reanimated only for existing native-safe shared-app interaction patterns. Preserve exact public claims, accessibility, truthful UI states, and the read-only optional AI boundary.

**Scale/Scope**: Public landing page, workspace shell, dashboard, reports and Saved reports & exports, settings sections/subsections, shared state/motion primitives, and future-assistant presentation states; not a rewrite of finance data services.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The generated Spec Kit constitution is still a blank template and supplies no enforceable project-specific gates. Repository governance is therefore the operative constitution for this feature.

| Gate | Result | Evidence / handling |
| --- | --- | --- |
| Product claims remain precise | Pass | Preserve the existing web-first and no-current-Android wording; review any pricing or availability change before release. |
| Finance, privacy, and security boundaries remain protected | Pass | This UI work does not enable AI or expand data access; the separate AI plan remains read-only and backend-enforced. |
| Accessibility and user control | Pass | Motion is progressive enhancement; reduced-motion, keyboard, focus, and assistive-technology states are planned and tested. |
| Maintainable, focused change sets | Pass | Work is split by shared primitives, public page, workspace, and assistant presentation. No new animation library or broad rewrite is required. |
| Verification before handoff | Pass | Each phase has focused tests plus lint, typecheck, web build, and visual/accessibility checks. |

**Post-design re-check**: Pass. The design artifacts retain the same boundaries. No new persistence, external interface, provider, or unapproved product claim is introduced.

## Project Structure

### Documentation (this feature)

```text
specs/001-calm-intelligent-experience/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-experience-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md                         # created by $speckit-tasks
```

### Source Code (repository root)
```text
apps/MoneyKai-web/
├── src/
│   ├── app/
│   │   ├── index.tsx                # public landing experience
│   │   └── (tabs)/
│   │       ├── dashboard.tsx
│   │       ├── reports.tsx
│   │       ├── reports/saved.tsx
│   │       └── settings.tsx
│   ├── components/
│   │   ├── ai/                      # future assistant presentation
│   │   ├── dashboard/               # workspace information surfaces
│   │   ├── layout/DesktopShell.tsx  # main navigation and reports subnavigation
│   │   └── ui/                      # reusable primitives and state surfaces
│   ├── constants/theme.ts           # current colour, typography, spacing tokens
│   ├── features/ai/                 # existing typed assistant hooks and response helpers
│   ├── global.css                   # landing-page web styles
│   └── services/                    # authoritative web-client adapters
├── public/brand/                    # approved logo and wordmark assets
└── package.json

playwright/ and cypress/             # browser-flow coverage when suitable
```

**Structure Decision**: Keep the existing Expo web architecture. Introduce only small, reusable experience and state primitives under `apps/MoneyKai-web/src/components/` and a narrowly scoped motion policy/helper if repetition proves real. Preserve route-level composition in the existing route files. AI presentation consumes existing typed client responses; it does not create a second AI client protocol.

## Delivery Phases

### Phase 0 — Experience audit and release boundaries

1. Inventory the landing page’s current content, CSS, Motion, GSAP, brand assets, pricing/availability statements, and route ownership.
2. Inventory workspace hierarchy across `DesktopShell`, dashboard, reports, Saved reports & exports, and settings; identify nested-card density, unclear priority, and inaccurate or ambiguous state language.
3. Define the compact experience vocabulary: warm canvas/surface/ink/accent roles, typography hierarchy, spacing rhythm, elevation restraint, interactive feedback, and a finite set of motion intents.
4. Record a screen-by-screen state inventory: ready, loading, empty, partial data, restricted, unavailable, error, and disabled assistant. Identify each state’s source of truth and recovery action.
5. Capture a before baseline: primary task paths, visible claims, keyboard/focus behavior, reduced-motion behavior, and representative viewport screenshots.

**Exit criteria**: A written design brief, state inventory, content-claim inventory, and review scope exist before visual components are changed.

### Phase 1 — Shared visual and motion foundation

1. Consolidate the existing warm MoneyKai token direction for public and workspace surfaces without replacing user-selected themes or duplicating theme definitions.
2. Create reusable visual primitives only where they reduce duplicated styling: page frame, section heading, compact status treatment, empty/error state, information row, section/subsection heading, and quiet primary/secondary action treatment.
3. Define motion recipes by intent: entry/reveal, content re-order, direct feedback, navigation orientation, and data-change acknowledgement. Each recipe defines trigger, duration range, interruption behavior, reduced-motion fallback, and prohibited use.
4. Apply the implementation rule: CSS for simple feedback; Motion for declarative component/state/viewport transitions; GSAP only for encapsulated landing-page sequences that require a timeline; Reanimated only where the existing shared Expo surface needs it.
5. Add shared testable reduced-motion behavior and ensure motion never communicates meaning alone.

**Exit criteria**: Designers and engineers can apply the same hierarchy and motion rules on two routes without inventing new styles or animation patterns.

### Phase 2 — Public landing-page narrative and motion graphics

1. Recompose `src/app/index.tsx` around a concise visitor journey: promise, product demonstration, practical benefit, privacy/trust, pricing, present availability, and call to action.
2. Remove redundant sections and unexplained whitespace; retain only visual modules that support one message or conversion decision.
3. Replace generic decorative effects with a small set of branded motion moments: initial composition, a focused product-preview reveal, controlled scroll-based section reveals, and direct action feedback.
4. Keep logo and wordmark assets accurate and provide appropriate alternative text; decorative graphics remain hidden from assistive technology.
5. Preserve the pricing policy: Free is available; Plus and Premium are clearly future/waitlist offers; no purchase promise or Android claim appears.
6. Validate desktop, tablet, and narrow-width composition; ensure the stable static version carries the whole message.

**Exit criteria**: A visitor can understand MoneyKai and reach a primary action before, during, or without motion.

### Phase 3 — Calm workspace, reports, and settings redesign

1. Refine `DesktopShell` hierarchy and active-route feedback while keeping Reports’ explicit two-level navigation: Statement intelligence and Saved reports & exports.
2. Rework dashboard composition around a primary financial snapshot, a visible next action, and progressively disclosed supporting detail. Retain authoritative finance components and do not reinterpret balances or calculations in presentation code.
3. Apply the shared state contract to reports and export surfaces. Make loading, empty, queued, completed, failed, and unavailable information distinguishable; only show saved history from a real record.
4. Finish settings information architecture using named sections and subsections. Preserve existing actions and clarify their descriptions, ownership, privacy effect, and recovery behavior rather than hiding more controls behind visual treatment.
5. Reduce visual noise: eliminate unnecessary nested cards, reserve accent color for meaningful state/action, and use quiet dividers and typography for ordinary grouping.
6. Add minimal responsive motion only to direct interactions such as active navigation movement, non-destructive row feedback, and state transitions; omit ambient movement from finance workspaces.

**Exit criteria**: The primary dashboard-to-report-to-settings journeys are easier to scan and complete without support, and all state claims remain truthful.

### Phase 4 — Guarded assistant presentation readiness

1. Map existing assistant hook/client response states into one presentation model: disabled, unavailable, quota-limited, loading, cancellation, safe refusal, grounded product answer, and grounded financial explanation.
2. Design the answer layout to distinguish server-calculated facts, approved source references, explanatory language, caveats, and safe next actions. It must never visually imply the assistant performed a write action.
3. Keep the assistant optional and non-blocking; dashboards, reports, and settings remain fully usable when it is unavailable.
4. Do not ship provider configuration, RAG corpus, private-document permission, a new data source, or autonomous capability in this phase. Integrate the eventual backend only through the existing typed client contract after the separate AI plan’s guardrail and launch gates pass.

**Exit criteria**: The web client can render trustworthy assistant states without requiring the assistant to be enabled in production.

### Phase 5 — Quality, rollout, and handoff

1. Add focused unit tests for pure state mapping, navigation labels, reduced-motion helpers, and truthful saved-export rendering.
2. Add or update browser tests for landing-page primary action, reports subnavigation, settings discoverability, keyboard focus, and stable reduced-motion behavior where the environment supports it.
3. Run visual review at representative widths and theme modes; check long labels, empty data, delayed data, failure states, and low-motion settings.
4. Run existing typecheck, lint, unit, targeted browser, SEO audit for public-route changes, and production web build before deployment review.
5. Release behind reversible, surface-level controls where appropriate. Roll back a visual enhancement independently of the content hierarchy; retain the global AI kill switch for assistant problems.

**Exit criteria**: Validation artifacts, screenshots, user-impact notes, public-claim review, accessibility results, and rollback guidance accompany the pull request.

## Complexity Tracking

No constitution violation or additional project is required. The feature explicitly avoids a new animation framework, parallel UI system, duplicate AI client, or persistence layer.
