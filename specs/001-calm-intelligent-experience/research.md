# Research: Calm Intelligent Experience

## Decision 1 — Standardize on the motion tools already in the application

**Decision**: Use CSS transitions for simple visual feedback, `motion/react` as the default for React state and viewport transitions, scoped `@gsap/react` only for a self-contained sequenced landing-page composition, and existing Reanimated patterns only where a shared Expo component genuinely needs them.

**Rationale**: The web workspace already includes all four tools. Adding another library would increase bundle, maintenance, and inconsistent accessibility behavior. Motion is already used by the landing page and provides declarative React animation plus reduced-motion support. GSAP is already used for the landing-page marquee and its React integration provides cleanup through context.

**Alternatives considered**:

- Add another motion-graphics framework: rejected because it duplicates current capability and creates a second design language.
- Use GSAP for every effect: rejected because state-driven workspace components are clearer and easier to test with declarative motion.
- Use CSS only: rejected because the landing narrative needs a small number of interruption-safe, coordinated transitions.

**Sources**: [Motion React documentation](https://motion.dev/docs/react), [Motion reduced-motion hook](https://motion.dev/docs/react-use-reduced-motion), [GSAP React cleanup guidance](https://gsap.com/docs/v3/GSAP/gsap.context%28%29/).

## Decision 2 — Motion is progressive enhancement, never a content channel

**Decision**: Every motion moment has a static final state, honors the user’s reduced-motion preference, can be interrupted safely, and is excluded from semantic announcements unless it changes meaningful content.

**Rationale**: MoneyKai handles personal finance. Calmness and comprehension matter more than spectacle. Reduced motion must replace translation/parallax/looping movement with stable content or minimal opacity feedback; keyboard and screen-reader users must receive the same outcome.

**Alternatives considered**:

- Uniformly disable every animation: rejected because gentle feedback can improve orientation and perceived responsiveness.
- Offer a custom motion setting first: deferred; platform preference is the reliable baseline and avoids another preference to maintain.

## Decision 3 — The landing page should be a short narrative, not a gallery

**Decision**: Organize the public page as promise → product proof → practical benefits → trust and availability → pricing → action. Keep one main message per section and remove redundant modules/empty space before adding new artwork.

**Rationale**: The current route already has a usable hero, product mockup, feature section, audience strip, pricing, and final call to action. The needed improvement is tighter hierarchy and purpose-driven compositions, not more unrelated panels.

**Alternatives considered**:

- Make all sections animated at once: rejected because it competes with financial-product trust and makes scrolling tiring.
- Replace the page with video/canvas scenes: rejected for the first pass because critical content becomes slower, less accessible, and harder to maintain.

## Decision 4 — Reuse the existing visual vocabulary while reducing card density

**Decision**: Preserve MoneyKai’s warm public palette and existing workspace theme system, then define a small cross-surface hierarchy for canvas, surface, ink, muted text, accent, status, border, and elevation. Group ordinary information with typography and dividers before introducing a card.

**Rationale**: The repository already has a mature `theme.ts`, route-level themes, shared card/button/empty-state primitives, and a warm public palette in `global.css`. Replacing it would risk inconsistent theme behavior. The visual problem is inconsistent emphasis and unnecessary containment, not a missing color system.

**Alternatives considered**:

- Full brand rewrite: rejected because no formal brand-refresh approval exists.
- Heavy glass/gradient treatment: rejected by the specification because it adds visual noise and reduces content contrast.

## Decision 5 — Treat saved reports and exports as truthful stateful surfaces

**Decision**: Model saved report/export presentation separately from report intelligence. Render a saved item only from an authoritative record; otherwise show a clear ready-to-export, empty, queued, failed, or unavailable state.

**Rationale**: The existing navigation already distinguishes Statement intelligence and Saved reports & exports. The AI plan also explicitly prohibits claiming an export has been stored without backend persistence.

**Alternatives considered**:

- Show mock history to make the page feel populated: rejected because it damages financial-product trust.
- Hide the page until persistence is implemented: rejected because a transparent empty state can explain available export actions and future history.

## Decision 6 — Make assistant trust visible without coupling it to the AI backend rollout

**Decision**: Define an interface presentation contract now—facts, sources, explanation, caveat, limitation, status, and next action—while keeping AI disabled until the separate backend guardrail plan passes.

**Rationale**: The web app already has AI types, hooks, client service, dashboard surfaces, and disabled-state paths. Preparing the UI does not authorize model calls or expand personal-data processing.

**Alternatives considered**:

- Build a new chat protocol during the redesign: rejected because it duplicates existing typed client work and could bypass the guarded backend path.
- Make AI a core navigation dependency: rejected because core finance work must remain useful when AI is absent.

## Decision 7 — Validate behavior before visual taste

**Decision**: Each rollout validates exact public claims, completion of primary navigation paths, reduced-motion and keyboard operation, empty/failed states, visual responsiveness, and existing web quality gates before broad release.

**Rationale**: A visually impressive prototype can still mislead customers, regress accessibility, or break under no-data conditions. MoneyKai’s product trust comes from stable states and accurate claims.

**Alternatives considered**:

- Rely only on screenshots: rejected because screenshots do not verify semantics, focus order, motion preference, or source-of-truth behavior.
