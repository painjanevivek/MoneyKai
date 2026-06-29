# MoneyKai Flutter Phase 8 Testing And Self-Review

Last reviewed: 2026-06-29

## Automated verification run

Run from:

```text
apps/MoneyKai-flutter
```

Commands verified:

```powershell
dart format lib test
flutter analyze
flutter test
flutter build apk --debug
flutter build apk --release
flutter build appbundle --release
```

Current result:

- Formatting completed.
- `flutter analyze` found no issues.
- `flutter test` passed.
- Debug APK built successfully.
- Unsigned release APK and AAB artifacts built successfully for inspection.

## Test coverage currently present

Unit/repository tests:

- Local auth session save, restore, and clear.
- Local transaction persistence in newest-first order.
- Local budget persistence and reset.
- Budget progress calculation by current month and category.
- Local storage schema initialization and MoneyKai namespace reset.

Widget tests:

- Splash opens local auth flow.
- App shell renders on compact Android viewport.
- App shell renders on larger iOS-style viewport.
- Add/delete transaction flow works.
- Settings export placeholder, reset confirmation, and confirmed reset-to-auth respond.

## Current functional state

Implemented:

- Local account/session boundary.
- Splash/onboarding entry.
- Dashboard using local transaction and budget data.
- Add transaction with validation.
- Transactions list with search, income/expense filter, and delete.
- Budget monthly/category limits with persisted local settings and tap-to-replace editing.
- Insights from local transaction data.
- Settings profile display, privacy link, export placeholder, namespace reset, and sign out.
- Privacy/security screen explaining local-only MVP and permission boundaries.

## Self-review findings

### Robustness

- Local persistence is simple and deterministic through `shared_preferences`.
- Local storage initializes `moneykai.storageSchemaVersion` and has a `moneykai.*` namespace reset boundary for device data.
- JSON parsing currently falls back to defaults/empty lists when stored payload shape is invalid.
- Release signing no longer silently uses the debug key; release builds are unsigned unless all upload-key env vars are provided.

Remaining:

- Local storage is not encrypted.
- No non-trivial migration has been needed beyond the current schema-version marker.
- No crash/error reporting is configured in the Flutter app yet.

### Scalability

- Feature-first folders are in place.
- Repositories and controllers are separate from presentation widgets.
- Remote sync can be added behind repository boundaries later.

Remaining:

- `shared_preferences` is acceptable for MVP data volume, but larger transaction histories should move to SQLite/Drift/Isar before production scale.
- No pagination or virtualization work has been done beyond normal Flutter lists.

### Efficiency

- Current screens use lightweight Material widgets and local data.
- No WebView or heavy native permission packages are present.

Remaining:

- No performance profiling has been run on a physical Android device.
- No cold-start or large-history benchmark exists yet.

### UI polish

- Design tokens, theme, app shell, metric cards, budget progress card, empty states, and responsive screen wrapper exist.
- Responsive widget tests cover compact and larger viewports.
- Flutter Material icons avoid the old React Native icon-font `NO GLYPH` problem.
- Android and iOS launcher icon assets now use the existing MoneyKai production mark.
- Android and iOS native launch images now use the existing MoneyKai production mark.
- Bottom navigation labels are clamped to the standard navigation text scale so they do not wrap or clip at 1.3 Android font scale.
- Budget limit fields select the current value on tap so emulator and device edits replace instead of accidentally appending to existing numbers.

Remaining:

- No full screenshot-based visual review has been captured across every Flutter screen yet.
- Dark theme exists but has not had full visual QA.

### Accessibility

- Major icon-only actions use tooltips.
- Standard Material form fields/buttons/navigation are used.
- A 1.3 Android font-scale Settings screen pass was captured after fixing bottom navigation label wrapping.
- Android accessibility hierarchy/focus-order snapshots were captured for onboarding, auth, dashboard, transactions, budget, insights, settings, and privacy/security.
- Primary actionable controls expose labels in the hierarchy, including auth fields, bottom navigation, filter buttons, add/save/delete actions, settings actions, and the privacy back button.

Remaining:

- A real TalkBack spoken-output pass still needs manual QA on a device or emulator session where TalkBack can be operated interactively.

### Security/privacy

- The MVP does not request SMS, notification listener, contacts, camera, microphone, location, or storage permissions.
- Export is clearly marked coming soon.
- Privacy screen states the current local-only data boundary.
- Local reset clears the full MoneyKai shared-preferences namespace and returns to local auth.

Remaining:

- No encrypted backup/export exists yet.

## Manual QA status

Completed on `MoneyKai_API_36`:

- Fresh install.
- App launch to onboarding screen.
- Local account creation.
- App restart session restore.
- Add income transaction.
- Add expense transaction.
- Search/filter transactions.
- Delete transaction.
- Budget progress update.
- Update monthly and category budgets.
- Verify export placeholder snackbar on device.
- Run 1.3 font-scale visual QA for the Settings screen.
- Capture Android accessibility hierarchy/focus-order snapshots for primary screens.
- Reset local data.
- Sign out.
- Reopen app after restart and verify persisted state.

Evidence artifacts captured locally:

- `.codex-artifacts\moneykai-flutter-emulator-smoke.png`
- `.codex-artifacts\moneykai-window-dashboard-after-restart-open.xml`
- `.codex-artifacts\moneykai-window-transactions-after-add.xml`
- `.codex-artifacts\moneykai-window-budget-after-expense.xml`
- `.codex-artifacts\moneykai-window-insights-after-expense.xml`
- `.codex-artifacts\moneykai-window-after-sign-out.xml`
- `.codex-artifacts\moneykai-window-qa2-transactions-income-expense.xml`
- `.codex-artifacts\moneykai-window-qa2-filter-income.xml`
- `.codex-artifacts\moneykai-window-qa2-filter-expense.xml`
- `.codex-artifacts\moneykai-window-qa2-search-salary.xml`
- `.codex-artifacts\moneykai-window-qa2-export-placeholder.xml`
- `.codex-artifacts\moneykai-qa2-settings-fontscale-13-fixed.png`
- `.codex-artifacts\moneykai-window-qa3-budget-monthly-edit.xml`
- `.codex-artifacts\moneykai-window-qa3-budget-category-edit.xml`
- `.codex-artifacts\moneykai-window-qa3-budget-after-restart.xml`
- `.codex-artifacts\moneykai-window-qa4-a11y-onboarding.xml`
- `.codex-artifacts\moneykai-window-qa4-a11y-auth.xml`
- `.codex-artifacts\moneykai-window-qa4-a11y-dashboard.xml`
- `.codex-artifacts\moneykai-window-qa4-a11y-transactions.xml`
- `.codex-artifacts\moneykai-window-qa4-a11y-budget.xml`
- `.codex-artifacts\moneykai-window-qa4-a11y-insights.xml`
- `.codex-artifacts\moneykai-window-qa4-a11y-settings.xml`
- `.codex-artifacts\moneykai-window-qa4-a11y-privacy.xml`
- `.codex-artifacts\moneykai-qa4-a11y-focus-summary.txt`

Still required on an Android emulator or physical device:

- Run real TalkBack spoken-output QA.
- Run physical-device performance and cold-start checks.

On macOS/Xcode later:

- iOS simulator run.
- iOS real-device run.
- iOS keyboard/date-picker/safe-area QA.
- iOS archive/TestFlight path.

## Known limitations

- No production upload keystore was provided, so no Play-ready release AAB was produced.
- Android emulator scoped manual QA is partially complete, but real TalkBack spoken-output and physical-device QA are still pending.
- No iOS build was possible on Windows.
- Backend sync, real auth, encrypted export/backup, and store submission remain future work.
