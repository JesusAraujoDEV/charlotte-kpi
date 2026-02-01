const { cache } = require('../state/cache');

function buildKey(req) {
  return `resp:${req.method}:${req.originalUrl}`;
}

function cacheResponse({ ttlMs }) {
  const ttl = Number(ttlMs);

  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = buildKey(req);
    const cached = cache.get(key);
    if (cached) {
      res.setHeader('x-cache', 'HIT');
      return res.status(cached.statusCode || 200).json(cached.body);
    }

    const originalJson = res.json.bind(res);

    res.json = (body) => {
      const statusCode = res.statusCode || 200;
      cache.set(
        key,
        {
          statusCode,
          body,
          cachedAt: new Date().toISOString(),
        },
        ttl
      );

      res.setHeader('x-cache', 'MISS');
      return originalJson(body);
    };

    return next();
  };
}

module.exports = { cacheResponse };
