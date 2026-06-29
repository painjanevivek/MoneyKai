# MoneyKai Flutter Phase 6 Android Build Loop

Last reviewed: 2026-06-29

## Current Android build state

The Flutter app lives at:

```text
apps/MoneyKai-flutter
```

Current version:

```text
1.0.1+2
```

Android identity:

```text
applicationId = com.moneykai.mobile
namespace = com.moneykai.mobile
app label = MoneyKai
```

Launcher icon:

```text
Source: apps\MoneyKai-mobile\assets\images\icon.png
Generated Android densities: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi
Source SHA-256: 1190F049F658A20CF5FA36FF314A4E4ED9CC6EEEE17C1001D7DB5D0426776292
xxxhdpi SHA-256: 3A2EB54675B564E3EB54745FE5EFA7EF74AF72A562E5BDB6A8F236B07BAD0C13
```

Launch screen:

```text
Source: apps\MoneyKai-mobile\assets\images\icon.png
Android image: apps\MoneyKai-flutter\android\app\src\main\res\drawable-nodpi\launch_image.png
Android image SHA-256: 18A4F7F1A3D5250719A75C47D582BA63878B40F0320E7DE9E31EA5DC5BE7909C
```

## Verification commands

Run from `apps/MoneyKai-flutter` with Flutter on `PATH`:

```powershell
dart format lib test
flutter analyze
flutter test
flutter build apk --debug
flutter build apk --release
flutter build appbundle --release
.\tool\audit_android_release.ps1
```

Latest verified result:

- `flutter analyze`: passed.
- `flutter test`: passed.
- `flutter build apk --debug`: passed.
- `flutter build apk --release`: passed with no upload-key env vars; produced an unsigned inspection artifact.
- `flutter build appbundle --release`: passed with no upload-key env vars; produced an unsigned inspection artifact.
- `.\tool\audit_android_release.ps1`: passed for current unsigned inspection artifacts and reports unsigned release signing state.
- `.\tool\audit_android_release.ps1` with a partial signing environment: failed as expected.

The same Flutter Android check loop is also wired into GitHub Actions:

```text
.github\workflows\moneykai-flutter-android.yml
```

That workflow runs formatting, analyzer, tests, the static iOS project audit, debug APK build, unsigned release APK build, unsigned release AAB build, and `.\tool\audit_android_release.ps1` on push/PR changes touching the Flutter app or Flutter docs.

## Debug APK

Latest debug artifact:

```text
D:\Work\Project\MoneyKai\apps\MoneyKai-flutter\build\app\outputs\flutter-apk\app-debug.apk
```

Artifact metadata:

| Field | Value |
| --- | --- |
| Size | `190664156` bytes |
| SHA-256 | `9850687C163146B3E75F78261028B4A1993DD4A6F5922499123AFE048A79C5AF` |
| Built | `2026-06-29 22:22:18` local time |

Install for direct Android testing:

```powershell
adb install -r D:\Work\Project\MoneyKai\apps\MoneyKai-flutter\build\app\outputs\flutter-apk\app-debug.apk
```

## Unsigned release artifacts

Current release builds intentionally do not fall back to debug signing. With no `MONEYKAI_UPLOAD_*` environment variables set, Gradle produces unsigned release artifacts for binary inspection only.

Latest unsigned release APK:

```text
D:\Work\Project\MoneyKai\apps\MoneyKai-flutter\build\app\outputs\flutter-apk\app-release.apk
```

| Field | Value |
| --- | --- |
| Size | `52831719` bytes |
| SHA-256 | `2A48EA1B253F55A53EB8E22BC6DFA471A1253F95A0C206E03F260E571975898D` |
| Built | `2026-06-29 13:57:18` local time |
| Signing check | `apksigner verify --verbose` returns `DOES NOT VERIFY`; `Missing META-INF/MANIFEST.MF` |

Latest unsigned release AAB:

```text
D:\Work\Project\MoneyKai\apps\MoneyKai-flutter\build\app\outputs\bundle\release\app-release.aab
```

| Field | Value |
| --- | --- |
| Size | `51707694` bytes |
| SHA-256 | `FB12CC57AA140C819B864A555AC289E5C2627825154875DFAB602E6E1A952D0C` |
| Built | `2026-06-29 13:57:38` local time |
| Signing check | `jarsigner -verify -verbose -certs` reports `jar is unsigned` |

These unsigned artifacts are not Play-ready and should not be treated as installable release candidates. Use the debug APK for direct emulator/device testing until an upload keystore is provided, then rebuild signed release outputs.

## Device and emulator status

`flutter emulators` shows one Android emulator:

```text
MoneyKai_API_36
```

Latest emulator smoke:

| Field | Value |
| --- | --- |
| Date | `2026-06-29` |
| Device | `emulator-5554` from `MoneyKai_API_36` |
| Install | Fresh `adb uninstall com.moneykai.mobile` followed by `adb install -r app-debug.apk` |
| Launch | `adb shell am start -n com.moneykai.mobile/.MainActivity` |
| Result | App process started and onboarding screen rendered |
| Screenshot | `.codex-artifacts\moneykai-flutter-emulator-smoke.png` |

Scoped manual QA on the same emulator also verified local account creation, income add, expense add/delete, transaction income/expense filters, transaction search, dashboard persistence after force-stop/start, monthly and category budget value edits with restart persistence, budget and insights updates from expenses, export action feedback, encrypted backup password validation, Android share sheet launch, encrypted backup selected-file restore from Downloads, reset confirmation/success, sign out back to local auth, Android accessibility hierarchy labels/focus order across the primary screens, Android light-theme and dark-theme screenshot visual review across the primary screens, and a 1.3 font-scale Settings screen pass after the bottom navigation label fix. Evidence snapshots are stored locally under `.codex-artifacts\moneykai-window-*.xml`, `.codex-artifacts\moneykai-qa4-a11y-focus-summary.txt`, `.codex-artifacts\moneykai-qa5-visual-*.png`, `.codex-artifacts\moneykai-qa6-dark-visual-*.png`, `.codex-artifacts\moneykai-qa10-*.xml`, and `.codex-artifacts\moneykai-qa2-settings-fontscale-13-fixed.png`.

To run the app interactively on Android:

```powershell
flutter emulators --launch MoneyKai_API_36
flutter devices
flutter run -d <android-device-id>
```

## Permission audit

Compiled debug APK permission dump:

```text
package: com.moneykai.mobile
uses-permission: name='android.permission.INTERNET'
permission: com.moneykai.mobile.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION
uses-permission: name='com.moneykai.mobile.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'
```

Compiled unsigned release APK permission dump:

```text
package: com.moneykai.mobile
permission: com.moneykai.mobile.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION
uses-permission: name='com.moneykai.mobile.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'
```

Restricted SMS permissions are not present:

- `READ_SMS`
- `RECEIVE_MMS`
- `RECEIVE_SMS`
- `RECEIVE_WAP_PUSH`
- `SEND_SMS`
- `WRITE_SMS`

The Flutter MVP currently does not request notification listener, contacts, camera, microphone, location, SMS, or storage permissions.

## Release signing

The release Gradle config no longer signs release builds with the debug key. If no upload-key variables are set, `flutter build apk --release` and `flutter build appbundle --release` produce unsigned inspection artifacts. If any upload-key variable is set, all four are required.

Play-ready signed release APK/AAB builds require upload-key environment variables:

```powershell
$env:MONEYKAI_UPLOAD_STORE_FILE="C:\path\to\upload-keystore.jks"
$env:MONEYKAI_UPLOAD_STORE_PASSWORD="<store-password>"
$env:MONEYKAI_UPLOAD_KEY_ALIAS="<key-alias>"
$env:MONEYKAI_UPLOAD_KEY_PASSWORD="<key-password>"
```

Build signed release artifacts after setting those values:

```powershell
flutter build apk --release
flutter build appbundle --release
.\tool\audit_android_release.ps1 -RequireSigned
```

Expected release output paths:

```text
apps\MoneyKai-flutter\build\app\outputs\flutter-apk\app-release.apk
apps\MoneyKai-flutter\build\app\outputs\bundle\release\app-release.aab
```

No Play-ready release AAB has been produced in this phase because no upload keystore was provided.
The repeatable Android release audit lives at:

```text
apps\MoneyKai-flutter\tool\audit_android_release.ps1
```

It checks artifact existence, SHA-256 metadata, restricted Android permissions, release APK signing state through `apksigner`, release AAB signing state through `jarsigner`, and partial `MONEYKAI_UPLOAD_*` signing environment mistakes.

## Remaining Android release work

- Run remaining manual workflow QA on `MoneyKai_API_36` or a physical Android device: real TalkBack spoken-output pass and physical-device performance/cold-start checks.
- Create/provide the Android upload keystore.
- Build release APK and AAB with upload-key signing.
- Capture SHA-256 and signer certificate for the exact release artifacts.
- Smoke test release-signed artifacts once an upload key exists.
