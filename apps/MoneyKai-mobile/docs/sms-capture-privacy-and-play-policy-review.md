# SMS Capture Privacy And Play Policy Review

Last reviewed: 2026-06-13

## Sources Reviewed

- Expo SDK 56 documentation: https://docs.expo.dev/versions/v56.0.0/
- Google Play SMS and Call Log permissions policy: https://support.google.com/googleplay/android-developer/answer/10208820
- Google Play User Data policy: https://support.google.com/googleplay/android-developer/answer/10144311
- Google Play Permissions and APIs that access sensitive information: https://support.google.com/googleplay/android-developer/answer/16558241
- Google Play Data safety form guidance: https://support.google.com/googleplay/android-developer/answer/10787469
- Google Play prepare app for review guidance: https://support.google.com/googleplay/android-developer/answer/9859455

## Current Release Decision

Native SMS inbox import and live SMS receiver access remain internal research-only. Production Play builds must not declare restricted SMS permissions unless a separate Play Console declaration, privacy/legal review, and release signoff approve that path.

Production-safe paths:

- Notification capture where users explicitly enable notification access.
- Manual SMS paste/import without requesting `READ_SMS` or `RECEIVE_SMS`.
- Future structured import paths such as bank exports or regulated account integrations.

## Play Policy Review

Google Play treats SMS and Call Log permission groups as restricted/high-risk. Apps that do not qualify or do not receive approval must remove those permissions from the manifest. The policy includes possible exceptions for financial transaction management, but approval is not automatic and is evaluated by Google Play during review.

MoneyKai release gate:

- Do not request `READ_SMS`, `RECEIVE_SMS`, `SEND_SMS`, `RECEIVE_MMS`, or `RECEIVE_WAP_PUSH` in production unless Play review approves the exact production SMS use case.
- Keep native SMS code behind research build flags.
- Inspect the production AAB before upload to verify restricted SMS permissions are absent.
- If production SMS is later pursued, submit Play Console permission declarations, reviewer notes, in-app disclosure screenshots, privacy policy updates, and Data Safety answers together.

## Privacy Review

Current controls:

- SMS import is gated by explicit research flags and user consent.
- Parser outputs reviewable drafts; no SMS transaction is auto-confirmed.
- Discovery samples are redacted before display.
- OTPs, masked account numbers, UPI IDs, references, and long numeric identifiers are redacted.
- Capture backup excludes raw SMS bodies and capture inbox state.
- Diagnostics redact sensitive text and do not upload raw SMS.
- AI SMS Assist uses redacted text, server-side auth, rate limits, schema validation, and review-only results.
- Mobile app does not call OpenAI directly.

Required before production SMS permission reconsideration:

- Update public privacy policy to name SMS access, purpose, local processing, retention, deletion, backup exclusion, and AI handling if enabled.
- Add prominent in-app disclosure before requesting SMS permissions.
- Complete Data Safety form answers for SMS-derived financial data, diagnostics, and optional AI processing.
- Confirm raw SMS text is not logged by native, JS, backend, crash reporting, analytics, backups, or support exports.
- Confirm user can disable SMS capture and revoke permission without losing confirmed transactions.

## Formal Signoff Checklist

| Gate | Owner | Status | Evidence |
| --- | --- | --- | --- |
| Production AAB manifest has no restricted SMS permission | Engineering | Pending | |
| Real-device QA matrix complete | QA | Pending | `docs/sms-capture-real-device-qa.md` |
| Privacy policy reviewed for SMS and AI handling | Privacy/legal | Pending | |
| Play Console SMS declaration drafted, if production SMS is pursued | Release owner | Pending | |
| Data Safety form reviewed for SMS-derived data | Release owner | Pending | |
| Backend logs reviewed for raw SMS exclusion | Engineering | Pending | |
| Diagnostics and backup raw SMS exclusion verified | Engineering | Pending | |
| AI provider data handling reviewed, if AI Assist is enabled | Privacy/legal | Pending | |

## Release Rule

If any signoff row remains pending, ship production without native SMS permissions. Keep SMS import as no-permission manual paste or internal research only.
