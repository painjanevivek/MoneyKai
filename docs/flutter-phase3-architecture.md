# MoneyKai Flutter Phase 3 Architecture

Last reviewed: 2026-06-29

## App location

The Flutter app is created at:

```text
apps/MoneyKai-flutter
```

The existing React Native mobile app remains at `apps/MoneyKai-mobile` for historical reference and should not be blindly ported.

## Platform identity

| Field | Value |
| --- | --- |
| App name | `MoneyKai` |
| Android application id | `com.moneykai.mobile` |
| Android namespace | `com.moneykai.mobile` |
| iOS bundle id | `com.moneykai.mobile` |
| Initial version | `1.0.0+1` |
| Primary platform | Android |
| Secondary platform | iOS-compatible Flutter UI |

## Selected stack

| Area | Choice | Reason |
| --- | --- | --- |
| UI | Flutter Material 3 | Stable cross-platform UI with Android-first behavior and iOS compatibility. |
| Routing | `go_router` | Declarative route map, stack routes, and shell navigation without custom router code. |
| State management | `flutter_riverpod` | Explicit providers and testable state boundaries without widget-owned business logic. |
| Local persistence | `shared_preferences` behind a MoneyKai storage service | Small dependency surface for early local state, with a `moneykai.*` namespace, schema version metadata, and a namespace reset boundary. More complex transaction storage can move to SQLite/Drift/Isar only when query complexity justifies it. |
| Diagnostics | Local bounded error reports in the MoneyKai storage namespace | Captures uncaught Flutter, platform dispatcher, and root-zone errors without adding a remote crash service before credentials/config exist. |
| Formatting | `intl` | INR and date formatting without hand-written locale formatting. |

## Folder structure

```text
lib/
  app/
  core/
    constants/
    diagnostics/
    formatters/
    storage/
  features/
    auth/
    budget/
    dashboard/
    insights/
    onboarding/
    settings/
    transactions/
  routing/
  shared/
    widgets/
  theme/
test/
```

Rules:

- Feature code owns feature models, state, repositories, and presentation.
- `core` holds cross-feature infrastructure such as constants, formatting, and storage primitives.
- `shared` holds generic UI widgets with no product-specific business rules.
- `routing` owns route names and router construction.
- `theme` owns colors and Material 3 component styling.
- Widgets may hold transient UI state, but transaction, budget, auth, and persistence logic should live outside widget files.

## Initial route map

| Route | Screen |
| --- | --- |
| `/splash` | Splash/onboarding |
| `/auth/sign-in` | Local auth |
| `/dashboard` | Dashboard tab |
| `/transactions` | Transactions tab |
| `/transactions/add` | Add transaction stack route |
| `/budget` | Budget tab |
| `/insights` | Insights tab |
| `/settings` | Settings tab |
| `/privacy` | Privacy/security stack route |

## Current implementation state

The Phase 3 implementation is an app shell, not the full MVP:

- Splash and local auth screens are reachable.
- Bottom navigation is wired across dashboard, transactions, budget, insights, and settings.
- Add transaction and privacy screens are stack routes.
- Visible actions either navigate or display a coming-soon message.
- Theme uses off-white backgrounds, deep text, and restrained teal accent.
- Flutter Material icons are used to avoid the previous React Native icon-font `NO GLYPH` issue.

## Deferred feature work

The next phases should add:

- Local session persistence.
- Transaction model/repository/controller.
- Add transaction validation and save.
- Transaction list search/filter/delete.
- Budget model/repository/controller.
- Insight calculations and chart widgets.
- Focused unit and widget tests for each feature.

## Verification commands

Run from `apps/MoneyKai-flutter`:

```powershell
flutter analyze
flutter test
flutter build apk --debug
```

On this Windows machine, iOS build verification is not available. iOS compatibility is maintained by using Flutter shared UI and avoiding Android-only packages in the app layer.
