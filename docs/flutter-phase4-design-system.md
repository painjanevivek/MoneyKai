# MoneyKai Flutter Phase 4 Design System

Last reviewed: 2026-06-29

## Stitch availability

Google Stitch MCP was searched through the available Codex tools and was not available in this session. Phase 4 therefore uses a manual Flutter-native design system based on:

- Previous MoneyKai screenshots and theme files.
- The Phase 1 previous-app memory.
- The Phase 2 MVP scope.
- Flutter Material 3 components.

## Direction

MoneyKai should feel like a calm finance utility:

- White/off-white base.
- Deep readable text.
- Restrained teal/emerald primary accent.
- High-contrast destructive states.
- No loud gradients.
- No cluttered dashboard.
- No icon-font dependency that can render `NO GLYPH`.

## Tokens

The first token layer lives in:

```text
apps/MoneyKai-flutter/lib/theme/app_tokens.dart
```

It defines:

- `AppSpacing`
- `AppRadii`
- `AppBreakpoints`
- `AppInsets`

`AppTheme` consumes these tokens for Material 3 cards, buttons, inputs, scaffold background, and color scheme.

## Shared components

Current reusable widgets:

- `AppShell`: bottom navigation shell.
- `ScreenScaffold`: constrained, responsive page wrapper.
- `MetricCard`: dashboard/report metric container.
- `EmptyState`: reusable empty or not-yet-populated state.

Existing Flutter/Material controls are preferred for familiar patterns:

- `FilledButton` and `OutlinedButton` for actions.
- `NavigationBar` for tabs.
- `SearchBar` for transaction search.
- `SegmentedButton` for transaction filters.
- `IconButton` with tooltips for icon-only actions.

## Responsive behavior

`ScreenScaffold` centers content and constrains it to `760` logical pixels. This keeps small Android layouts readable while avoiding stretched content on larger iOS/tablet-sized screens.

Widget tests cover:

- Compact Android-style viewport: `320 x 700`.
- Larger iOS-style viewport: `834 x 1112`.

## Current limitations

- App icon is still the generated Flutter placeholder and must be replaced before release prep.
- Feature widgets are structural placeholders until the transaction/budget implementation phases.
- Dark theme exists from Material 3 seed colors but has not had full visual QA yet.
- No screenshot-based visual regression gate exists yet.

## Verification

Run from `apps/MoneyKai-flutter`:

```powershell
dart format lib test
flutter analyze
flutter test
flutter build apk --debug
```
