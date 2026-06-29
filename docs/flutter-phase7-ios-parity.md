# MoneyKai Flutter Phase 7 iOS Parity Preparation

Last reviewed: 2026-06-29

## Current status

The Flutter app is structured as a shared Android/iOS codebase:

```text
apps/MoneyKai-flutter
```

The current development machine is Windows, so iOS simulator runs, iOS archives, IPA export, and TestFlight upload cannot be performed here. Those steps require macOS and Xcode.

## iOS identity

Current iOS project configuration:

| Field | Value |
| --- | --- |
| Bundle identifier | `com.moneykai.mobile` |
| Display name | `MoneyKai` |
| Flutter version | `1.0.1+2` from `pubspec.yaml` |
| App icon | MoneyKai icon generated from `apps\MoneyKai-mobile\assets\images\icon.png` |
| Launch screen | MoneyKai centered launch image generated from `apps\MoneyKai-mobile\assets\images\icon.png` |

## Package parity check

Current direct dependencies:

- `flutter`
- `cupertino_icons`
- `go_router`
- `flutter_riverpod`
- `shared_preferences`
- `intl`
- `cryptography`
- `share_plus`
- `file_selector`

These are Flutter/iOS-compatible package choices. The current MVP does not add Android-only native packages, notification listener packages, SMS packages, contacts packages, camera packages, storage-permission packages, or WebView dependencies.

## Platform behavior

Shared Flutter code currently covers:

- Local account/session boundary.
- Dashboard.
- Add transaction.
- Transactions list, search, filter, and delete.
- Budget setup and progress.
- Insights from local transaction data.
- Settings, privacy/security, sign out, local JSON export to clipboard, encrypted backup export/restore through platform file flows, and local reset.

The MVP intentionally avoids:

- SMS permissions.
- Notification listener access.
- Contacts.
- Broker/bank sync.
- Gmail sync.
- WebView.

This keeps iOS parity practical until real backend/auth/sync phases are opened.

## iOS build blocker

Blocked on this Windows machine:

- `flutter run -d ios`
- `flutter build ios`
- Xcode archive.
- IPA export.
- TestFlight upload.

Required Mac setup:

```bash
flutter doctor -v
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
cd apps/MoneyKai-flutter
flutter pub get
open ios/Runner.xcworkspace
```

In Xcode:

1. Select the `Runner` target.
2. Set the Apple Developer team.
3. Confirm bundle id `com.moneykai.mobile` or change it to the final Apple bundle id.
4. Replace placeholder app icons and launch assets.
5. Select an iOS simulator and run.
6. Archive with `Product > Archive`.
7. Validate and upload to TestFlight from Organizer.

CLI checks on macOS:

```bash
cd apps/MoneyKai-flutter
flutter analyze
flutter test
flutter run -d "iPhone 16"
flutter build ios --release
```

## Remaining iOS parity work

- Perform simulator QA on small and large iPhones.
- Perform real-device QA before TestFlight.
- Configure Apple signing team and provisioning.
- Validate local persistence after app restart on iOS.
- Validate encrypted backup share-sheet and file-picker behavior on iOS.
- Confirm text scale, safe areas, keyboard behavior, and date picker UX on iOS.
