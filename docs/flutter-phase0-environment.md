# MoneyKai Flutter Phase 0 Environment

Last reviewed: 2026-06-29

## Summary

Phase 0 is complete for environment inspection and Android toolchain verification on this Windows machine. Flutter was not originally on `PATH`, so Flutter stable was installed outside the repository at `C:\Users\ASUS\development\flutter`.

No Flutter project code has been started in this phase.

## Machine

| Area | Result |
| --- | --- |
| OS | Microsoft Windows 11 Home Single Language, 64-bit |
| Shell | PowerShell |
| Git | `2.51.1.windows.1` |
| Java | Temurin OpenJDK `17.0.19` |
| Android SDK | `D:\Android\Sdk` |
| adb | `D:\Android\Sdk\platform-tools\adb.exe`, version `37.0.0-14910828` |
| Flutter | `3.44.4` stable |
| Dart | `3.12.2` via Flutter SDK |

## Flutter installation

Source: official Flutter Windows stable release feed.

| Field | Value |
| --- | --- |
| Flutter version | `3.44.4` |
| Dart version | `3.12.2` |
| Flutter revision | `ad70ec4617` |
| Flutter install path | `C:\Users\ASUS\development\flutter` |
| Archive SHA-256 | `8f2d6224fc6872d2f7f180de86cde989fcea3776efe0edf48a9aac2cd9be2b1b` |

User-level environment variables were updated:

- `PATH` includes `C:\Users\ASUS\development\flutter\bin`.
- `PATH` includes Android SDK `platform-tools`, `cmdline-tools\latest\bin`, and `emulator`.
- `ANDROID_HOME=D:\Android\Sdk`.
- `ANDROID_SDK_ROOT=D:\Android\Sdk`.

The current Codex process was started before those variables were updated, so commands in this session should prefix:

```powershell
$env:Path = 'C:\Users\ASUS\development\flutter\bin;D:\Android\Sdk\platform-tools;D:\Android\Sdk\cmdline-tools\latest\bin;D:\Android\Sdk\emulator;' + $env:Path
```

New terminal sessions should pick up the user-level variables.

## Doctor result

Command:

```powershell
flutter config --android-sdk D:\Android\Sdk
flutter doctor -v
```

Relevant result:

```text
[√] Flutter (Channel stable, 3.44.4, on Microsoft Windows [Version 10.0.26200.8655], locale en-IN)
[√] Windows Version (11 Home Single Language 64-bit, 25H2, 2009)
[√] Android toolchain - develop for Android devices (Android SDK version 36.1.0)
[√] Chrome - develop for the web
[X] Visual Studio - develop Windows apps
[√] Connected device (3 available)
[√] Network resources
! Doctor found issues in 1 category.
```

The Visual Studio issue only blocks Flutter Windows desktop builds. It does not block the Android-first MoneyKai mobile goal.

## Android readiness

Android toolchain status from `flutter doctor -v`:

- Android SDK: `D:\Android\Sdk`.
- Emulator: version `36.6.11.0`.
- Platform/build tools: Android `36.1`, build-tools `36.1.0`.
- Java: Temurin OpenJDK `17.0.19`.
- Android licenses: all accepted.

Device/emulator status:

```text
flutter devices
Found 3 connected devices:
  Windows (desktop)
  Chrome (web)
  Edge (web)

flutter emulators
1 available emulator:
  MoneyKai_API_36
```

No physical Android device is currently connected through adb. Android build prerequisites are ready; runtime validation should launch `MoneyKai_API_36` or connect a physical Android device before `flutter run`.

## Android Studio status

Android Studio was not found in standard install locations:

- `C:\Program Files\Android\Android Studio`
- `C:\Program Files (x86)\Android\Android Studio`
- `D:\Android\Android Studio`

The installed Android command-line tools are sufficient for Flutter CLI builds. Install Android Studio manually later if IDE-based emulator/device management is desired.

## iOS readiness

This machine is Windows, so Xcode and iOS Simulator are unavailable. The Flutter codebase should still be kept iOS-compatible from day one, but final iOS simulator runs, IPA archives, and TestFlight upload require macOS with Xcode.

Required later on macOS:

- Install Flutter stable.
- Install Xcode from the Mac App Store.
- Run `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer`.
- Run `sudo xcodebuild -runFirstLaunch`.
- Run `flutter doctor -v`.
- Open or build the Flutter iOS project with a valid Apple Developer team and bundle identifier.

## Phase 0 self-review

- Flutter and Dart were missing initially; resolved by installing Flutter stable outside the repo.
- Android SDK and licenses are usable.
- Android emulator exists but has not been launched in this phase.
- Android Studio is not installed; this is not an Android build blocker.
- iOS build is blocked by OS, as expected on Windows.
- No project code was created or changed.
