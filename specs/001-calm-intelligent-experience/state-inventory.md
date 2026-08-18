# Experience State Inventory and Owner Map

This inventory turns the shared `WorkspaceSurfaceState` and `SavedReportExportPresentation` rules into clear responsibilities for each MoneyKai surface. It does not add a database, a new source of financial truth, or any AI capability. A screen may only display a completion, a saved record, or a financial fact when the owning service has supplied it.

## Shared state rules

Every customer-facing surface has exactly one current state: `ready`, `loading`, `empty`, `partial`, `restricted`, `unavailable`, or `error`.

- `ready` content identifies the service or record that supplied it.
- `loading` preserves the screen structure and never pretends that an action has completed.
- `empty` explains what is absent and offers a safe next step when one exists.
- `partial` labels what is currently available and what is missing; it must not silently look complete.
- `restricted` explains that access is unavailable without disclosing protected information.
- `unavailable` is used for a known temporary dependency or capability limit and offers retry or a viable alternative.
- `error` uses plain language, provides a safe recovery action, and never exposes raw provider or server errors.

## Surface ownership

| Surface | Route or component owner | Authoritative source | Required states | Safe recovery/action |
| --- | --- | --- | --- | --- |
| Public landing | `src/app/index.tsx` | Versioned public content and approved product claims | `ready`; a static content fallback if decorative media cannot load | Continue to the primary call to action; no animation is required to understand the page. |
| Workspace shell | `src/components/layout/DesktopShell.tsx` | Current route, authenticated session, and navigation configuration | `ready`, `restricted`, `unavailable` | Navigate to an available route, sign in again, or return to the landing page. |
| Dashboard | `src/app/(tabs)/dashboard.tsx` and dashboard components | Existing authenticated finance services and their typed responses | `loading`, `ready`, `empty`, `partial`, `restricted`, `unavailable`, `error` | Add a record, refresh/retry, or use an available related view. Presentation code must not calculate or mutate finance data. |
| Statement intelligence | `src/app/(tabs)/reports.tsx` | Existing report and import services | `loading`, `ready`, `empty`, `partial`, `unavailable`, `error` | Import/select a statement, retry, or return to reports. |
| Saved reports & exports | `src/app/(tabs)/reports/saved.tsx` | Authoritative saved-report or export record | `not-created`, `preparing`, `available`, `expired`, `failed`, `unavailable` | Create, retry, download, or learn what is required. `available` and `expired` must carry a real record identifier. |
| Settings | `src/app/(tabs)/settings.tsx` | Existing settings, authentication, and sync services | `loading`, `ready`, `partial`, `restricted`, `unavailable`, `error` | Retry, restore a valid value, or use the shown account/privacy action. Existing actions remain available. |
| Assistant presentation (future) | `src/components/ai/` and `src/features/ai/` | Typed backend response only | `disabled`, `loading`, `available`, `limited`, `refused`, `unavailable`, `cancelled` | Ask a different safe question, retry where permitted, or continue using the workspace without the assistant. |

## Saved report and export presentation

| Availability | Required evidence | Customer-visible treatment | Permitted action |
| --- | --- | --- | --- |
| `not-created` | No authoritative record exists | Explain that there is no saved output yet. | Create when the service supports it. |
| `preparing` | The service has confirmed queued/in-progress work | Say that the output is being prepared; do not show a download control. | Wait, refresh, or cancel only if the service supports it. |
| `available` | Record identifier plus real title and creation metadata when supplied | Show the actual saved item and its relevant metadata. | Download/open the actual item. |
| `expired` | Record identifier and an authoritative expiry condition | Explain that the old item is no longer available. | Recreate or learn more. |
| `failed` | A typed service failure condition | Explain that preparation did not finish; do not invent a file. | Retry or return. |
| `unavailable` | Service/capability is not currently available | Explain that saved output cannot be used right now. | Retry later or use an available alternative. |

## Future assistant boundary

The assistant is a separate guarded-backend program. Until its backend contract supplies typed facts, approved sources, and required caveats, the web client must use only disabled, unavailable, limited, cancelled, or generic safe-refusal states. The UI must not:

- claim an AI answer is based on personal financial data without a typed backend source;
- display an invented source, caveat, report, export, or performed action;
- bypass account, privacy, or authorisation controls; or
- make dashboard, reports, exports, or settings depend on the assistant.

When the backend is ready, `available` responses must distinguish server-calculated facts, explanatory language, approved sources, caveats, and a user-controlled next action. A financial interpretation without a backend-supplied caveat is not displayable as a grounded response.

## Release review evidence

For each redesigned surface, record in `validation-log.md`:

1. The ready state and every relevant non-happy path tested.
2. The source that makes the claim or saved item authoritative.
3. Keyboard, focus, and reduced-motion results.
4. The exact recovery action exposed to the customer.
5. Any unavailable capability kept out of the interface rather than represented as available.
