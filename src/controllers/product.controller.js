const { config } = require('../config');
const cocina = require('../services/cocina.service');
const { fetchJsonCached } = require('../lib/fetchWithCache');
const { getWeekStartIso } = require('../lib/dates');
const { asArray } = require('../lib/extract');

function extractProductNamesFromTask(task) {
  const names = [];

  const direct = task?.product?.name ?? task?.productName ?? task?.item?.name;
  if (direct) names.push(String(direct));

  const items = task?.items || task?.products || task?.orderItems;
  if (Array.isArray(items)) {
    for (const it of items) {
      const n = it?.product?.name ?? it?.name ?? it?.productName;
      if (n) names.push(String(n));
    }
  }

  return names;
}

const productController = {
  async topSellers(req, res, next) {
    try {
      const top = Number(req.query.top || 10);
      const { startIso } = getWeekStartIso({ timezone: config.timezone, date: req.query.date });

      const history = await fetchJsonCached({
        baseURL: config.cocinaBaseUrl,
        path: '/kds/history',
        params: { startDate: startIso },
        requestId: req.id,
        fetcher: ({ requestId }) => cocina.getKdsHistory({ status: undefined, startDate: startIso, requestId }),
      });

      const tasks = asArray(history.data);
      const counts = new Map();

      if (history.ok) {
        for (const t of tasks) {
          for (const name of extractProductNamesFromTask(t)) {
            counts.set(name, (counts.get(name) || 0) + 1);
          }
        }
      }

      const ranking = [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, Math.max(1, top));

      res.json({
        week_start: startIso,
        top_sellers: {
          top: Math.max(1, top),
          items: ranking,
        },
        sources: {
          cocina: { ok: history.ok, status: history.status, cache: history.cache },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async menuAvailability(req, res, next) {
    try {
      const products = await fetchJsonCached({
        baseURL: config.cocinaBaseUrl,
        path: '/products',
        params: { activeOnly: 'false' },
        requestId: req.id,
        fetcher: ({ requestId }) => cocina.getProducts({ activeOnly: false, requestId }),
      });

      const list = asArray(products.data);
      const total = products.ok ? list.length : 0;
      const active = products.ok
        ? list.filter((p) => {
            if (typeof p?.active === 'boolean') return p.active;
            if (typeof p?.isActive === 'boolean') return p.isActive;
            const status = String(p?.status ?? '').toUpperCase();
            if (status) return status === 'ACTIVE' || status === 'ENABLED';
            return true; // assume active if unknown
          }).length
        : 0;

      res.json({
        menu_availability: {
          active,
          total,
          percentage: total ? (active / total) * 100 : 0,
        },
        sources: {
          cocina: { ok: products.ok, status: products.status, cache: products.cache },
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { productController };
