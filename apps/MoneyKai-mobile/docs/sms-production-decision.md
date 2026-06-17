# SMS Production Decision

Decision date: 2026-06-11
Last reviewed: 2026-06-17

## Decision

SMS Research Mode can be present in preview and production only as a no-permission manual SMS research path. Native SMS receiver and inbox-read access remain development-only and must stay out of preview and production builds.

MoneyKai should continue to prioritize safer alternatives:

- Android notification capture for supported transaction alerts.
- Manual SMS paste/import in release builds without SMS permissions.
- Future structured imports such as bank exports or regulated Account Aggregator integrations.

## Rationale

Google Play treats SMS permissions as high-risk or sensitive. SMS-based money management can be an eligible exception for budgeting apps, but it still requires Google Play review, declaration, clear user disclosure, strong data minimization, and compliance with broader user-data policies. MoneyKai has not completed real-device SMS validation, dual-SIM validation, permission revocation validation, legal/privacy review, Play Console declaration, or Data Safety review for SMS permissions.

Manual SMS paste does not request `READ_SMS`, `RECEIVE_SMS`, `SEND_SMS`, or related restricted permissions. Users choose exactly which SMS text to paste, MoneyKai parses it into a reviewable draft, and raw pasted text is discarded after sanitized parsing.

Policy source: https://support.google.com/googleplay/android-developer/answer/10208820

## Production Requirements Before Reconsideration

MoneyKai can reconsider SMS for production only after all of the following are complete:

- Full Phase 4G device validation across Android versions, OEMs, dual-SIM behavior, permission states, and background delivery.
- Production AAB inspection proving restricted SMS permissions are absent unless an approved production SMS path is explicitly enabled.
- Play Console permission declaration draft and reviewer notes.
- Privacy-policy and prominent-disclosure review.
- Data Safety review for SMS permission use, local processing, backup exclusion, and raw-data minimization.
- Parser accuracy review with real sanitized SMS examples and documented false-positive/false-negative handling.
- Written legal/product signoff that SMS is critical core functionality and safer alternatives are insufficient.

## Current Guardrails

- `EXPO_PUBLIC_SMS_RESEARCH_BUILD=true` enables the no-permission manual SMS research UI in preview and production.
- `EXPO_PUBLIC_NATIVE_SMS_RESEARCH_BUILD=true` is reserved for internal native SMS research.
- Preview and production EAS profiles set `EXPO_PUBLIC_NATIVE_SMS_RESEARCH_BUILD=false`.
- `app.json` blocks restricted SMS permissions for release builds.
- `app.config.js` loads the SMS manifest plugin only when native SMS research is enabled outside preview and production.
- `npm run android:verify:release-permissions` inspects the compiled production AAB manifest and fails the release if `READ_SMS`, `RECEIVE_MMS`, `RECEIVE_SMS`, `RECEIVE_WAP_PUSH`, `SEND_SMS`, or `WRITE_SMS` are present.
- SMS Research Mode is disabled by default and requires explicit in-app consent.
- SMS drafts are review-only and never auto-confirm transactions.
- Capture inbox data and raw SMS bodies are excluded from cloud backup snapshots by default.

## Final Phase 4H Outcome

Final path: `Release manual research, native SMS development-only`.

Production status: no-permission manual SMS research can ship in release builds. Native SMS receiver or inbox-read production access remains blocked until policy approval, device validation, privacy/legal review, and explicit release signoff are complete.
