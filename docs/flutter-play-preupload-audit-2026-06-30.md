# MoneyKai Flutter Play Pre-Upload Audit

Date: 2026-06-30

Artifact under test:

```text
D:\Work\Project\MoneyKai\apps\MoneyKai-flutter\build\app\outputs\bundle\release\app-release.aab
```

SHA-256:

```text
239D3B916F840C12127E2F21E208C34E100F1B4D19C1703F88DD6F7585A16C95
```

## Official Play Console Sources Checked

- [Google Play Developer Policy Center](https://play.google/developer-content-policy/)
- [Create and set up your app](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en)
- [Prepare your app for review](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en)
- [Prepare and roll out a release](https://support.google.com/googleplay/android-developer/answer/9859348?hl=en)
- [Set up an open, closed, or internal test](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en)
- [Testing requirements for new personal developer accounts](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- [Use pre-launch reports to identify issues](https://support.google.com/googleplay/android-developer/answer/9842757?hl=en)
- [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756?hl=en)
- [Data safety section guidance](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- [Financial features declaration](https://support.google.com/googleplay/android-developer/answer/13849271?hl=en)
- [Android app signing](https://developer.android.com/studio/publish/app-signing)
- [Test your app bundle](https://developer.android.com/guide/app-bundle/test)

## Result

Status: locally eligible for Play Console upload to internal or closed testing.

This means the AAB is signed, structurally valid, installable from bundle-generated split APKs, launches on Android API 36, passes the local release audit, and has no crash/ANR evidence from the local smoke crawl.

It does not mean production access is complete. Play Console still owns these external gates:

- App creation and package-name registration.
- Upload-key acceptance or reset if Play Console already has a different upload key for `com.moneykai.mobile`.
- App content forms, Data safety, privacy policy URL, Financial features declaration, and reviewer notes.
- Play pre-launch report, which only runs after upload.
- If this is a new personal developer account, at least 12 testers must opt in to a closed test for at least 14 continuous days before production access can be requested.

## Artifact Checks

| Check | Result | Evidence |
| --- | --- | --- |
| AAB exists | Passed | `app-release.aab`, `51885800` bytes |
| AAB SHA-256 recorded | Passed | `239D3B916F840C12127E2F21E208C34E100F1B4D19C1703F88DD6F7585A16C95` |
| Signed AAB audit | Passed | `.\tool\audit_android_release.ps1 -RequireSigned` |
| APK signer evidence | Passed | `CN=MoneyKai Upload`, RSA 4096, SHA-256 certificate digest `6c50a904e84711e4f24bd9a448a19e07647473a3e735b35c97a83d82091909c2` |
| AAB signer evidence | Passed | `CN=MoneyKai Upload`, SHA-256 fingerprint `6C:50:A9:04:E8:47:11:E4:F2:4B:D9:A4:48:A1:9E:07:64:74:73:A3:E7:35:B3:5C:97:A8:3D:82:09:19:09:C2` |
| Bundletool validation | Passed | `bundletool validate --bundle app-release.aab` |
| Bundle-generated APK set | Passed | `.codex-artifacts\play-preupload\moneykai-release.apks` |
| APK set SHA-256 | Passed | `EBEF731205CF34016E23C1CBC4139811726A5AF494B76EE8E2487E6C15E4121D` |
| Estimated delivered download size | Passed | `7,964,713` to `8,646,657` bytes from `bundletool get-size total` |
| Identity | Passed | `com.moneykai.mobile`, version `1.0.1+2`, label `MoneyKai`, target SDK `36` |
| Baseline min SDK | Passed | Base split includes `minSdkVersion:'24'`; API-specific variants were generated for newer devices |
| Permission allowlist | Passed | Release APK permission audit passed; no SMS, notification listener, contacts, camera, microphone, location, or storage permissions |
| Release manifest hardening | Passed | Release audit passed: non-debuggable, cleartext disabled, backup/data-extraction opt-out, exported-component allowlist |

## Runtime Smoke Checks

Installed path:

```powershell
bundletool install-apks --apks .codex-artifacts\play-preupload\moneykai-release.apks
```

Device:

```text
emulator-5554
Google sdk_gphone64_x86_64
Android 16 / SDK 36
```

Results:

- Bundle-generated split APK install: passed.
- Launcher activity start: passed.
- Focused activity: `com.moneykai.mobile/.MainActivity`.
- Cold launch timing: `TotalTime 819 ms`, `WaitTime 822 ms`.
- Screenshot capture: passed.
- Window hierarchy capture: passed.
- First screen text/content: `MoneyKai`, onboarding copy, `Continue` button.
- 250-event `monkey` crawl: passed with no crash/ANR pattern in inspected logcat output.

Evidence:

```text
D:\Work\Project\MoneyKai\.codex-artifacts\play-preupload\runtime\moneykai-runtime-20260630-014544-summary.md
D:\Work\Project\MoneyKai\.codex-artifacts\play-preupload\runtime\moneykai-runtime-20260630-014544-screen.png
D:\Work\Project\MoneyKai\.codex-artifacts\play-preupload\runtime\moneykai-runtime-20260630-014544-window.xml
```

## Play Console Checklist Before Upload

These items must be ready in the Play Console account before or during upload:

- Create the app with package name `com.moneykai.mobile`.
- Enroll/use Play App Signing.
- Confirm the new upload key is accepted by Play Console, or reset/register it if the package already has a different upload key.
- Upload the signed AAB above to internal testing or closed testing first.
- Complete Data safety from the current local-only behavior documented in `docs\flutter-play-store-policy-readiness.md`.
- Add the public privacy policy URL.
- Complete Financial features declaration as a budgeting/expense-tracking app, not loans, trading, bank sync, or advice.
- Keep store listing copy truthful: no loans, guaranteed outcomes, investment advice, automatic bank sync, SMS reading, or notification capture claims.
- Use at least 12 opted-in closed testers for at least 14 continuous days if the developer account is subject to the new personal-account testing rule.
- Review the Play pre-launch report after upload and fix any device-specific crash, ANR, accessibility, security, or policy warnings before wider rollout.

## Current Remaining Risk

- Physical-device Play-path testing is still pending. The emulator smoke pass is useful, but it is not a replacement for a real Android phone.
- Play Console may reject the upload key if `com.moneykai.mobile` has already been uploaded before with a different upload key.
- Play pre-launch report cannot run locally; it requires uploading the AAB to Play Console.
- Production access may be blocked by the 12-tester/14-day closed testing requirement depending on the developer account type and status.

## Physical Device Follow-Up Flow

Use this when a real Android phone is connected and the signed AAB above is still the candidate under test:

```powershell
cd apps\MoneyKai-flutter
.\tool\collect_android_runtime_qa.ps1 `
  -Install `
  -InstallMode Aab `
  -RequirePhysical `
  -ClearAppData `
  -ExpectedAabSha256 239D3B916F840C12127E2F21E208C34E100F1B4D19C1703F88DD6F7585A16C95 `
  -OutputDir "../../.codex-artifacts/play-preupload/physical"
```

After the AAB is uploaded to Play internal testing and installed from the tester opt-in link, run the same smoke without side-loading and require the Play installer:

```powershell
cd apps\MoneyKai-flutter
.\tool\collect_android_runtime_qa.ps1 `
  -RequirePhysical `
  -ExpectedInstallerPackage com.android.vending `
  -ExpectedAabSha256 239D3B916F840C12127E2F21E208C34E100F1B4D19C1703F88DD6F7585A16C95 `
  -OutputDir "../../.codex-artifacts/play-preupload/play-internal"
```

The collector records device metadata, launch timing, installed package/version/installer evidence, focused window evidence, UI hierarchy, screenshot, local AAB/APKS hashes when present, and launch-window logcat crash/ANR checks. It does not replace manual screenshot inspection, TalkBack spoken-output QA, Play pre-launch report review, or Play Console declaration review.
