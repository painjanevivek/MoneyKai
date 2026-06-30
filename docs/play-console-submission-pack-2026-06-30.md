# MoneyKai Play Console Submission Pack

Prepared: 2026-06-30

Scope: Play Console internal-testing upload for the current signed Flutter Android AAB.

Use this as the single copy/paste source for Play Console fields. It is based on the local signed AAB audit, the current Flutter Android release behavior, and the current Google Play/Flutter release references linked below.

## Official References

- Flutter Android deployment: https://docs.flutter.dev/deployment/android
- Google Play User Data policy: https://support.google.com/googleplay/android-developer/answer/10144311?hl=en
- Google Play Data safety guidance: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en
- Google Play Permissions policy: https://support.google.com/googleplay/android-developer/answer/9888170?hl=en
- Google Play Financial Services policy: https://support.google.com/googleplay/android-developer/answer/9876821?hl=en
- Google Play Financial features declaration: https://support.google.com/googleplay/android-developer/answer/13849271?hl=en
- Google Play testing requirements for new personal developer accounts: https://support.google.com/googleplay/android-developer/answer/14151465?hl=en
- Local readiness source: `docs\flutter-play-store-policy-readiness.md`
- Local signed-AAB audit source: `docs\flutter-play-preupload-audit-2026-06-30.md`

## Exact App Facts

| Field | Current value |
| --- | --- |
| App name / label | MoneyKai |
| Package name | `com.moneykai.mobile` |
| Version | `1.0.1+2` |
| Target SDK | `36` |
| Minimum SDK | `24` in the base split |
| Release artifact | `D:\Work\Project\MoneyKai\apps\MoneyKai-flutter\build\app\outputs\bundle\release\app-release.aab` |
| AAB size | `51,885,800` bytes |
| AAB SHA-256 | `239D3B916F840C12127E2F21E208C34E100F1B4D19C1703F88DD6F7585A16C95` |
| AAB signer | `CN=MoneyKai Upload` |
| AAB signer SHA-256 fingerprint | `6C:50:A9:04:E8:47:11:E4:F2:4B:D9:A4:48:A1:9E:07:64:74:73:A3:E7:35:B3:5C:97:A8:3D:82:09:19:09:C2` |
| Bundletool validation | Passed |
| Bundle-generated APK set | `.codex-artifacts\play-preupload\moneykai-release.apks` |
| APK set SHA-256 | `EBEF731205CF34016E23C1CBC4139811726A5AF494B76EE8E2487E6C15E4121D` |
| Estimated delivered download size | `7,964,713` to `8,646,657` bytes |
| Runtime smoke | Passed on Android SDK 36 emulator |
| First screen | MoneyKai splash/onboarding with `Continue` |
| Support email | `support@moneykai.app` |
| Privacy policy URL | `https://moneykai.com/privacy-policy` |

## Current Android Release Behavior

MoneyKai is a local-only personal budgeting and expense-tracking app for this release.

Implemented in the current signed Android build:

- Local onboarding and local profile/session boundary.
- Manual transactions, budgets, category previews, savings/trend insights, settings, and privacy/security screen.
- Local persistence through device storage.
- Local JSON export to clipboard only when the user chooses that action.
- Password-encrypted JSON backup export through the Android share sheet only when the user chooses that action.
- Password-encrypted JSON backup restore through the platform file picker only when the user chooses that action.
- Local diagnostics review/clear.
- Local reset for MoneyKai data on the device.

Not implemented in the current signed Android build:

- Firebase or other cloud backup.
- Backend sync or real remote authentication.
- Remote analytics or remote crash reporting.
- SMS capture, notification listener capture, Gmail sync, bank sync, card sync, or automatic account aggregation.
- Financial AI, AI adviser, investment advice, tax advice, legal advice, or guaranteed financial outcomes.
- Loans, credit, earned wage access, payments, remittance, bill payment, brokerage, crypto, insurance, or trading.

Permission position for the current release:

- The release APK permission audit passed.
- The release build does not request SMS, notification listener, contacts, camera, microphone, location, storage, all-files access, accessibility service, package visibility, or install-package permissions.
- Debug/profile manifests may request `INTERNET` for Flutter tooling; the release permission audit is the Play submission baseline.

## Play Console Data Safety Answers

Use these answers for this signed AAB only.

| Play Console area | Answer for current build |
| --- | --- |
| Does the app collect or share required user data types? | No, the developer does not collect user data from this build and does not share user data with third parties. |
| Data collection | No developer collection. User-entered profile, transaction, budget, settings, backup, and diagnostic data stays on the device unless the user explicitly exports or shares it. |
| Data sharing | No developer-initiated sharing. User-initiated clipboard export and Android share-sheet backup are controlled by the user and disclosed in the privacy policy/reviewer notes. |
| Data types to mark as collected | None for this release, because the current signed build does not transmit local profile, email, transaction, budget, diagnostics, or settings data to the developer, a backend, analytics SDK, crash SDK, or another company. |
| Data types to mark as shared | None for developer sharing in this release. Do not convert user-initiated export/share-sheet behavior into a developer sharing claim unless Play Console guidance for the exact form version requires it. |
| Data encryption in transit | Not applicable to developer collection because the current release does not transmit user data to the developer. |
| Deletion mechanism | No remote account exists. Users can clear local MoneyKai data in Settings, clear diagnostics, or uninstall the app. Exported clipboard contents and backup files are controlled by the user outside MoneyKai. |
| Account creation / account deletion | No server account is created. The app uses an on-device local profile for this MVP. |
| Privacy policy | Enter `https://moneykai.com/privacy-policy`. Confirm this URL is public and matches the local-only Android release before upload. |

Data Safety wording to keep nearby:

```text
MoneyKai's current Android release stores user-entered finance records locally on the device. The developer does not receive profile, transaction, budget, settings, diagnostic, export, or backup data from this build. Users may choose to copy a local JSON export to the clipboard or create a password-encrypted backup file through Android's share sheet; those actions are initiated and controlled by the user.
```

## Privacy Policy Linkage

Play Console privacy policy URL:

```text
https://moneykai.com/privacy-policy
```

Before upload, confirm the public page says the same things as this submission:

- Current Android release is local-only.
- Local data can include display name, email entered into the local profile, transactions, budgets, settings, backup contents, and local diagnostics.
- Clipboard export is plaintext and user-initiated.
- Backup export is password-encrypted and user-initiated through the Android share sheet.
- Restore reads only a user-selected backup file.
- MoneyKai does not sell personal or sensitive user data.
- Data remains on the device until the user resets/deletes it or uninstalls the app.
- No Firebase/cloud backup, SMS capture, Gmail sync, bank sync, Financial AI, ads, payments, loans, or investment/tax/legal advice in this release.
- Support/privacy contact is `support@moneykai.app`.

## Financial Features Declaration

Recommended Play position:

- App category: Finance, if Play requires a category.
- Financial feature type: budgeting, expense tracking, or the narrowest truthful "Other" option if budgeting/expense tracking is not listed.
- Do not select lending, earned wage access, credit, banking, payments, money transfer, brokerage, trading, crypto, insurance, tax, financial advice, or portfolio-management execution categories for this release.

Financial declaration wording:

```text
MoneyKai is a local-only personal budgeting and expense-tracking app. Users manually record transactions, manage budgets, and review local spending summaries on their device. The current Android release does not provide loans, credit, banking, payments, remittance, bill payment, brokerage, crypto, insurance, tax services, legal advice, investment advice, or financial advice. It does not connect to banks, Gmail, SMS, notifications, or financial institutions, and it does not move money or make financial decisions for users.
```

If Play Console asks why the app is in Finance:

```text
MoneyKai is listed in Finance because it helps users organize their own local expense and budget records. The app is a manual tracking tool, not a regulated financial product or money movement service.
```

## Reviewer Notes

Use this in App content or release notes/reviewer instructions if a reviewer notes field is available:

```text
No server test credentials are required. MoneyKai's current Android release uses an on-device local profile only.

To review the app: open MoneyKai, tap Continue, then create a local profile with any valid name and email address, for example "Play Reviewer" and "reviewer@example.com". The app will open the local dashboard.

Reviewer flows available in this build include Dashboard, Transactions, Add/Edit Transaction, Budget, Insights, Settings, Privacy & Security, local JSON export to clipboard, password-encrypted backup export through Android's share sheet, password-encrypted backup restore through the platform file picker, local diagnostics, sign out, and local data reset.

This build does not include backend authentication, Firebase/cloud backup, cloud sync, SMS capture, notification listener capture, Gmail sync, bank sync, Financial AI, loans, credit, payments, trading, tax/legal/investment advice, or remote crash/analytics reporting. User-entered data stays on the device unless the user explicitly uses export or backup actions.
```

## Store Listing Safe Copy

Short description:

```text
Track expenses, budgets, and monthly money trends with a local-first MoneyKai workspace.
```

Long-description opening:

```text
MoneyKai helps you record expenses, manage monthly budgets, and review personal finance trends on your device. The current Android release focuses on manual tracking, local persistence, local export, and optional password-encrypted backup files. It does not offer loans, trading, investment advice, bank sync, SMS reading, or notification capture.
```

Allowed phrases:

- Expense and budget tracking.
- Local-first finance workspace.
- Record transactions manually.
- Review monthly income, expenses, budgets, and trends.
- Export a plaintext snapshot to clipboard when you choose.
- Create a password-encrypted backup file when you choose.
- Restore from a selected encrypted backup file.
- No SMS, contacts, camera, microphone, location, storage, or notification-listener permissions in the current Android release build.

Avoid or gate these claims unless a future build actually ships them and the Play declarations/privacy policy are updated:

- Firebase backup or cloud backup.
- Cloud sync.
- Real remote authentication.
- Automatic bank tracking.
- SMS import, SMS capture, or notification reading.
- Gmail sync or statement inbox scanning.
- Financial AI, AI financial advisor, or automated money advice.
- Loans, credit, approvals, payments, remittance, bill payment, or money movement.
- Investment, tax, legal, trading, crypto, brokerage, or portfolio advice/execution.
- Bank-grade security, guaranteed savings, guaranteed outcomes, or "secure forever."

## Internal Testing Upload Checklist

1. Create or verify the Play Console app for package `com.moneykai.mobile`.
2. Enroll/use Play App Signing.
3. Confirm Play Console accepts the upload key for this package, or complete an upload-key reset if the package already has a different upload key.
4. Upload the signed AAB at `apps\MoneyKai-flutter\build\app\outputs\bundle\release\app-release.aab`.
5. Confirm Play Console shows version `1.0.1+2`.
6. Enter privacy policy URL `https://moneykai.com/privacy-policy`.
7. Complete Data safety using the local-only answers above.
8. Complete Financial features declaration using the budgeting/expense-tracking wording above.
9. Add reviewer notes above.
10. Keep store listing/screenshots aligned with this build: no cloud/Firebase, SMS, Gmail, bank sync, Financial AI, loans, payments, or advice claims.
11. Review the Play pre-launch report after upload and fix any device-specific crash, ANR, accessibility, security, or policy warning before wider rollout.

## Tester-Rule Caveats

- Internal testing can be used for quick Play upload validation, but production access is a separate gate.
- If the Play developer account is a new personal developer account subject to Google Play's current testing requirements, production access may require at least 12 testers opted into a closed test for at least 14 continuous days.
- The 12-tester/14-day requirement is an account/publishing gate, not proof that this AAB is invalid.
- Use closed testing, not only internal testing, if the account needs to satisfy the production-access tester rule.
- Keep tester instructions aligned with the local profile flow because no server credentials exist.

## Remaining Play Review Risk

- Verify `https://moneykai.com/privacy-policy` is live, public, and still matches this local-only Android release at upload time.
- Play Console may reject the upload key if `com.moneykai.mobile` was previously uploaded with a different upload key.
- Play pre-launch report cannot be run locally; it only runs after upload.
- Physical-device Play-path testing is still recommended because the recorded runtime smoke was on an Android SDK 36 emulator.
- If any web/mobile copy, screenshots, or metadata still imply Firebase/cloud backup, SMS capture, Gmail sync, bank sync, Financial AI, payments, loans, or advice, remove or gate that copy before submission.
- Any future SDK, backend sync, analytics, crash reporting, ads, bank/Gmail/SMS integration, payment, lending, investment, tax/legal/advice, or money-movement feature requires a fresh Data safety, privacy-policy, permissions, and financial-features review before upload.
