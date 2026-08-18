# Validation Quickstart: Calm Intelligent Experience

## Goal

Validate that the redesigned landing page and authenticated workspace are clear, calm, accessible, truthful, and resilient when optional enhancement or assistant features are unavailable.

## Prerequisites

- Node.js version accepted by the repository (`>=22.13.0`).
- Workspace dependencies installed with `npm run bootstrap` when necessary.
- A valid local web configuration for authenticated-route checks; do not place provider keys in client-side environment variables.
- Use a test account and non-sensitive fixture data for dashboard/report checks.

## Run the web application

```powershell
npm run web
```

Open the public landing page and the authenticated workspace in a supported desktop and narrow-width browser viewport.

## Validation scenarios

### 1. Landing narrative and claim accuracy

1. Open `/` with motion enabled.
2. Confirm the first view communicates MoneyKai’s purpose and one primary action without waiting for animation.
3. Scroll through the page. Confirm each section carries one message, pricing is precise, and current platform availability does not promise Android.
4. Enable reduced motion in the operating system or browser environment and reload. Confirm all information, navigation, and calls to action remain available with no required spatial/looping motion.

### 2. Workspace hierarchy and reports

1. Sign in with fixture data and open `/dashboard`.
2. Confirm the key financial summary and next action are easier to identify than secondary information; verify displayed values match existing authoritative components.
3. Open `/reports`; then open `/reports/saved` through the Reports subnavigation.
4. Confirm Statement intelligence and Saved reports & exports remain separately discoverable.
5. With no authoritative export record, confirm the UI communicates an empty/available-to-create state rather than showing invented history.

### 3. Settings structure

1. Open `/settings`.
2. Find account, connected accounts, preferences, data and privacy, and help/about controls through section/subsection headings.
3. Activate existing settings actions and confirm no action was removed or obscured by the redesign.

### 4. Assistant readiness

1. Exercise the existing disabled/unavailable assistant state without configuring any provider.
2. Confirm the page explains the status honestly and core dashboard, report, and settings tasks still work.
3. When typed fixture responses are available, confirm facts, sources, explanation, caveats, and safe next actions are visually distinct.

### 5. Accessibility and responsive checks

1. Complete landing, reports, and settings navigation with a keyboard only; confirm visible focus and logical order.
2. Check at wide desktop, tablet, and narrow mobile-width layouts. Confirm no primary action is hover-only and content remains readable with long labels.
3. Confirm loading, empty, partial, unavailable, and error states do not depend only on color or motion.

## Automated quality gates

Run the narrowest relevant tests first, then the web checks:

```powershell
npm run web:typecheck
npm run web:lint
npm --prefix apps/MoneyKai-web run test:unit
npm run seo:audit
npm run web:build
```

If browser coverage is added or updated, run the targeted suite first and then the repository-level browser command:

```powershell
npm run playwright:run
```

## Expected result

All commands succeed. The landing page remains understandable without motion; Reports and Saved reports & exports are separately discoverable; Settings is navigable by sections; assistant failure never blocks core work; and no test or visual review finds an inaccurate financial, pricing, platform, privacy, or saved-record claim.
