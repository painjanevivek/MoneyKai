const { getOrSetJsonCache } = require('../../../_lib/cache');
const { requireMethod, sendJson } = require('../../../_lib/http');
const { providerStatus } = require('../../../_lib/ai-runtime');
const { buildCacheKey } = require('../../../_lib/redis');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'GET')) {
    return;
  }

  // Safe to cache briefly: backend AI provider status contains configuration availability only.
  const result = await getOrSetJsonCache({
    key: buildCacheKey('ai', 'providers', 'status'),
    ttlSeconds: 60,
    fetchFresh: async () => providerStatus(),
  });

  return sendJson(res, 200, result.value);
};
