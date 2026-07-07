const {
  normalizeRedisTtlSeconds,
  safeRedisCall,
} = require('./redis');

const assertCacheKey = (key) => {
  if (typeof key !== 'string' || !key.startsWith('mk:cache:')) {
    throw new Error('Cache helper requires a namespaced mk:cache Redis key.');
  }

  return key;
};

const readCachedJson = async (key) => {
  const result = await safeRedisCall('cache_get', (redis) => redis.get(key), null);
  if (!result.ok || result.value == null) {
    return { hit: false, value: undefined };
  }

  if (typeof result.value !== 'string') {
    return { hit: true, value: result.value };
  }

  try {
    return { hit: true, value: JSON.parse(result.value) };
  } catch {
    return { hit: false, value: undefined };
  }
};

const writeCachedJson = async (key, value, ttlSeconds) => {
  if (value === undefined) {
    return false;
  }

  let serialized;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return false;
  }

  if (serialized === undefined) {
    return false;
  }

  const result = await safeRedisCall(
    'cache_set',
    (redis) => redis.set(key, serialized, { ex: ttlSeconds }),
    null
  );
  return result.ok;
};

const getOrSetJsonCache = async ({ key, ttlSeconds, fetchFresh }) => {
  const cacheKey = assertCacheKey(key);
  const ttl = normalizeRedisTtlSeconds(ttlSeconds);

  if (typeof fetchFresh !== 'function') {
    throw new Error('Cache helper requires a fresh-data function.');
  }

  const cached = await readCachedJson(cacheKey);
  if (cached.hit) {
    return {
      value: cached.value,
      cacheStatus: 'hit',
    };
  }

  const fresh = await fetchFresh();
  if (fresh !== undefined) {
    await writeCachedJson(cacheKey, fresh, ttl);
  }

  return {
    value: fresh,
    cacheStatus: 'miss',
  };
};

module.exports = {
  getOrSetJsonCache,
};
