const { getOrSetJsonCache } = require('../../../_lib/cache');
const { requireMethod, sendJson } = require('../../../_lib/http');
const { disabledModelStatus } = require('../../../_lib/ai-disabled');
const { buildCacheKey } = require('../../../_lib/redis');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'GET')) {
    return;
  }

  // Safe to cache briefly: model status is public capability metadata, not user content.
  const result = await getOrSetJsonCache({
    key: buildCacheKey('ai', 'models', 'status'),
    ttlSeconds: 120,
    fetchFresh: async () => disabledModelStatus(),
  });

  return sendJson(res, 200, result.value);
};
