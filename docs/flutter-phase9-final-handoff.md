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
- Local sign in / local account creation boundary.
- Dashboard with balance, income, expense, and record count.
- Add transaction flow for local income and expenses.
- Transactions list with search, income/expense filters, and delete.
- Budget screen with monthly and category limits.
- Insights screen from local transaction data.
- Settings screen with profile display, privacy link, local JSON export to clipboard, encrypted backup export, namespace reset, and sign out.
- Privacy/security screen describing the local-only MVP boundary.

Core architecture:

- Feature-first Flutter structure under `lib\features`.
- Shared routing through `go_router`.
- State management through `flutter_riverpod`.
- Local persistence through `shared_preferences` behind a MoneyKai storage service.
- `moneykai.*` local storage namespace and `moneykai.storageSchemaVersion`.
- Password-encrypted backup exports using AES-256-GCM and PBKDF2-HMAC-SHA256.
- Bounded local error reports for uncaught Flutter, platform dispatcher, and root-zone failures.
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
- Local JSON export copies the current profile, transactions, and budget snapshot to the clipboard without adding storage or sharing permissions.
- Encrypted backup export creates a password-protected JSON file through the Android/iOS share sheet.
- Local error capture records uncaught failures without adding permissions or a remote crash SDK.
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
| Size | `190664098` bytes |
| SHA-256 | `D8B4B32E3869F91694BC9FB02F0CFD948942801F8099F2AB63244DDAE92EBD6D` |
| Built | `2026-06-29 13:19:34` local time |

Unsigned release APK for binary inspection only:

```text
D:\Work\Project\MoneyKai\apps\MoneyKai-flutter\build\app\outputs\flutter-apk\app-release.apk
```

| Field | Value |
| --- | --- |
| Size | `52716963` bytes |
| SHA-256 | `3B8906F7343B3C32CD6759588A9310B7AD0CC0B956F5A9B95606979281E5E6C2` |
| Built | `2026-06-29 13:19:48` local time |
| Signing | Unsigned; not Play-ready |

Unsigned release AAB for binary inspection only:

```text
D:\Work\Project\MoneyKai\apps\MoneyKai-flutter\build\app\outputs\bundle\release\app-release.aab
```

| Field | Value |
| --- | --- |
| Size | `51613455` bytes |
| SHA-256 | `77FC6FEF3DFDF0488FB183CD2E8C87D9D6888D7CD26373646100BFC427170BA4` |
| Built | `2026-06-29 13:11:55` local time |
| Signing | Unsigned; not Play-ready |

Screenshot evidence:

- `.codex-artifacts\moneykai-qa5-visual-contact-sheet.png`
- `.codex-artifacts\moneykai-qa6-dark-visual-contact-sheet.png`
- `.codex-artifacts\moneykai-qa5-visual-*.png`
- `.codex-artifacts\moneykai-qa6-dark-visual-*.png`

Accessibility evidence:

- `.codex-artifacts\moneykai-qa4-a11y-focus-summary.txt`
- `.codex-artifacts\moneykai-window-qa4-a11y-*.xml`

## Verification

Latest verified commands from `apps\MoneyKai-flutter`:

```powershell
dart format lib test
flutter analyze
flutter test
flutter build apk --debug
flutter build apk --release
flutter build appbundle --release
```

Latest Android binary checks:

```powershell
aapt2 dump permissions build\app\outputs\flutter-apk\app-debug.apk
aapt2 dump permissions build\app\outputs\flutter-apk\app-release.apk
apksigner verify --verbose build\app\outputs\flutter-apk\app-release.apk
jarsigner -verify -verbose -certs build\app\outputs\bundle\release\app-release.aab
```

Observed status:

- Formatting passed.
- Analyzer passed.
- Tests passed.
- Debug APK build passed.
- Unsigned release APK build passed.
- Unsigned release AAB build passed.
- Release APK and AAB are intentionally unsigned without `MONEYKAI_UPLOAD_*` env vars.

## Remaining Work

Required before Play Store internal testing:

- Provide/create the Android upload keystore.
- Set all `MONEYKAI_UPLOAD_*` environment variables.
- Rebuild signed release APK/AAB.
- Capture signed artifact SHA-256 and signer certificate.
- Smoke test the release-signed artifact.
- Run real TalkBack spoken-output QA.
- Run physical-device performance and cold-start QA.

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
- Backup restore/import.
- Remote crash/error reporting dashboard integration.
- Larger-history storage migration to SQLite/Drift/Isar if transaction volume grows.
