const {
  buildCooldownKey,
  hashRedisIdentifier,
  normalizeRedisTtlSeconds,
  safeRedisCall,
} = require('./redis');
const { sendJson } = require('./http');

const cooldownBuckets =
  globalThis.__moneykaiCooldownBuckets ||
  new Map();

globalThis.__moneykaiCooldownBuckets = cooldownBuckets;

const setLocalCooldown = (key, ttlSeconds) => {
  const now = Date.now();
  const existing = cooldownBuckets.get(key);
  if (existing && existing.expiresAt > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.expiresAt - now) / 1000)),
    };
  }

  cooldownBuckets.set(key, {
    expiresAt: now + ttlSeconds * 1000,
  });

  if (cooldownBuckets.size > 1000) {
    for (const [bucketKey, bucket] of cooldownBuckets.entries()) {
      if (bucket.expiresAt <= now) {
        cooldownBuckets.delete(bucketKey);
      }
    }
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
};

const enforceCooldown = async (res, options = {}) => {
  const ttlSeconds = normalizeRedisTtlSeconds(options.ttlSeconds, { maxSeconds: 5 * 60 });
  const key = buildCooldownKey(
    options.action || 'action',
    hashRedisIdentifier(options.identifierType || 'identifier', options.identifier)
  );

  const redisResult = await safeRedisCall(
    'cooldown_set',
    (redis) => redis.set(key, '1', { ex: ttlSeconds, nx: true }),
    null
  );

  const localResult = redisResult.ok ? null : setLocalCooldown(key, ttlSeconds);
  const allowed = redisResult.ok
    ? redisResult.value === 'OK' || redisResult.value === true
    : localResult.allowed;

  if (allowed) {
    return true;
  }

  const retryAfterSeconds = redisResult.ok
    ? ttlSeconds
    : localResult.retryAfterSeconds;

  res.setHeader('Retry-After', String(retryAfterSeconds));
  sendJson(res, 429, {
    error: options.message || 'Please wait a moment before trying this action again.',
  });
  return false;
};

module.exports = {
  enforceCooldown,
};
