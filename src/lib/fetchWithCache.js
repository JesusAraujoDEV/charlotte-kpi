const { cache } = require('../state/cache');
const { buildCacheKey } = require('./http');

async function fetchJsonCached({ baseURL, path, params, requestId, ttlMs, fetcher }) {
  const key = buildCacheKey({ baseURL, path, params });
  const cached = cache.get(key);
  if (cached) return { ...cached, cache: 'HIT' };

  try {
    const result = await fetcher({ requestId });
    const payload = {
      ...result,
      cache: 'MISS',
      fetched_at: new Date().toISOString(),
    };

    cache.set(key, payload, ttlMs);
    return payload;
  } catch (err) {
    const payload = {
      ok: false,
      status: 0,
      data: null,
      cache: 'MISS',
      fetched_at: new Date().toISOString(),
      error: {
        message: err?.message || 'Upstream request failed',
        code: err?.code,
      },
    };

    // brief negative-cache to avoid stampedes
    const negativeTtl = Math.min(2000, Number(ttlMs || 0) || 2000);
    cache.set(key, payload, negativeTtl);
    return payload;
  }
}

module.exports = { fetchJsonCached };
