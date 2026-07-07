const crypto = require('node:crypto');
const { Redis } = require('@upstash/redis');

const REQUIRED_ENV = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
const REDIS_KEY_PREFIX = 'mk';
const REDIS_KEY_PURPOSES = new Set(['rl', 'cache', 'cooldown', 'dedupe']);
const DEFAULT_MAX_TTL_SECONDS = 24 * 60 * 60;

let redisClient = null;
let redisClientConfigKey = '';
const loggedWarnings = new Set();

const logRedisWarningOnce = (code, message, metadata = {}) => {
  if (loggedWarnings.has(code)) {
    return;
  }

  loggedWarnings.add(code);
  console.warn(`[redis] ${message}`, metadata);
};

const readRedisConfig = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL || '';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || '';
  const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name]);

  return {
    configured: missingEnv.length === 0,
    missingEnv,
    url,
    token,
  };
};

const getRedisConfigStatus = () => {
  const config = readRedisConfig();
  return {
    configured: config.configured,
    missingEnv: config.missingEnv,
  };
};

const isRedisConfigured = () => getRedisConfigStatus().configured;

const getRedisClient = () => {
  const config = readRedisConfig();

  if (!config.configured) {
    redisClient = null;
    redisClientConfigKey = '';
    logRedisWarningOnce('missing-env', 'Redis is not configured; using local fallback behavior.', {
      missingEnv: config.missingEnv,
    });
    return null;
  }

  const configKey = `${config.url}:${config.token}`;
  if (redisClient && redisClientConfigKey === configKey) {
    return redisClient;
  }

  redisClient = new Redis({
    url: config.url,
    token: config.token,
  });
  redisClientConfigKey = configKey;
  return redisClient;
};

const sanitizeOperationName = (operationName) => {
  if (typeof operationName !== 'string') {
    return 'operation';
  }

  const normalized = operationName.replace(/[^a-z0-9_-]/gi, '_').slice(0, 64);
  return normalized || 'operation';
};

const sanitizeRedisKeyPart = (part) => {
  if (typeof part !== 'string' && typeof part !== 'number') {
    throw new Error('Redis key parts must be strings or numbers.');
  }

  const normalized = String(part).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const compact = normalized.replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!compact) {
    throw new Error('Redis key parts cannot be empty.');
  }

  return compact.slice(0, 96);
};

const hashSensitiveKeyPart = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error('Sensitive Redis key parts must be strings or numbers.');
  }

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) {
    throw new Error('Sensitive Redis key parts cannot be empty.');
  }

  const secret = process.env.REDIS_KEY_HASH_SECRET || '';
  const hash = secret
    ? crypto.createHmac('sha256', secret).update(normalized).digest('hex')
    : crypto.createHash('sha256').update(normalized).digest('hex');

  return hash.slice(0, 32);
};

const hashRedisIdentifier = (type, value) =>
  `${sanitizeRedisKeyPart(type)}:${hashSensitiveKeyPart(value)}`;

const expandRedisKeyPart = (part) =>
  String(part).split(':').map(sanitizeRedisKeyPart);

const buildRedisKey = (purpose, ...parts) => {
  const safePurpose = sanitizeRedisKeyPart(purpose);
  if (!REDIS_KEY_PURPOSES.has(safePurpose)) {
    throw new Error(`Unsupported Redis key purpose: ${safePurpose}`);
  }

  if (parts.length === 0) {
    throw new Error('Redis keys require at least one purpose-specific part.');
  }

  return [REDIS_KEY_PREFIX, safePurpose, ...parts.flatMap(expandRedisKeyPart)].join(':');
};

const buildRateLimitKey = (...parts) => buildRedisKey('rl', ...parts);
const buildCacheKey = (...parts) => buildRedisKey('cache', ...parts);
const buildCooldownKey = (...parts) => buildRedisKey('cooldown', ...parts);
const buildDedupeKey = (...parts) => buildRedisKey('dedupe', ...parts);

const normalizeRedisTtlSeconds = (ttlSeconds, options = {}) => {
  const maxSeconds = options.maxSeconds ?? DEFAULT_MAX_TTL_SECONDS;
  const ttl = Number(ttlSeconds);

  if (!Number.isFinite(ttl) || ttl <= 0) {
    throw new Error('Redis writes require a positive TTL.');
  }

  if (ttl > maxSeconds) {
    throw new Error(`Redis TTL cannot exceed ${maxSeconds} seconds.`);
  }

  return Math.ceil(ttl);
};

const normalizeRedisTtlMs = (ttlMs, options = {}) => {
  const maxSeconds = options.maxSeconds ?? DEFAULT_MAX_TTL_SECONDS;
  const ttl = Number(ttlMs);

  if (!Number.isFinite(ttl) || ttl <= 0) {
    throw new Error('Redis writes require a positive TTL.');
  }

  if (ttl > maxSeconds * 1000) {
    throw new Error(`Redis TTL cannot exceed ${maxSeconds} seconds.`);
  }

  return Math.ceil(ttl);
};

const safeRedisCall = async (operationName, callback, fallbackValue = undefined) => {
  const redis = getRedisClient();
  if (!redis) {
    return {
      ok: false,
      configured: false,
      value: fallbackValue,
    };
  }

  try {
    return {
      ok: true,
      configured: true,
      value: await callback(redis),
    };
  } catch (error) {
    const safeOperationName = sanitizeOperationName(operationName);
    logRedisWarningOnce(`call-failed:${safeOperationName}`, 'Redis operation failed; using fallback behavior.', {
      operation: safeOperationName,
      errorName: error?.name || 'Error',
    });

    return {
      ok: false,
      configured: true,
      value: fallbackValue,
    };
  }
};

module.exports = {
  buildCacheKey,
  buildCooldownKey,
  buildDedupeKey,
  buildRateLimitKey,
  buildRedisKey,
  getRedisClient,
  getRedisConfigStatus,
  hashRedisIdentifier,
  hashSensitiveKeyPart,
  isRedisConfigured,
  normalizeRedisTtlMs,
  normalizeRedisTtlSeconds,
  safeRedisCall,
  sanitizeRedisKeyPart,
};
