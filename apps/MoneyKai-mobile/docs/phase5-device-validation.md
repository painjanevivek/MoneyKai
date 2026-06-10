# Phase 5B Device Validation

Last reviewed: 2026-06-11

## Current status

Phase 5B is partially validated on one physical Android device. The current release APK installs, launches, survives background/relaunch checks, appears in Android's Notification Access list, and has a live notification-listener service after notification access is enabled. Phase 5B is not complete yet because it still needs more Android versions/OEMs plus capture behavior checks for background, reboot, and battery-saver conditions.

## Validated device

| Field | Value |
| --- | --- |
| Manufacturer | Nothing |
| Brand | Nothing |
| Model | AIN065 |
| Product | PongIND |
| Android version | 16 |
| API level | 36 |
| Security patch | 2026-04-01 |
| Resolution | 1080x2412 |
| Density | 420 physical, 375 override |
| Build fingerprint | `Nothing/PongIND/Pong:16/BQ2A.250721.001-BP2A.250605.031.A3/2604141749:user/release-keys` |

## Artifact tested

- APK: `artifacts/phase5a/moneykai-phase5-release-no-devclient-arm64.apk`
- Package: `com.moneykai.mobile`
- Version: `1.0.0`
- Version code: `1`
- Target SDK: `36`

## Checks passed

- `adb install -r` completed successfully.
- `com.moneykai.mobile/.MainActivity` launches from the Android launcher intent.
- App process remains running after launch.
- `MainActivity` becomes the focused Android window.
- Force-stop, launch, background via Home, and relaunch completed without fatal crash logs.
- Android package inspection confirms `MoneyKaiNotificationListenerService` is declared with `android.permission.BIND_NOTIFICATION_LISTENER_SERVICE`.
- Android package inspection shows no SMS receiver and no SMS permissions.
- Android package inspection shows no dev-client/dev-menu components.
- Android Notification Access settings open successfully through the system action.
- Android Notification Access UI lists `MoneyKai Mobile`.
- `enabled_notification_listeners` contains `com.moneykai.mobile/com.moneykai.nativecapture.MoneyKaiNotificationListenerService` after notification access is enabled on the device.
- `dumpsys notification listeners` lists `com.moneykai.mobile/com.moneykai.nativecapture.MoneyKaiNotificationListenerService` under live notification listeners.
- Current denied notification-access state does not crash app launch or relaunch.

## Checks not completed

- Background notification capture after a granted notification-listener permission is not validated on this physical device yet.
- Reboot persistence is not validated.
- Battery saver behavior is not validated.
- Permission revocation after a granted state is not revalidated on this device.
- Android 10/11 and Android 12/13 devices are not validated.
- Samsung, Xiaomi/Redmi, OnePlus, Vivo/Oppo, Realme, and Motorola OEM devices are not validated.

## Next device matrix

Use the same release APK from `artifacts/phase5a/` unless a newer Phase 5 artifact is produced.

| Target | Status |
| --- | --- |
| Android 10 or 11 | Pending |
| Android 12 or 13 | Pending |
| Android 14, 15, or newer | Partially covered by Nothing AIN065 on Android 16 |
| Samsung | Pending |
| Xiaomi/Redmi | Pending |
| OnePlus | Pending |
| Vivo/Oppo | Pending |
| Realme | Pending |
| Motorola | Pending |

## Per-device test script

For each physical device:

1. Install the release APK with `adb install -r artifacts/phase5a/moneykai-phase5-release-no-devclient-arm64.apk`.
2. Launch with `adb shell monkey -p com.moneykai.mobile -c android.intent.category.LAUNCHER 1`.
3. Confirm the app process is running with `adb shell pidof com.moneykai.mobile`.
4. Confirm `MainActivity` is focused with `adb shell dumpsys window`.
5. Open Android Notification Access settings from MoneyKai Settings or with `adb shell am start -a android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS`.
6. Confirm `MoneyKai Mobile` appears in the system Notification Access list.
7. Manually grant notification access on the device.
8. Confirm `enabled_notification_listeners` contains `com.moneykai.mobile/com.moneykai.nativecapture.MoneyKaiNotificationListenerService`.
9. Post or receive a transaction-like notification and confirm it becomes a reviewable Auto Capture draft.
10. Background the app and repeat notification capture.
11. Force-stop and relaunch the app, then confirm queued captures flush correctly.
12. Reboot the device and confirm listener state and capture behavior.
13. Enable battery saver or OEM battery restrictions and repeat background capture.
14. Revoke notification access and confirm the app remains stable and reports the denied state.

## Current conclusion

The Phase 5A release APK is viable on one Android 16 Nothing device for install, launch, settings visibility, listener grant/live state, and denied-state stability. Phase 5B remains open until notification capture behavior is tested under background/reboot/battery-saver conditions and at least two more Android/OEM environments are validated.
