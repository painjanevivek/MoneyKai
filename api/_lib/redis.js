const { Redis } = require('@upstash/redis');

const REQUIRED_ENV = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];

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
  getRedisClient,
  getRedisConfigStatus,
  isRedisConfigured,
  safeRedisCall,
};
