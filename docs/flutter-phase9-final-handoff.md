# MoneyKai Flutter Phase 9 Final Handoff

Last reviewed: 2026-06-29

## Summary

MoneyKai now has a Flutter mobile app at:

```text
apps\MoneyKai-flutter
```

The app is Android-first and uses one shared Flutter codebase prepared for iOS. It intentionally does not reuse the old React Native implementation directly; the previous MoneyKai work was used as product and visual memory only.

## What Was Built

Implemented MVP:

- Splash/onboarding.
- Local profile/session boundary.
- Dashboard with current-month balance, income, expense, record count, budget progress, category breakdown preview, and recent activity.
- Add and edit transaction flows for local income and expenses.
- Transactions list with search, income/expense filters, category filter, month grouping, edit, and delete.
- Budget screen with monthly/category limits and over-budget states.
- Insights screen with local income, expense, savings rate, monthly trend, and top spending categories.
- Settings screen with profile display, persisted theme preference, privacy link, local diagnostics, local JSON export to clipboard, encrypted backup export/restore, namespace reset, and sign out.
- Privacy/security screen describing the local-only MVP boundary.

Core architecture:

- Feature-first Flutter structure under `lib\features`.
- Shared routing through `go_router`, with protected app routes redirecting signed-out deep links back to the local profile flow and authenticated local-profile hits back to Dashboard.
- State management through `flutter_riverpod`.
- Local persistence through `shared_preferences` behind a MoneyKai storage service.
- `moneykai.*` local storage namespace and `moneykai.storageSchemaVersion`.
- Password-encrypted backup export and restore using AES-256-GCM and PBKDF2-HMAC-SHA256.
- Bounded local error reports for uncaught Flutter, platform dispatcher, and root-zone failures, with in-app review and clear controls.
- Reusable screen shell, responsive screen scaffold, metric cards, empty states, and budget progress widgets.

## Android Readiness

Current Android identity:

```text
applicationId = com.moneykai.mobile
namespace = com.moneykai.mobile
app label = MoneyKai
version = 1.0.1+2
```

Android-ready items:

- Debug APK builds.
- Unsigned release APK builds for inspection.
- Unsigned release AAB builds for inspection.
- Android launcher icon uses the MoneyKai source mark.
- Android launch screen uses the MoneyKai source mark.
- Permission audit confirms no SMS, notification listener, contacts, camera, microphone, location, or storage permissions.
- Debug APK has been installed and smoke-tested on `MoneyKai_API_36`.
- Primary workflows have emulator QA evidence.
- Local JSON export copies the current profile, transactions, budget, and theme snapshot to the clipboard without adding storage or sharing permissions.
- Encrypted backup export creates a password-protected JSON file through the Android/iOS share sheet.
- Encrypted backup restore imports a selected password-protected JSON file and restores local profile, transactions, budget, and saved theme preference when present.
- Local error capture records uncaught failures without adding permissions or a remote crash SDK, and Settings can review or clear those reports.
- Light and dark theme screenshot QA exists for primary screens.
- Accessibility hierarchy/focus-order snapshots exist for primary screens.

Current Android blockers:

- No upload keystore was provided, so no Play-ready signed APK/AAB has been produced.
- Real TalkBack spoken-output QA is still pending.
- Physical Android device performance and cold-start QA are still pending.

## iOS Readiness

iOS-ready items:

- Same Flutter UI and state architecture is shared with Android.
- Current iOS bundle id is `com.moneykai.mobile`.
- iOS display name is `MoneyKai`.
- Direct dependencies are iOS-compatible Flutter packages:
  - `flutter`
  - `cupertino_icons`
  - `go_router`
  - `flutter_riverpod`
  - `shared_preferences`
  - `intl`
  - `cryptography`
  - `share_plus`
  - `file_selector`
- No Android-only native dependency, SMS package, notification listener package, contacts package, camera package, or WebView dependency is used in the Flutter app layer.
- iOS icon and launch image assets use the MoneyKai source mark.

iOS blockers:

- This development machine is Windows, so iOS simulator, iOS archive, IPA export, and TestFlight upload cannot be performed here.
- macOS, Xcode, Apple Developer signing, simulator QA, and real-device QA are still required.

## Artifacts

Debug APK for direct Android testing:

```text
D:\Work\Project\MoneyKai\apps\MoneyKai-flutter\build\app\outputs\flutter-apk\app-debug.apk
```

| Field | Value |
| --- | --- |
| Size | `190664156` bytes |
| SHA-256 | `DA3E28DBCA47A6A522B0DB63B913108FCEC3A3A90548051FD5A55FC8CE3F529F` |
| Built | `2026-06-29 21:20:28` local time |

Unsigned release APK for binary inspection only:

```text
D:\Work\Project\MoneyKai\apps\MoneyKai-flutter\build\app\outputs\flutter-apk\app-release.apk
```

| Field | Value |
| --- | --- |
| Size | `52831719` bytes |
| SHA-256 | `2A48EA1B253F55A53EB8E22BC6DFA471A1253F95A0C206E03F260E571975898D` |
| Built | `2026-06-29 13:57:18` local time |
| Signing | Unsigned; not Play-ready |

Unsigned release AAB for binary inspection only:

```text
D:\Work\Project\MoneyKai\apps\MoneyKai-flutter\build\app\outputs\bundle\release\app-release.aab
```

| Field | Value |
| --- | --- |
| Size | `51707694` bytes |
| SHA-256 | `FB12CC57AA140C819B864A555AC289E5C2627825154875DFAB602E6E1A952D0C` |
| Built | `2026-06-29 13:57:38` local time |
| Signing | Unsigned; not Play-ready |

Screenshot evidence:

- `.codex-artifacts\moneykai-qa5-visual-contact-sheet.png`
- `.codex-artifacts\moneykai-qa6-dark-visual-contact-sheet.png`
- `.codex-artifacts\moneykai-qa5-visual-*.png`
- `.codex-artifacts\moneykai-qa6-dark-visual-*.png`
- `.codex-artifacts\moneykai-qa9-restore-file-picker.png`
- `.codex-artifacts\moneykai-qa10-restore-dashboard.png`
- `.codex-artifacts\moneykai-qa10-restore-settings.png`
- `.codex-artifacts\moneykai-qa10-restore-transactions.png`
- `.codex-artifacts\moneykai-qa10-restore-budget.png`
- `.codex-artifacts\moneykai-qa10-restore-label-fixed.png`

Accessibility evidence:

- `.codex-artifacts\moneykai-qa4-a11y-focus-summary.txt`
- `.codex-artifacts\moneykai-window-qa4-a11y-*.xml`

## Verification

Latest verified commands from `apps\MoneyKai-flutter`:

```powershell
dart format lib test
flutter analyze
flutter test
.\tool\audit_ios_project.ps1
flutter build apk --debug
flutter build apk --release
flutter build appbundle --release
.\tool\audit_android_release.ps1
```

GitHub Actions also runs the same Flutter Android check loop plus the static iOS project audit for app changes:

```text
.github\workflows\moneykai-flutter-android.yml
```

Latest Android binary checks:

```powershell
aapt2 dump permissions build\app\outputs\flutter-apk\app-debug.apk
aapt2 dump permissions build\app\outputs\flutter-apk\app-release.apk
apksigner verify --verbose build\app\outputs\flutter-apk\app-release.apk
jarsigner -verify -verbose -certs build\app\outputs\bundle\release\app-release.aab
.\tool\audit_android_release.ps1
```

Observed status:

- Formatting passed.
- Analyzer passed.
- Tests passed.
- Debug APK build passed.
- Unsigned release APK build passed.
- Unsigned release AAB build passed.
- Release APK and AAB are intentionally unsigned without `MONEYKAI_UPLOAD_*` env vars.
- Repeatable Android release audit passed for the current unsigned inspection artifacts.

## Remaining Work

The current requirement-by-requirement completion status is tracked in:

```text
docs\flutter-completion-audit.md
```

Required before Play Store internal testing:

- Provide/create the Android upload keystore.
- Set all `MONEYKAI_UPLOAD_*` environment variables.
- Rebuild signed release APK/AAB.
- Capture signed artifact SHA-256 and signer certificate.
- Smoke test the release-signed artifact.
- Run real TalkBack spoken-output QA.
- Run physical-device performance and cold-start QA.

Physical-device evidence can be collected with:

```powershell
cd apps\MoneyKai-flutter
.\tool\collect_android_runtime_qa.ps1 -Install -RequirePhysical
```

Required before TestFlight:

- Move to macOS with Xcode installed.
- Run `flutter doctor -v` on macOS.
- Configure Apple Developer team and provisioning.
- Run iOS simulator QA.
- Run iOS real-device QA.
- Archive and upload through Xcode Organizer.

Future product/infrastructure work:

- Backend sync boundary implementation.
- Real authentication.
- Remote crash/error reporting dashboard integration.
- Larger-history storage migration to SQLite/Drift/Isar if transaction volume grows.
