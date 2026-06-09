# SMS Production Decision

Decision date: 2026-06-10

## Decision

SMS capture remains research-only and must stay out of preview and production builds.

MoneyKai should continue to prioritize safer alternatives:

- Android notification capture for supported transaction alerts.
- Manual SMS paste/import in internal research builds.
- Future structured imports such as bank exports or regulated Account Aggregator integrations.

## Rationale

Google Play treats SMS permissions as high-risk or sensitive. SMS-based money management can be an eligible exception for budgeting apps, but it still requires Google Play review, declaration, clear user disclosure, strong data minimization, and compliance with broader user-data policies. MoneyKai has not completed real-device SMS validation, dual-SIM validation, permission revocation validation, legal/privacy review, Play Console declaration, or Data Safety review for SMS permissions.

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

- `EXPO_PUBLIC_SMS_RESEARCH_BUILD` is true only for the development EAS profile.
- Preview and production EAS profiles set `EXPO_PUBLIC_SMS_RESEARCH_BUILD=false`.
- `app.json` does not declare restricted SMS permissions.
- `app.config.js` loads the SMS manifest plugin only when the research build flag is true.
- SMS Research Mode is disabled by default and requires explicit in-app consent.
- SMS drafts are review-only and never auto-confirm transactions.
- Capture inbox data and raw SMS bodies are excluded from cloud backup snapshots by default.

## Final Phase 4H Outcome

Final path: `Research-only`.

Production status: blocked until policy approval, device validation, privacy/legal review, and explicit release signoff are complete.
