# Account Aggregator Exploration Checklist

MoneyKai does not claim production Account Aggregator connectivity until an FIU/TSP onboarding path is confirmed.

## Current decision

- Use a partner-led Account Aggregator path first.
- Keep the provider as an exploratory backend adapter until consent artifacts, revocation, audit history, and data deletion flows are production-ready.
- Do not expose AA credentials, secrets, or partner integration details in the mobile bundle.

## Compliance checklist

- Identify FIU/TSP partner requirements and onboarding timeline.
- Define user-visible consent purpose, duration, data types, and revocation copy.
- Map AA financial data into MoneyKai account, holding, liability, and snapshot models.
- Store consent status and sync audit events without raw sensitive payloads in logs.
- Add deletion and disconnect flows before enabling production sync.
- Keep feature flags disabled until legal, privacy, and partner requirements are complete.
