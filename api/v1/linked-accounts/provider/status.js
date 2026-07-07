const { getOrSetJsonCache } = require('../../../_lib/cache');
const { requireMethod, sendJson } = require('../../../_lib/http');
const { disabledProviderStatus } = require('../../../_lib/linked-accounts-disabled');
const { buildCacheKey } = require('../../../_lib/redis');

module.exports = async (req, res) => {
  if (!requireMethod(req, res, 'GET')) {
    return;
  }

  // Safe to cache briefly: provider availability contains no account or balance data.
  const result = await getOrSetJsonCache({
    key: buildCacheKey('linked-accounts', 'provider', 'status'),
    ttlSeconds: 120,
    fetchFresh: async () => disabledProviderStatus(),
  });

  return sendJson(res, 200, result.value);
};
