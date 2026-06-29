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
The release audit script also fails on partial signing env, unexpected signed artifacts when no upload-key env is set, compiled APK identity/version/SDK/label/launch/ABI drift, restricted permissions, missing artifacts, or unsigned artifacts when `-RequireSigned` is used.

## iOS Static Audit

The Windows/Linux-compatible iOS audit checks the shared iOS project identity and asset readiness before Mac/Xcode validation is available:

```powershell
.\tool\audit_ios_project.ps1
```

It verifies the bundle id, display name, Flutter version placeholders, minimum iOS deployment target, app icon set, launch images, absence of sensitive iOS permission declarations, and absence of known Android-only dependencies. It does not replace simulator, real-device, archive, or TestFlight QA on macOS.

## CI

GitHub Actions workflow:

```text
.github\workflows\moneykai-flutter-android.yml
```

The workflow runs formatting, analyzer, tests, the iOS static project audit, Android debug/release builds, unsigned AAB build, and the Android artifact audit for changes under `apps\MoneyKai-flutter`.

## Android Runtime QA

Collect launch timing, a binary PNG screenshot, UI hierarchy, and device properties after connecting an Android device:

```powershell
.\tool\collect_android_runtime_qa.ps1 -Install
```

For the required physical-device release gate, use:

```powershell
.\tool\collect_android_runtime_qa.ps1 -Install -RequirePhysical
```

The script writes evidence files under the repository root `.codex-artifacts` folder, records size and SHA-256 metadata in the summary, and fails if an `adb` command fails, Android launch status/timing is incomplete, the hierarchy does not include `com.moneykai.mobile`, or the device/PNG screenshot evidence is missing or empty.

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

Local QA artifacts are stored under `.codex-artifacts` at the repository root.
