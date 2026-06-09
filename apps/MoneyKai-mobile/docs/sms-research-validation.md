# SMS Research Validation

Last reviewed: 2026-06-10

## Scope

SMS Research Mode is an internal-only prototype. It must not be treated as production-ready until device validation, Google Play permission review, privacy review, and release signoff are complete.

## Current Policy Review

Google Play treats SMS and Call Log permissions as high-risk or sensitive permissions. Apps that do not qualify must remove those permissions from the manifest, and qualifying apps must declare the permissions in Play Console. Google Play lists SMS-based money management as a possible exception for apps that track or manage budgets, with eligible permissions including `READ_SMS`, `RECEIVE_MMS`, `RECEIVE_SMS`, and `RECEIVE_WAP_PUSH`, but exceptions remain subject to Google Play review and broader user-data policy requirements.

Policy source: https://support.google.com/googleplay/android-developer/answer/10208820

MoneyKai decision for this validation pass: keep SMS as research-only. Production and preview builds must not register the SMS receiver or request restricted SMS permissions.

## Automated Validation

| Check | Status | Evidence |
| --- | --- | --- |
| Preview and production EAS profiles disable `EXPO_PUBLIC_SMS_RESEARCH_BUILD` | Passed | `src/config/smsPolicyConfig.test.ts` |
| Static app config does not request restricted SMS permissions | Passed | `src/config/smsPolicyConfig.test.ts` |
| Dynamic Expo config loads SMS manifest plugin only when research flag is true | Passed | `src/config/smsPolicyConfig.test.ts` |
| Capture backup snapshot excludes capture inbox state and raw SMS bodies by default | Passed | `src/config/smsPolicyConfig.test.ts` |
| Native SMS receiver compiles in the local Expo module | Passed | `./gradlew.bat :moneykai-native-capture:compileDebugKotlin --console=plain` |
| SMS parser ignores OTP, promotional, failed, and non-financial messages through fixtures | Passed | `npm.cmd run mobile:test:capture` |

## Device Validation Matrix

Physical device validation has started on the current workstation. Coverage is still incomplete until more Android/OEM devices, a dual-SIM incoming SMS scenario, and real carrier/bank SMS delivery are exercised.

| Area | Required Coverage | Current Status |
| --- | --- | --- |
| Android versions | At least Android 10/11, Android 12/13, Android 14/15+ | Partial: Android 16 / API 36 covered on OnePlus CPH2649 |
| OEM behavior | Samsung, Xiaomi/Redmi, OnePlus, Vivo/Oppo, Realme, Motorola where possible | Partial: OnePlus/OPlus behavior covered |
| Dual-SIM behavior | Incoming transaction SMS on SIM 1 and SIM 2, sender availability, timestamp accuracy | Partial device signal only: default subscription IDs are present, but no SIM 1/SIM 2 incoming SMS event was available |
| Permission denied/revoked | Install without SMS permission, deny permission, revoke permission, re-enable permission | Passed on OnePlus CPH2649: denied/default state, Settings grant, Settings revoke, and Settings re-enable were verified |
| Background delivery | App foreground, background, killed/restarted, battery saver enabled | Pending real incoming carrier/bank SMS; Android blocks shell-sent `SMS_RECEIVED` broadcasts |
| Queue flushing | SMS received while JS bridge is inactive flushes only after source controls allow it | Pending real incoming carrier/bank SMS; synthetic shell notification did not populate the native queue |
| Data minimization | Confirm no raw SMS body appears in UI, backup, or normal persisted capture state | Pending real incoming carrier/bank SMS capture |

## Physical Device Session - 2026-06-10

| Field | Value |
| --- | --- |
| Device | OnePlus CPH2649 / CPH2649IN |
| Android | Android 16, API 36 |
| Build | `CPH2649_16.0.5.703(EX01)` |
| Fingerprint | `OnePlus/CPH2649IN/OP5D55L1:16/BP2A.250605.015/V.R4T3.535a14b-3024561-302455e:user/release-keys` |
| App package | `com.moneykai.mobile` |
| App build | Debug development build, version `1.0.0`, versionCode `1`, targetSdk `36` |
| Commit | `c2e7d70` |

Observed results:

- ADB detected the device as authorized: `1e13ff3a device product:CPH2649IN model:CPH2649 device:OP5D55L1`.
- The first installed debug build did not declare restricted SMS permissions, matching the production-safety default.
- A research debug build was generated with `EXPO_PUBLIC_SMS_RESEARCH_BUILD=true` and installed successfully.
- The installed research build declares `android.permission.RECEIVE_SMS` and registers `com.moneykai.nativecapture.MoneyKaiSmsReceiver`.
- Notification listener access is enabled for `com.moneykai.mobile/com.moneykai.nativecapture.MoneyKaiNotificationListenerService`.
- `RECEIVE_SMS` is declared but not granted after install, which validates the denied/default state.
- On this OnePlus/OPlus Android 16 build, ADB shell cannot grant `RECEIVE_SMS` and cannot change `RECEIVE_SMS` app-op mode, so the permission path was exercised through Android Settings.
- SMS permission grant, revoke, and re-enable passed through Android Settings. Final state: `android.permission.RECEIVE_SMS: granted=true`.
- Notification listener permission revoke and re-grant passed through Android notification listener controls. Final state includes `com.moneykai.mobile/com.moneykai.nativecapture.MoneyKaiNotificationListenerService`.
- Native capture SharedPreferences were left enabled for the research build: `capture_enabled=true`, `notification_capture_enabled=true`, and `sms_capture_enabled=true`.
- A protected shell broadcast for `android.provider.Telephony.SMS_RECEIVED` failed with Android `SecurityException`, confirming that real system/carrier SMS delivery cannot be simulated from ADB shell on this device.
- A synthetic `cmd notification post` financial notification did not create a pending native capture queue entry while the JS bridge was inactive. This is inconclusive for real bank notifications because shell-posted notifications are not equivalent to real bank or messaging-app notifications on OEM Android builds.
- Telephony registry showed active/default subscription IDs, but no safe SIM 1/SIM 2 incoming transaction SMS test was available during this session.

Remaining steps that still require a real incoming SMS event:

- Send or receive a real transaction SMS while the app is foregrounded, backgrounded, and force-stopped/reopened.
- Revoke SMS permission from Settings, repeat a real SMS attempt, then re-enable permission and retest.
- If the device has two active SIMs, repeat the real incoming SMS test for SIM 1 and SIM 2 and record sender/timestamp behavior.

## Implementation Added For Real SMS Validation

The app now has the required runtime and data-flow pieces for real-device SMS validation:

- Settings requests Android `RECEIVE_SMS` runtime permission before enabling SMS Research Mode.
- Native status reports SMS access as `granted`, `denied`, or `unsupported` so the UI can show whether real SMS delivery can work.
- SMS Research Mode still requires explicit research consent and remains unavailable outside research builds.
- Real incoming SMS events are queued through the native pending-signal queue when the JS bridge is inactive.
- SMS receiver metadata includes `captureOrigin`, `rawBodyStored=false`, and optional Android SIM metadata: `smsSubscriptionId`, `smsSlot`, and `smsPhoneId`.
- Persisted capture records keep only safe parser snippets and an allowlisted metadata payload. Raw SMS body and sender fields are not persisted in `rawPayload`.

This does not bypass Android's protected `SMS_RECEIVED` broadcast. Final proof still requires a real incoming carrier/bank SMS, because ADB shell cannot legally send that protected system broadcast.

## Release Gate

SMS Research Mode cannot move beyond internal research until:

- The full device matrix is completed with build ID, commit hash, Android version, OEM, and observed result.
- Production AAB inspection confirms no restricted SMS permissions when `EXPO_PUBLIC_SMS_RESEARCH_BUILD=false`.
- Google Play declaration, legal/privacy review, and Data Safety copy are prepared if production SMS is considered.
- Any failures around background delivery, permission revocation, dual-SIM handling, or noisy drafts are fixed and retested.
