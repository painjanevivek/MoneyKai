# MoneyKai Flutter

Flutter mobile app for MoneyKai.

Primary target: Android.
Secondary target: iOS with the same Flutter UI and architecture.

## Current Scope

Implemented:

- Local onboarding and local profile/session boundary.
- Dashboard with category breakdown preview, transactions, budgets with over-budget states, savings/trend insights, settings, and privacy/security.
- Add, edit, search, type/category filter, month-group, and delete local transactions.
- Persisted local budgets and transactions through `shared_preferences`.
- Local JSON export to clipboard for profile, transaction, budget, and theme data.
- Password-encrypted JSON backup export through the platform share sheet.
- Password-encrypted JSON backup restore through the platform file picker, including saved theme preference when present.
- Persisted System/Light/Dark theme preference.
- Local uncaught-error capture and in-app local diagnostics review/clear.
- MoneyKai local storage namespace reset.
- Android/iOS app icon and launch image assets.

Not implemented yet:

- Backend sync.
- Real authentication.
- Remote crash/error reporting dashboard integration.
- Play-ready upload-key signing.
- iOS archive/TestFlight build.

## Run Checks

From this directory:

```powershell
dart format lib test
flutter analyze
flutter test
flutter build apk --debug
```

Release inspection artifacts can be built without upload-key env vars:

```powershell
flutter build apk --release
flutter build appbundle --release
.\tool\audit_android_release.ps1
```

Those release outputs are unsigned unless all `MONEYKAI_UPLOAD_*` variables are configured.
After building signed release outputs with upload-key variables, run:

```powershell
.\tool\audit_android_release.ps1 -RequireSigned
```

Before Play Console upload, review the Android policy gate in `docs\flutter-play-store-policy-readiness.md`. The current Play-safe positioning is a local-first expense and budget tracker; do not describe unsupported loans, investment advice, bank sync, SMS reading, notification capture, or guaranteed outcomes.

## Android Artifacts

Debug APK:

```text
build\app\outputs\flutter-apk\app-debug.apk
```

Unsigned release APK:

```text
build\app\outputs\flutter-apk\app-release.apk
```

Unsigned release AAB:

```text
build\app\outputs\bundle\release\app-release.aab
```

Use the debug APK for direct emulator/device testing until an upload keystore is available.

## Release Signing

Set all four environment variables before building Play-ready Android artifacts:

```powershell
$env:MONEYKAI_UPLOAD_STORE_FILE="C:\path\to\upload-keystore.jks"
$env:MONEYKAI_UPLOAD_STORE_PASSWORD="<store-password>"
$env:MONEYKAI_UPLOAD_KEY_ALIAS="<key-alias>"
$env:MONEYKAI_UPLOAD_KEY_PASSWORD="<key-password>"
flutter build apk --release
flutter build appbundle --release
```

If only part of the signing env is set, Gradle fails with an explicit MoneyKai signing error.
The release audit script also fails on partial signing env, a missing/empty/in-repository upload keystore path when signing env is set, unexpected signed artifacts when no upload-key env is set, compiled APK identity/version/SDK/label/launch/ABI drift, debug/release permission allowlist drift, release debuggability, cleartext/network-security, exported-component, native-library extraction, or Android backup/data-extraction drift, missing AAB base-module or release metadata entries, missing artifacts, missing signed-artifact certificate fingerprints, or unsigned artifacts when `-RequireSigned` is used.
When `-RequireSigned` passes, the audit prints SHA-256 artifact hashes plus signer certificate evidence for both the release APK and release AAB.

## iOS Static Audit

The Windows/Linux-compatible iOS audit checks the shared iOS project identity and asset readiness before Mac/Xcode validation is available:

```powershell
.\tool\audit_ios_project.ps1
```

It verifies the bundle id, display name, Flutter version placeholders, required storyboards/runtime Info.plist keys, scene manifest/delegate launch wiring, minimum iOS deployment target, app icon set, launch images, absence of sensitive iOS permission declarations or App Transport Security overrides, and absence of known Android-only dependencies. It does not replace simulator, real-device, archive, or TestFlight QA on macOS.

## CI

GitHub Actions workflow:

```text
.github\workflows\moneykai-flutter-android.yml
```

The workflow runs formatting, analyzer, tests, the iOS static project audit, Android debug/release builds, unsigned AAB build, and the Android artifact audit for changes under `apps\MoneyKai-flutter`.

## Android Runtime QA

Collect launch timing, a binary PNG screenshot, UI hierarchy, focused-activity evidence, installed-package evidence, launch-window logcat, and device properties after connecting an Android device:

```powershell
.\tool\collect_android_runtime_qa.ps1 -Install
```

For quick debug APK testing, the default install mode remains APK. For the required signed-AAB physical-device release gate, install bundle-generated splits from the audited AAB:

```powershell
.\tool\collect_android_runtime_qa.ps1 `
  -Install `
  -InstallMode Aab `
  -RequirePhysical `
  -ClearAppData `
  -ExpectedAabSha256 239D3B916F840C12127E2F21E208C34E100F1B4D19C1703F88DD6F7585A16C95 `
  -OutputDir "../../.codex-artifacts/play-preupload/physical"
```

If `bundletool` is not on PATH, pass `-BundletoolPath C:\path\to\bundletool.jar`. To smoke the Play internal-test opt-in install instead of side-loading from bundletool, install the app from the Play opt-in link on the physical device, then run:

```powershell
.\tool\collect_android_runtime_qa.ps1 `
  -RequirePhysical `
  -ExpectedInstallerPackage com.android.vending `
  -ExpectedAabSha256 239D3B916F840C12127E2F21E208C34E100F1B4D19C1703F88DD6F7585A16C95 `
  -OutputDir "../../.codex-artifacts/play-preupload/play-internal"
```

The script writes evidence files under the repository root `.codex-artifacts` folder, records size and SHA-256 metadata in the summary, and fails if an `adb` command fails, Android launch status/timing is incomplete, the installed package does not match `com.moneykai.mobile` and the current Flutter version, the hierarchy does not include `com.moneykai.mobile` or expected text, the focused window is not MoneyKai, launch logcat shows MoneyKai crash/ANR evidence, or the device/PNG screenshot evidence is missing or empty.
It also enforces cold-start launch timing by default: `TotalTime` must be at most 5000 ms and `WaitTime` must be at most 6000 ms. Override those limits with `-MaxLaunchTotalMs` and `-MaxLaunchWaitMs` only when documenting a deliberately slower test device.
Use `-MonkeyEvents 250` only when a bounded random-tap smoke is desired for the evidence bundle.

## Documentation

Project phase docs live in the repository root `docs` folder:

- `docs\flutter-phase0-environment.md`
- `docs\flutter-phase1-previous-app-memory.md`
- `docs\flutter-phase2-mvp-scope.md`
- `docs\flutter-phase3-architecture.md`
- `docs\flutter-phase4-design-system.md`
- `docs\flutter-phase6-android-build.md`
- `docs\flutter-phase7-ios-parity.md`
- `docs\flutter-phase8-testing-self-review.md`
- `docs\flutter-phase9-final-handoff.md`
- `docs\flutter-completion-audit.md`
- `docs\flutter-play-store-policy-readiness.md`
- `docs\flutter-play-preupload-audit-2026-06-30.md`

Local QA artifacts are stored under `.codex-artifacts` at the repository root.
