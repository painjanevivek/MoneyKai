const { getOrSetJsonCache } = require('../../../_lib/cache');
const { requireMethod, sendJson } = require('../../../_lib/http');
const { disabledOpsStatus } = require('../../../_lib/ai-disabled');
const { buildCacheKey } = require('../../../_lib/redis');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'GET')) {
    return;
  }

  // Safe to cache briefly: ops status exposes aggregate backend health only.
  const result = await getOrSetJsonCache({
    key: buildCacheKey('ai', 'ops', 'status'),
    ttlSeconds: 30,
    fetchFresh: async () => disabledOpsStatus(),
  });

  return sendJson(res, 200, result.value);
};
