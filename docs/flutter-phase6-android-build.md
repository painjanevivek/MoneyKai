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
| Size | `151818524` bytes |
| SHA-256 | `BE5A28BCBC83057668C0713A7DEB81084CD54EA6FD815613BA3A6873652A8A34` |
| Built | `2026-06-29 10:50:00` local time |

Install for direct Android testing:

```powershell
adb install -r D:\Work\Project\MoneyKai\apps\MoneyKai-flutter\build\app\outputs\flutter-apk\app-debug.apk
```

## Device and emulator status

`flutter devices` currently shows no connected Android phone or running Android emulator. It shows Windows desktop, Chrome, and Edge.

`flutter emulators` shows one Android emulator:

```text
MoneyKai_API_36
```

To run the app on Android:

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

- Replace generated Flutter launcher icon with MoneyKai production artwork.
- Launch `MoneyKai_API_36` or connect a physical Android device and run `flutter run`.
- Create/provide the Android upload keystore.
- Build release APK and AAB with non-debug signing.
- Capture SHA-256 and signer certificate for the exact release artifacts.
- Smoke test fresh install, local account creation, add/delete transaction, budget progress, settings reset, and restart persistence on an Android device.
