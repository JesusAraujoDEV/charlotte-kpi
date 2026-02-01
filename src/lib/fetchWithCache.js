const { cache } = require('../state/cache');
const { buildCacheKey } = require('./http');

async function fetchJsonCached({ baseURL, path, params, requestId, ttlMs, fetcher }) {
  const key = buildCacheKey({ baseURL, path, params });
  const cached = cache.get(key);
  if (cached) return { ...cached, cache: 'HIT' };

  const result = await fetcher({ requestId });
  const payload = {
    ...result,
    cache: 'MISS',
    fetched_at: new Date().toISOString(),
  };

  cache.set(key, payload, ttlMs);
  return payload;
}

module.exports = { fetchJsonCached };
