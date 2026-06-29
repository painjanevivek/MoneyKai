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

## Verification commands

Run from `apps/MoneyKai-flutter` with Flutter on `PATH`:

```powershell
dart format lib test
flutter analyze
flutter test
flutter build apk --debug
```

Latest verified result:

- `flutter analyze`: passed.
- `flutter test`: passed.
- `flutter build apk --debug`: passed.

## Debug APK

Latest debug artifact:

```text
D:\Work\Project\MoneyKai\apps\MoneyKai-flutter\build\app\outputs\flutter-apk\app-debug.apk
```

Artifact metadata:

| Field | Value |
| --- | --- |
| Size | `151827685` bytes |
| SHA-256 | `A74DFB561739EACAFEA92305D443ED371EE148C22879DC7F6C686975E78E62D9` |
| Built | `2026-06-29 10:56:28` local time |

Install for direct Android testing:

```powershell
adb install -r D:\Work\Project\MoneyKai\apps\MoneyKai-flutter\build\app\outputs\flutter-apk\app-debug.apk
```

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

Scoped manual QA on the same emulator also verified local account creation, expense add/delete, dashboard persistence after force-stop/start, budget and insights updates from the expense, reset confirmation/success, and sign out back to local auth. Evidence snapshots are stored locally under `.codex-artifacts\moneykai-window-*.xml`.

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

Restricted SMS permissions are not present:

- `READ_SMS`
- `RECEIVE_MMS`
- `RECEIVE_SMS`
- `RECEIVE_WAP_PUSH`
- `SEND_SMS`
- `WRITE_SMS`

The Flutter MVP currently does not request notification listener, contacts, camera, microphone, location, SMS, or storage permissions.

## Release signing

The release Gradle config no longer signs release builds with the debug key. Release APK/AAB builds require upload-key environment variables:

```powershell
$env:MONEYKAI_UPLOAD_STORE_FILE="C:\path\to\upload-keystore.jks"
$env:MONEYKAI_UPLOAD_STORE_PASSWORD="<store-password>"
$env:MONEYKAI_UPLOAD_KEY_ALIAS="<key-alias>"
$env:MONEYKAI_UPLOAD_KEY_PASSWORD="<key-password>"
```

Build release artifacts only after setting those values:

```powershell
flutter build apk --release
flutter build appbundle --release
```

Expected release output paths:

```text
apps\MoneyKai-flutter\build\app\outputs\flutter-apk\app-release.apk
apps\MoneyKai-flutter\build\app\outputs\bundle\release\app-release.aab
```

No Play-ready release AAB has been produced in this phase because no upload keystore was provided.

## Remaining Android release work

- Replace generated Flutter launch screen assets with MoneyKai production artwork.
- Run remaining manual workflow QA on `MoneyKai_API_36` or a physical Android device: income entry, search/filter, budget value edits, export placeholder, and text-scale/accessibility checks.
- Create/provide the Android upload keystore.
- Build release APK and AAB with non-debug signing.
- Capture SHA-256 and signer certificate for the exact release artifacts.
- Smoke test fresh install, local account creation, add/delete transaction, budget progress, settings reset, and restart persistence on an Android device.
