# Phase 5E Play Store-Safe Disclosure Package

Last reviewed: 2026-09-18

## Release scope

The Play-distributed app is **MoneyKai**. It is intended for Play Console internal testing first, not public production launch.

The separate local APK referred to as **Original MoneyKai** is for direct/internal use only. It includes native SMS Research Mode and restricted SMS permissions, so it must not be uploaded to Play unless a separate SMS permission declaration, policy review, legal/privacy review, and release signoff are completed.

## Public Play build boundary

The public Play AAB keeps authenticated cloud sync and backups, but excludes device-sensitive experimentation. It does not include native SMS access, notification-listener capture, contacts, Gmail sync, PDF statement parsing, wealth integrations, Financial AI, remote Sentry reporting, or remote diagnostic uploads.

Optional app notifications are distinct from notification-listener access. The app can show its own reminders or alerts only after the user grants the normal Android notification permission; it never reads another app’s notifications in this release.

## Play reviewer notes

MoneyKai is a cloud-sync personal-finance app. Users authenticate with Firebase and can sync finance data such as profile details, transactions, budgets, settings, group expenses, and backups to MoneyKai backend services for their authenticated account. The app retains a local working copy for offline resilience.

The Play Store build does not include restricted SMS permissions, does not read the SMS inbox, does not request notification-listener access, does not register a notification-listener service, and does not request contacts, microphone, or legacy external-storage access. Native SMS research remains separate from this Play artifact and must not be uploaded.

Before uploading a production AAB to Play Console, run the release permission verifier against the exact downloaded/upload candidate artifact:

```powershell
npm.cmd --prefix apps\MoneyKai-mobile run android:verify:release-permissions -- --aab path\to\production.aab
npm.cmd --prefix apps\MoneyKai-mobile run android:capture:handoff -- --aab path\to\production.aab --build-id <eas-build-id> --eas-url <eas-build-url>
```

The upload must be blocked if the verifier reports an SMS, contacts, legacy-storage, microphone, or notification-listener manifest entry. The handoff capture must also block Android debug signing. Paste the capture output into `docs/phase5-internal-release-signoff.md` so the final artifact hash, signer certificate, commit, build ID, signing expectation, and permission result are recorded before submit.

## Data Safety notes

- **Account/profile data:** Firebase Authentication identifies the signed-in user. Account identifiers and profile data are processed to provide the service.
- **Financial app data:** Transactions, budgets, savings, groups, app settings, and backups sync to MoneyKai backend services for authenticated users.
- **Data sharing:** The app sends this information to Firebase for authentication and MoneyKai backend services for account, sync, backup, and group-expense functionality. It is not sold or used for advertising.
- **Notifications permission:** Optional app reminders and alerts may use Android’s normal notification permission. The release does not request notification-listener access or read notifications from other apps.
- **Excluded sources:** SMS, contacts, camera, microphone, location, legacy shared storage, Gmail, PDF statements, wealth integrations, and Financial AI are not part of this public Play AAB.
- **Diagnostics:** Remote Sentry reporting and diagnostic-event uploads are disabled in this release.

## Screenshot checklist

Capture screenshots only from the Play-safe MoneyKai build:

- Simple dashboard or expense-entry screen.
- Sign-in or account screen that establishes the cloud-sync value without exposing secrets.
- Cloud sync or backup screen showing the user-controlled action.
- Privacy Policy screen that explains data processing and deletion contact.
- Optional app-notification setting, if shown, without presenting notification-listener or auto-capture controls.

Do not use screenshots from Original MoneyKai or any screen showing native SMS permissions, notification-listener access, contacts, Gmail, PDF, wealth, AI, or automatic-capture behavior for Play listing/reviewer materials.

## Current status

Phase 5E is ready for cloud-sync minimal internal-testing materials. Final Play Console Data Safety answers still need to be entered and reviewed in Play Console before a closed or production release. The next Play-safe production AAB must pass the repository release permission verifier and handoff capture before upload; the historical Phase 5A AAB is debug-signed and must not be uploaded to Play.
