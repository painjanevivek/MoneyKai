# MoneyKai Redis Deployment Setup

Redis is backend-only for MoneyKai. Do not add Redis secrets to Expo app config, public environment variables, mobile builds, or web client bundles.

## Required Provider

Use Upstash Redis with the REST API credentials:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Optional:

- `REDIS_KEY_HASH_SECRET`

Use a long random `REDIS_KEY_HASH_SECRET` in production so sensitive Redis key parts are HMAC hashed before they become key segments.

## Vercel Environment Variables

Add the required variables only to serverless/backend API environments:

- Preview: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `REDIS_KEY_HASH_SECRET`
- Production: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `REDIS_KEY_HASH_SECRET`

Do not use `EXPO_PUBLIC_`, `NEXT_PUBLIC_`, or any other client-exposed prefix for Redis settings.

## Deployment Checks

1. Deploy a Vercel preview.
2. Confirm Redis env vars are present in serverless functions.
3. Exercise a rate-limited API route until it returns `429`.
4. Confirm the response includes `Retry-After`.
5. Confirm safe status endpoints still return correct payloads.
6. Inspect logs for safe Redis events such as `redis_rate_limit_blocked` and `redis_cache_miss`.
7. Confirm logs do not include Redis tokens, raw emails, raw IP addresses, auth tokens, request bodies, financial data, Gmail content, or AI prompts.
8. Promote to production only after preview checks pass.

## Client Exposure Check

Before release, verify Redis strings are not present in client code:

```bash
rg "UPSTASH_REDIS|REDIS_KEY_HASH_SECRET|@upstash/redis" apps packages
```

Expected result: no matches from Expo/mobile/web client code.
