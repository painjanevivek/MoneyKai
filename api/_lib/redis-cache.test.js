const assert = require('node:assert/strict');
const test = require('node:test');

const redis = require('./redis');
const { enforceCooldown } = require('./cooldown');
const { applyRateLimit } = require('./http');

const createResponse = () => {
  const response = {
    headers: {},
    statusCode: null,
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return {
        send: (body) => {
          this.body = body;
        },
      };
    },
  };

  return response;
};

const loadCacheWithFakeRedis = (fakeRedis) => {
  const redisPath = require.resolve('./redis');
  const cachePath = require.resolve('./cache');
  const originalSafeRedisCall = redis.safeRedisCall;

  redis.safeRedisCall = async (_operationName, callback, fallbackValue) => {
    try {
      return {
        ok: true,
        configured: true,
        value: await callback(fakeRedis),
      };
    } catch {
      return {
        ok: false,
        configured: true,
        value: fallbackValue,
      };
    }
  };

  delete require.cache[cachePath];
  const cache = require('./cache');

  redis.safeRedisCall = originalSafeRedisCall;
  delete require.cache[cachePath];
  delete require.cache[redisPath];

  return cache;
};

test('builds namespaced Redis keys and hashes sensitive identifiers', () => {
  process.env.REDIS_KEY_HASH_SECRET = 'test-secret';
  const email = 'vivek@example.com';
  const ipAddress = '203.0.113.10';

  const rateLimitKey = redis.buildRateLimitKey('sign-in', redis.hashRedisIdentifier('email', email));
  const cacheKey = redis.buildCacheKey('ai', 'provider', 'status');
  const cooldownKey = redis.buildCooldownKey('sync', redis.hashRedisIdentifier('ip', ipAddress));

  assert.match(rateLimitKey, /^mk:rl:sign-in:email:[a-f0-9]{32}$/);
  assert.match(cacheKey, /^mk:cache:/);
  assert.match(cooldownKey, /^mk:cooldown:sync:ip:[a-f0-9]{32}$/);
  assert.equal(rateLimitKey.includes(email), false);
  assert.equal(cooldownKey.includes(ipAddress), false);
});

test('rejects Redis cache writes without a positive TTL', async () => {
  const { getOrSetJsonCache } = require('./cache');

  await assert.rejects(
    () => getOrSetJsonCache({
      key: redis.buildCacheKey('missing-ttl'),
      fetchFresh: async () => ({ ok: true }),
    }),
    /positive TTL/
  );
});

test('cache helper returns fresh data first and cached data on repeat', async () => {
  const store = new Map();
  const fakeRedis = {
    async get(key) {
      return store.get(key) ?? null;
    },
    async set(key, value) {
      store.set(key, value);
      return 'OK';
    },
  };
  const { getOrSetJsonCache } = loadCacheWithFakeRedis(fakeRedis);
  const key = redis.buildCacheKey('test', 'cache-hit');
  let freshCalls = 0;

  const first = await getOrSetJsonCache({
    key,
    ttlSeconds: 30,
    fetchFresh: async () => {
      freshCalls += 1;
      return { ok: true, version: freshCalls };
    },
  });
  const second = await getOrSetJsonCache({
    key,
    ttlSeconds: 30,
    fetchFresh: async () => {
      freshCalls += 1;
      return { ok: true, version: freshCalls };
    },
  });

  assert.equal(first.cacheStatus, 'miss');
  assert.equal(second.cacheStatus, 'hit');
  assert.equal(second.value.version, 1);
  assert.equal(freshCalls, 1);
});

test('local rate limit allows, blocks, and resets after TTL', async () => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  const request = {
    url: '/test-rate-limit',
    headers: { 'x-forwarded-for': '203.0.113.20' },
    socket: {},
  };
  const options = {
    keyPrefix: `test:rate-limit:${Date.now()}`,
    max: 1,
    windowMs: 20,
  };
  const firstResponse = createResponse();
  const secondResponse = createResponse();
  const thirdResponse = createResponse();

  assert.equal(await applyRateLimit(request, firstResponse, options), true);
  assert.equal(await applyRateLimit(request, secondResponse, options), false);
  assert.equal(secondResponse.statusCode, 429);
  assert.ok(secondResponse.headers['Retry-After']);

  await new Promise((resolve) => setTimeout(resolve, 30));

  assert.equal(await applyRateLimit(request, thirdResponse, options), true);
});

test('cooldown fallback blocks repeated action without raw identifier in key', async () => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  const firstResponse = createResponse();
  const secondResponse = createResponse();
  const identifier = `user-${Date.now()}`;
  const options = {
    action: 'test-cooldown',
    identifierType: 'uid',
    identifier,
    ttlSeconds: 30,
  };

  assert.equal(await enforceCooldown(firstResponse, options), true);
  assert.equal(await enforceCooldown(secondResponse, options), false);
  assert.equal(secondResponse.statusCode, 429);
  assert.ok(secondResponse.headers['Retry-After']);
});
