# Cache and transient coordination policy

Firestore remains authoritative for MoneyKai financial and operational records. Redis/Upstash is permitted only for bounded, non-authoritative concerns:

- request throttling and abuse controls;
- short-lived cooldowns and deduplication hints;
- cacheable public or derived responses that can be recomputed;
- transient locks where loss cannot corrupt canonical data.

The following are prohibited from Redis:

- canonical transactions, balances, budgets, reconciliation outcomes, or saved reports;
- bearer tokens, OAuth refresh tokens, encryption material, or raw financial documents;
- a cache key lacking an explicit tenant/user namespace for private derived data;
- a write path that cannot fall back to the authoritative service after a cache miss.

Every allowed cache entry requires a documented owner, key namespace, TTL, invalidation rule, sensitivity class, and bypass behavior. Authentication and mutation rate limits fail closed in production when their required distributed coordination backend is unavailable.
