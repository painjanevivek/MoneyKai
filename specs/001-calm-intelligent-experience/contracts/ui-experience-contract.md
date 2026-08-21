# UI Experience Contract

## Purpose

Define the boundary between MoneyKai routes, reusable presentation primitives, existing finance data, and the future guarded-assistant client. This is a UI contract; it does not create an external API or authorize new backend behavior.

## Route ownership

| Surface | Existing route/component | Required contract |
| --- | --- | --- |
| Landing page | `src/app/index.tsx` and `src/global.css` | The full story works statically; motion is optional and scoped to meaningful narrative moments. |
| Workspace navigation | `src/components/layout/DesktopShell.tsx` | Active location, reports subnavigation, focus, responsive layout, and no Android download claim remain accurate. |
| Dashboard | `src/app/(tabs)/dashboard.tsx` and dashboard components | Displays authoritative financial values unchanged; presentation only changes hierarchy and states. |
| Reports | `src/app/(tabs)/reports.tsx` | Represents import/report states truthfully and retains Statement intelligence access. |
| Saved reports & exports | `src/app/(tabs)/reports/saved.tsx` | Uses `SavedReportExportPresentation`; no saved-history claim without an authoritative record. |
| Settings | `src/app/(tabs)/settings.tsx` | Groups controls into predictable sections/subsections without losing existing actions. |
| Assistant | existing AI hooks, types, service, and panels | Uses `GroundedAssistantPresentation`; never creates a duplicate client protocol or provider call. |

## Motion contract

1. A component may use motion only with a named `MotionRecipe` intent.
2. All content and controls have a stable reduced-motion equivalent.
3. Components use CSS for simple hover/focus feedback, Motion for state/viewport changes, and GSAP only when an encapsulated landing composition truly needs a timeline.
4. Motion cannot hide interactive elements, determine focus order, or be the only signal of completion, error, active state, or financial change.
5. Authenticated finance workspaces do not contain ambient/infinite decorative motion.

## State and truth contract

1. Each route maps current service data to exactly one `WorkspaceSurfaceState` at a time.
2. Loading, empty, partial, restricted, unavailable, and error states include a truthful label plus an appropriate recovery action where one exists.
3. Presentational code does not calculate, mutate, or invent financial facts, report completion, export history, prices, availability, or AI sources.
4. An `available` saved report/export requires an authoritative `recordId` and record-derived metadata.
5. AI facts, sources, caveats, and status are rendered only from the existing typed client response. A disabled or unavailable assistant cannot block core routes.

## Accessibility contract

1. Every interactive control has an accessible name, keyboard operation, visible focus, and state that does not depend only on color.
2. Decorative graphics and animation are hidden from assistive technology; meaningful data/status changes are announced through existing platform-appropriate semantics.
3. The platform reduced-motion preference replaces movement with stable content or minimal non-spatial feedback.
4. Responsive layouts preserve reading order and do not make primary actions dependent on hover.

## Measurement and privacy boundary

This implementation adds no new analytics event or third-party client. Any future measurement must use the existing analytics governance, avoid financial payloads and raw assistant text, and receive separate approval before implementation.
