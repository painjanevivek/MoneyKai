# MoneyKai Play Console Submission Pack

Last reviewed: 2026-09-18

## Release identity

| Field | Value |
| --- | --- |
| App name | MoneyKai |
| Android package | `com.moneykai.mobile` |
| Release posture | Cloud-sync core with a minimal device-permission surface |
| First rollout | Internal testing, then closed testing |
| Upload artifact | Fresh, non-debug-signed production AAB only |
| Privacy policy | `https://moneykai.com/privacy-policy` |

## Public AAB capabilities

- Firebase Authentication identifies the signed-in user.
- MoneyKai backend services provide authenticated sync, backups, and shared-expense features.
- The app can keep a local working copy for offline resilience.
- Optional app reminders and alerts may use Android's normal notification permission.

The production profile must exclude SMS, notification-listener capture, contacts, Gmail sync, PDF statement parsing, wealth integrations, Financial AI, remote Sentry reporting, and remote diagnostic uploads. Do not upload a build unless the compiled-artifact verifier confirms this boundary.

## Data Safety preparation

Enter only answers that match the exact AAB and deployed services:

| Data category | Processing purpose | Shared with |
| --- | --- | --- |
| Account identifiers and profile information | Authentication and account operation | Firebase Authentication and MoneyKai backend services |
| Financial information the user enters, such as transactions, budgets, savings, group expenses, settings, and backups | App functionality, cloud sync, backup, and shared-expense features | MoneyKai backend services |
| App notifications, if enabled | App reminders and alerts | Stored on-device; no notification-listener collection |

Before submitting the form, manually confirm the exact Firebase, backend, and data-retention practices with the service owners. The public AAB must not be declared as local-only.

## Reviewer notes

Paste this in Play Console only after verifying the exact artifact:

> MoneyKai is an authenticated cloud-sync personal-finance app. It uses Firebase Authentication and MoneyKai backend services to provide sync, backup, and shared-expense functionality for the signed-in account. The public Play build does not read SMS, contacts, or notifications from other apps, and it does not include a notification-listener service. Gmail sync, PDF statement parsing, wealth integrations, Financial AI, remote Sentry reporting, and remote diagnostic uploads are disabled. Optional app reminders use Android's normal notification permission only.

## Required repository checks

Run from the repository root on a clean, committed release candidate:

```powershell
npm run launch:check
npm run mobile:verify:release-profile -- --profile production
npm run release:handoff-baseline
npm run security:check
npm run --silent backup-restore:handoff
npm run mobile:typecheck
npm run mobile:lint
npm run mobile:test:capture
npm --prefix apps\MoneyKai-mobile run android:verify:production-signing
```

Build through authenticated EAS credentials, then download the exact AAB:

```powershell
cd apps\MoneyKai-mobile
npx eas build --platform android --profile production

cd ..\..
npm run mobile:release:android:verify -- --aab apps\MoneyKai-mobile\path\to\production.aab
npm run mobile:release:android:capture -- --aab apps\MoneyKai-mobile\path\to\production.aab --build-id <eas-build-id> --eas-url <eas-build-url>
```

Record the artifact SHA-256, signer, source commit, EAS build ID, and verifier result in `docs/phase5-internal-release-signoff.md` before uploading it.

## Console-controlled steps

These actions require the Play Console account holder and are intentionally not automated by the repository:

1. Create or verify the `com.moneykai.mobile` Play app record and developer identity.
2. Complete app access, ads, content rating, target audience, Data Safety, and privacy-policy declarations using this pack and the exact artifact.
3. Upload the signed AAB to internal testing and smoke test it on physical Android devices.
4. Move the same validated release line to closed testing. For a new personal developer account, recruit the required 12 opted-in closed-test users and keep the test active for 14 continuous days before requesting production access.
5. Publish production only after tester feedback, policy declarations, and rollout settings have been reviewed by the account holder.

## Physical-device smoke test

- Launch, sign in, and return from background without a crash.
- Add, edit, and delete an expense; confirm the budget and dashboard update.
- Verify cloud sync and backup/restore only with test data.
- Confirm optional app-notification opt-in works if enabled.
- Confirm there are no SMS, contacts, notification-listener, Gmail, PDF, wealth, or AI controls in the public build.
- Confirm the compiled AAB verifier reports no forbidden manifest entries and the artifact is not debug-signed.
