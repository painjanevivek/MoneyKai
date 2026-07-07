# MoneyKai Redis Rollout Plan

Roll Redis out gradually. Redis should improve backend reliability without changing user-visible behavior except for stronger shared rate limiting and short-lived caching.

## Rollout Order

1. Deploy the Redis connection layer with env vars configured.
2. Enable Redis-backed rate limiting first.
3. Watch API logs for Redis fallback events and Redis operation failures.
4. Confirm auth sign-in, sign-up, password reset, and Google OAuth routes do not block normal users unexpectedly.
5. Enable short-lived caching only for approved status and provider availability endpoints.
6. Keep cache TTLs short until production behavior is stable.
7. Enable cooldowns only on repeated expensive actions.
8. Increase TTLs only after stable production metrics.
9. Keep all private user data out of Redis.

## Monitor

- `redis_rate_limit_fallback`
- `redis_rate_limit_blocked`
- `redis_cache_hit`
- `redis_cache_miss`
- Unexpected increases in `429` responses
- Auth error rates
- API latency on cached status endpoints
- Upstash request volume and cost

## Rollback

If Redis causes production issues:

1. Remove or disable `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in the affected Vercel environment.
2. Redeploy or restart serverless functions.
3. Confirm local in-memory fallback is active from safe Redis fallback logs.
4. Keep Redis disabled until the failing route or TTL rule is fixed and tested.

Do not disable auth route rate limiting entirely as part of rollback. The local fallback remains the safer degraded mode.
