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
.\tool\audit_ios_project.ps1
flutter build apk --debug
flutter build apk --release
flutter build appbundle --release
```

Current result:

- Formatting completed.
- `flutter analyze` found no issues.
- `flutter test` passed.
- `.\tool\audit_ios_project.ps1` passed.
- Debug APK built successfully.
- Unsigned release APK and AAB artifacts built successfully for inspection.

## Test coverage currently present

Unit/repository tests:

- Local auth session save, restore, clear, profile field trimming, invalid-field rejection, malformed-session fallback, and invalid stored-profile fallback.
- Local transaction persistence in newest-first order, malformed-payload fallback, malformed-entry/amount skipping, blank required-field handling, and non-finite amount rejection.
- Local budget persistence, reset, malformed-payload fallback, invalid stored-limit/category fallback, and non-finite limit rejection.
- Budget progress calculation by current month and category.
- Local storage schema initialization and MoneyKai namespace reset.
- Local error report persistence, malformed payload handling, blank required-field skipping, newest-first order, read/write bounded history, and clear action.
- Theme preference persistence, stored-value trimming, and unsupported-value fallback to system theme mode.
- Local data export JSON requires a local profile and includes user, transactions, budget, theme settings, source, format version, and timestamp.
- Encrypted backup export requires a local profile and produces password-protected AES-GCM JSON with local profile, transactions, budget, and theme settings; it rejects short passwords, unsupported encryption metadata, malformed backup metadata, invalid base64 payloads, invalid encryption field lengths, empty encrypted payloads, and fails decryption with the wrong password.
- Encrypted backup restore validates decrypted contents before reset, rejects wrong passwords/malformed payloads/invalid users/invalid money values, preserves existing local data on invalid-user restore failure, resets only the MoneyKai namespace for valid restores, restores user, transactions, and budget, and restores theme settings when present.

Widget tests:

- Splash opens local profile flow.
- Local profile rejects invalid email before creating a session.
- App shell renders on compact Android viewport.
- App shell renders on larger iOS-style viewport.
- Dashboard category breakdown preview opens Insights.
- Insights render savings rate and monthly trend from local data.
- Budget screen shows category over-budget states.
- Add transaction and budget forms reject non-finite numeric input.
- Settings persists System/Light/Dark theme preference.
- Settings local diagnostics review and clear action.
- Add/edit/delete transaction flow works.
- Transactions group by month and filter by category.
- Settings export-to-clipboard, reset confirmation, and confirmed reset-to-profile-entry respond.
- Settings encrypted-backup password validation responds.
- Settings encrypted-backup restore action is visible.

## Current functional state

Implemented:

- Local profile/session boundary with trimmed profile fields plus UI, repository-level, and stored-session email-shape validation.
- Splash/onboarding entry.
- Dashboard using local transaction, budget, and category breakdown data.
- Add transaction with validation.
- Transactions list with search, income/expense filter, category filter, month grouping, edit, and delete.
- Budget monthly/category limits with persisted local settings, over-budget states, and tap-to-replace editing.
- Insights from local transaction data, including income, expense, savings rate, monthly trend, and top spending categories.
- Settings profile display, theme preference, privacy link, local diagnostics, local-profile-gated JSON export to clipboard, encrypted backup export/restore through platform file flows, namespace reset, and sign out.
- Privacy/security screen explaining local export, encrypted backup, diagnostics, and future sync/auth boundaries.
- Local uncaught-error capture for Flutter, platform dispatcher, and root-zone failures, with in-app review and clear controls.

## Self-review findings

### Robustness

- Local persistence is simple and deterministic through `shared_preferences`.
- Local storage initializes `moneykai.storageSchemaVersion` and has a `moneykai.*` namespace reset boundary for device data.
- JSON parsing falls back to signed-out auth, default budget, and valid transaction entries when stored local payloads are malformed or contain invalid local profile data.
- Transaction reads reject invalid stored money values and blank required fields, budget reads reject invalid stored limits/categories, and transaction/budget repositories reject invalid values before local JSON persistence.
- Release signing no longer silently uses the debug key; release builds are unsigned unless all upload-key env vars are provided.
- Startup config records uncaught Flutter, platform dispatcher, and root-zone failures to a read/write bounded local `moneykai.errorReports` history, and diagnostics reads skip malformed or blank required fields.
- Users can review and clear bounded local diagnostics from Settings without adding a remote crash SDK.

Remaining:

- Local storage is not encrypted.
- No non-trivial migration has been needed beyond the current schema-version marker.
- No remote crash/error reporting dashboard is configured yet.

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
- Android light-theme screenshot review was captured for onboarding, auth, dashboard, transactions, add transaction, budget, insights, settings, and privacy/security.
- Android dark-theme screenshot review was captured for the same primary screens.

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
- Local export copies a plaintext JSON snapshot to the clipboard without adding storage or sharing permissions.
- Encrypted backup export creates a password-protected JSON file with AES-256-GCM and PBKDF2-HMAC-SHA256 through the platform share sheet.
- Local export and encrypted backup creation require a valid local profile, preventing unusable signed-out backup payloads.
- Encrypted backup decrypt validates format version, algorithm, KDF, iteration count, metadata, base64 fields, salt/nonce/MAC lengths, and encrypted payload presence before decryption so unsupported or malformed files fail through controlled format errors.
- Encrypted backup restore decrypts a selected backup file and restores the local profile, transactions, budget, and saved theme setting after confirmation through the password prompt.
- Privacy screen states the current local-only data boundary, including plaintext export contents, encrypted backup flow, and local diagnostics.
- Local reset clears the full MoneyKai shared-preferences namespace and returns to local auth.
- Local diagnostics stay on-device and can be cleared from Settings.
- Encrypted backup restore validates the profile boundary before clearing local data, so malformed backup users cannot erase the current local session.

Remaining:

- iOS simulator/device QA for encrypted backup selected-file restore is still pending. Android emulator selected-file restore from Downloads is complete.

## Manual QA status

Completed on `MoneyKai_API_36`:

- Fresh install.
- App launch to onboarding screen.
- Local profile creation.
- App restart session restore.
- Add income transaction.
- Add expense transaction.
- Edit transaction.
- Search, type-filter, category-filter, and month-group transactions.
- Delete transaction.
- Budget progress update.
- Update monthly and category budgets.
- Verify export action feedback on device.
- Verify encrypted backup password validation on device.
- Verify encrypted backup share sheet on device.
- Verify encrypted backup restore file-picker launch on device.
- Run end-to-end encrypted backup restore from an actual selected file on device.
- Run 1.3 font-scale visual QA for the Settings screen.
- Capture Android accessibility hierarchy/focus-order snapshots for primary screens.
- Capture Android light-theme screenshot visual QA for primary screens.
- Capture Android dark-theme screenshot visual QA for primary screens.
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
- `.codex-artifacts\moneykai-window-qa7-settings-before-export.xml`
- `.codex-artifacts\moneykai-window-qa7-export-copied.xml`
- `.codex-artifacts\moneykai-qa7-export-copied.png`
- `.codex-artifacts\moneykai-window-qa8-settings-encrypted-backup.xml`
- `.codex-artifacts\moneykai-window-qa8-encrypted-backup-short-password.xml`
- `.codex-artifacts\moneykai-window-qa8-encrypted-backup-share-sheet.xml`
- `.codex-artifacts\moneykai-qa8-encrypted-backup-share-sheet.png`
- `.codex-artifacts\moneykai-window-qa9-settings-restore-backup.xml`
- `.codex-artifacts\moneykai-window-qa9-restore-file-picker.xml`
- `.codex-artifacts\moneykai-qa9-restore-file-picker.png`
- `.codex-artifacts\moneykai-qa10-04-settings-before-restore.xml`
- `.codex-artifacts\moneykai-qa10-07-downloads-list.xml`
- `.codex-artifacts\moneykai-qa10-09-after-restore.xml`
- `.codex-artifacts\moneykai-qa10-10-settings-after-restore.xml`
- `.codex-artifacts\moneykai-qa10-11-transactions-after-restore.xml`
- `.codex-artifacts\moneykai-qa10-12-budget-after-restore.xml`
- `.codex-artifacts\moneykai-qa10-14-restore-label-fixed.xml`
- `.codex-artifacts\moneykai-qa10-restored-shared-prefs.xml`
- `.codex-artifacts\moneykai-qa10-restore-dashboard.png`
- `.codex-artifacts\moneykai-qa10-restore-settings.png`
- `.codex-artifacts\moneykai-qa10-restore-transactions.png`
- `.codex-artifacts\moneykai-qa10-restore-budget.png`
- `.codex-artifacts\moneykai-qa10-restore-label-fixed.png`
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
- `.codex-artifacts\moneykai-qa5-visual-01-onboarding.png`
- `.codex-artifacts\moneykai-qa5-visual-02-auth.png`
- `.codex-artifacts\moneykai-qa5-visual-03-dashboard-empty.png`
- `.codex-artifacts\moneykai-qa5-visual-04-transactions-empty.png`
- `.codex-artifacts\moneykai-qa5-visual-05-add-transaction.png`
- `.codex-artifacts\moneykai-qa5-visual-06-transactions-populated.png`
- `.codex-artifacts\moneykai-qa5-visual-07-dashboard-populated.png`
- `.codex-artifacts\moneykai-qa5-visual-08-budget-populated.png`
- `.codex-artifacts\moneykai-qa5-visual-09-insights-populated.png`
- `.codex-artifacts\moneykai-qa5-visual-10-settings.png`
- `.codex-artifacts\moneykai-qa5-visual-11-privacy.png`
- `.codex-artifacts\moneykai-qa5-visual-contact-sheet.png`
- `.codex-artifacts\moneykai-qa6-dark-visual-01-onboarding.png`
- `.codex-artifacts\moneykai-qa6-dark-visual-02-auth.png`
- `.codex-artifacts\moneykai-qa6-dark-visual-03-dashboard-empty.png`
- `.codex-artifacts\moneykai-qa6-dark-visual-04-transactions-empty.png`
- `.codex-artifacts\moneykai-qa6-dark-visual-05-add-transaction.png`
- `.codex-artifacts\moneykai-qa6-dark-visual-06-transactions-populated.png`
- `.codex-artifacts\moneykai-qa6-dark-visual-07-dashboard-populated.png`
- `.codex-artifacts\moneykai-qa6-dark-visual-08-budget-populated.png`
- `.codex-artifacts\moneykai-qa6-dark-visual-09-insights-populated.png`
- `.codex-artifacts\moneykai-qa6-dark-visual-10-settings.png`
- `.codex-artifacts\moneykai-qa6-dark-visual-11-privacy.png`
- `.codex-artifacts\moneykai-qa6-dark-visual-contact-sheet.png`

Still required on an Android emulator or physical device:

- Run real TalkBack spoken-output QA.
- Run physical-device performance and cold-start checks.

Runtime evidence collector:

```powershell
cd apps\MoneyKai-flutter
.\tool\collect_android_runtime_qa.ps1 -Install
.\tool\collect_android_runtime_qa.ps1 -Install -RequirePhysical
```

The `-RequirePhysical` variant intentionally fails on emulators and should be used for the remaining physical-device release gate.

On macOS/Xcode later:

- iOS simulator run.
- iOS real-device run.
- iOS keyboard/date-picker/safe-area QA.
- iOS archive/TestFlight path.

## Known limitations

- No production upload keystore was provided, so no Play-ready release AAB was produced.
- Android emulator scoped manual QA is partially complete, but real TalkBack spoken-output and physical-device QA are still pending.
- No iOS build was possible on Windows.
- Backend sync, real auth, remote crash/error reporting dashboard integration, and store submission remain future work.
