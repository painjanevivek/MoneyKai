# AI SMS Parser Eval And Deployment

Last reviewed: 2026-06-13

## Current Status

AI SMS Assist is feature-flagged and review-only. The mobile app redacts SMS text before any AI request and never calls OpenAI directly. The backend owns provider configuration, authentication, rate limiting, schema validation, and deterministic validation.

## Eval Harness

The deterministic parser eval runner lives in:

- `src/services/captureParserEval.ts`
- `src/services/captureParserEval.test.ts`

It reports:

- total fixtures
- passed and failed cases
- pass rate
- expected/actual/matched parse status counts
- field accuracy for amount, merchant, type, payment method, category, ignore reason, and draftability
- actionable case-level failure messages

Run:

```bash
npm run test:capture
```

Future AI eval extension:

- Store anonymized, consented SMS fixtures only.
- Compare deterministic parser output to AI fallback output on low-confidence cases.
- Track false drafts, false ignores, wrong amount, wrong type, wrong merchant, wrong category, and hallucinated reference presence.
- Require every AI candidate to pass deterministic validation and user review.

## Backend Deployment Configuration

Configure these backend environment variables in production or staging:

```bash
OPENAI_API_KEY=...
OPENAI_SMS_MODEL=gpt-5.4-nano
CAPTURE_AI_RATE_LIMIT_PER_MINUTE=20
CAPTURE_AI_REQUEST_MAX_CHARS=1200
```

Do not place `OPENAI_API_KEY` in the Expo/mobile environment. The mobile app should only know the MoneyKai backend base URL.

## Release Checks

Before enabling AI Assist beyond scaffold:

- Backend `/v1/capture/ai-parse` is deployed behind Firebase bearer auth.
- `OPENAI_API_KEY` is configured only on the backend host.
- Backend logs do not record raw request bodies or provider prompts.
- Mobile sends only redacted body text from `redactSmsForAiAssist`.
- Feature flag defaults off for production.
- Provider errors and validation failures fall back to manual review, not auto-add.
- Privacy policy and Data Safety answers mention optional AI processing if enabled.

## Failure Policy

AI output may suggest a draft but must never create a final transaction directly. Any unsupported amount, direction, category, payment method, or reference claim fails validation and returns to manual review.
