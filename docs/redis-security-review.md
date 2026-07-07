# MoneyKai Redis Security Review

Review date: 2026-07-08

## Scope

Reviewed the Redis implementation in:

- `api/_lib/redis.js`
- `api/_lib/http.js`
- `api/_lib/cache.js`
- `api/_lib/cooldown.js`
- Redis-enabled status routes under `api/v1`
- `api/_lib/redis-cache.test.js`
- Redis deployment and rollout docs

## Findings

- Redis is backend-only. No Expo/mobile/web client code imports `@upstash/redis` or references `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, or `REDIS_KEY_HASH_SECRET`.
- Redis keys are namespaced with `mk:` and limited to `rl`, `cache`, `cooldown`, and `dedupe` purposes.
- Rate-limit keys use `mk:rl:`.
- Cache keys use `mk:cache:`.
- Cooldown keys use `mk:cooldown:`.
- Sensitive identifiers are hashed before key use.
- Raw client IPs are hashed before Redis or local fallback key use.
- Auth email-specific rate-limit keys use existing SHA-256 email hashes, not raw emails.
- Redis writes have TTLs:
  - Rate limits use atomic `INCR` plus `PEXPIRE`.
  - Cache writes require `ttlSeconds`.
  - Cooldowns require `ttlSeconds`.
- Cache is limited to approved low-risk status/provider availability endpoints.
- Auth responses, billing sessions, Gmail data, financial documents, transactions, user profile data, account balances, AI prompts, and AI user-content responses are not cached.
- Redis logs use safe event metadata and do not log raw Redis keys, tokens, emails, IP addresses, request bodies, financial data, Gmail content, or AI prompts.
- Missing Redis env vars fall back to local in-memory rate limits/cooldowns and fresh cache fetches.

## Verification

Commands run:

```bash
npm run api:test
rg "UPSTASH_REDIS|REDIS_KEY_HASH_SECRET|@upstash/redis" apps packages
```

Results:

- API Redis tests passed.
- Client exposure scan returned no matches.

## Production Checks Still Required

- Confirm Upstash env vars are set only in Vercel backend/serverless environments.
- Confirm deployed API logs show safe Redis events without sensitive values.
- Confirm production rate limiting returns `429` and `Retry-After` when exceeded.
- Confirm cached status endpoints return correct payloads in preview and production.
- Confirm Upstash contains no unexpected permanent keys after traffic.
