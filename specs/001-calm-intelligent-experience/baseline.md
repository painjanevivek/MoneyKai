# Current-State and Claim Baseline

**Captured:** 2026-08-18
**Purpose:** Preserve the product facts and visible states that the Calm Intelligent Experience may improve without changing what MoneyKai truthfully promises.

## Public landing page

| Area | Current state | Implementation boundary |
| --- | --- | --- |
| Entry route | `apps/MoneyKai-web/src/app/index.tsx` renders the public home page. | Keep `/` as the public landing route and retain a clear sign-up action. |
| Brand assets | The wordmark and symbol are served from `apps/MoneyKai-web/public/brand/`. | Use approved assets; do not substitute a new brand mark without approval. |
| Product narrative | The page contains a hero, product mockup, feature explanation, audience strip, pricing, and final action. | Tighten hierarchy and remove redundant space before adding new visual treatment. |
| Pricing | Free is presented as available; Plus and Premium are marked coming soon/waitlist. | Do not change prices, availability, or purchase promises without product approval. |
| Platform availability | The page says there is no Android release today. | Keep this statement accurate; do not add a mobile-download destination while the URL remains unset. |
| Motion | Motion and GSAP are already used for reveals and a marquee. | Motion must remain optional, reduced-motion safe, and non-blocking. |

## Authenticated workspace

| Surface | Current state | Implementation boundary |
| --- | --- | --- |
| Shell | `DesktopShell.tsx` owns primary navigation, route metadata, and Reports subnavigation. | Preserve route ownership and active-route semantics. |
| Dashboard | `dashboard.tsx` and `components/dashboard/` render financial summaries from existing stores/services. | Presentation may change hierarchy; it must not calculate, alter, or fabricate financial values. |
| Reports | `/reports` is Statement intelligence; `/reports/saved` is Saved reports & exports. | Keep both destinations distinct and discoverable. |
| Saved reports & exports | The route is a product surface; export-history persistence is not assumed. | Never display a saved item unless an authoritative record exists. |
| Settings | `settings.tsx` already groups controls using subsections. | Improve scanning and labels without removing existing actions or obscuring privacy effects. |
| Themes | `constants/theme.ts` provides multiple supported theme palettes. | Do not overwrite a customer-selected theme with public landing tokens. |

## Assistant and data boundaries

| Area | Current state | Implementation boundary |
| --- | --- | --- |
| Client path | Existing hooks, `aiClient`, panels, and typed responses communicate with the configured MoneyKai backend. | Do not create another client protocol or expose a provider key. |
| Availability | The client has disabled/unconfigured behavior. | Core dashboard, reports, and settings flows stay useful when assistant functionality is unavailable. |
| Current response shape | Chat responses contain message, generic annotations, and generic safety metadata. | Source citations, facts, caveats, and refusal states require an approved typed backend contract before release. |
| Existing broader AI surfaces | Existing client types include model override and attachment/document flows. | The Calm Intelligent Experience must not expose, widen, or newly enable those paths. |
| Guardrail program | LangGraph/LangChain/RAG implementation is a separate backend program. | UI readiness does not approve private-data RAG, document processing, autonomous actions, or regulated advice. |

## Baseline release checks

- Public pricing, platform, privacy, and feature claims require product review before change.
- All redesigned routes must retain keyboard navigation, visible focus, and a stable reduced-motion presentation.
- A visual enhancement can be rolled back independently; the core content and primary action remain usable.
