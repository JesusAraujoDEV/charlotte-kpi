const { config } = require('../config');
const cocina = require('../services/cocina.service');
const { fetchJsonCached } = require('../lib/fetchWithCache');
const { asArray } = require('../lib/extract');

const inventoryController = {
  async lowStock(req, res, next) {
    try {
      const low = await fetchJsonCached({
        baseURL: config.cocinaBaseUrl,
        path: '/inventory/items',
        params: { stockStatus: 'LOW' },
        requestId: req.id,
        ttlMs: 30_000,
        fetcher: ({ requestId }) => cocina.getInventoryLow({ requestId }),
      });

      const items = asArray(low.data);

      res.json({
        low_stock: {
          count: low.ok ? items.length : 0,
          items: items.map((it) => ({
            id: it?.id ?? it?._id,
            name: it?.name,
            currentStock: it?.currentStock ?? it?.current_stock ?? it?.stock,
            minStock: it?.minStock ?? it?.min_stock,
          })),
        },
        sources: {
          cocina: { ok: low.ok, status: low.status, cache: low.cache },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async wasteTracker(req, res, next) {
    try {
      const limitItems = Math.min(50, Math.max(1, Number(req.query.limitItems || 10)));

      const low = await fetchJsonCached({
        baseURL: config.cocinaBaseUrl,
        path: '/inventory/items',
        params: { stockStatus: 'LOW' },
        requestId: req.id,
        ttlMs: 30_000,
        fetcher: ({ requestId }) => cocina.getInventoryLow({ requestId }),
      });

      const items = asArray(low.data).slice(0, limitItems);

      const logsResponses = await Promise.all(
        items.map((it) =>
          fetchJsonCached({
            baseURL: config.cocinaBaseUrl,
            path: `/inventory/items/${encodeURIComponent(it?.id ?? it?._id)}/logs`,
            params: {},
            requestId: req.id,
            ttlMs: 30_000,
            fetcher: ({ requestId }) => cocina.getInventoryItemLogs({ id: it?.id ?? it?._id, requestId }),
          })
        )
      );

      const perItem = items.map((it, idx) => {
        const r = logsResponses[idx];
        const logs = asArray(r?.data);
        return {
          id: it?.id ?? it?._id,
          name: it?.name,
          logs_ok: !!r?.ok,
          logs_count: r?.ok ? logs.length : 0,
        };
      });

      res.json({
        waste_tracker: {
          strategy: 'Per-item inventory logs (sampling) because no global logs endpoint is documented.',
          sampled_items: perItem,
          sampled_items_count: perItem.length,
          total_logs_count: perItem.reduce((acc, x) => acc + (x.logs_count || 0), 0),
        },
        sources: {
          cocina_low: { ok: low.ok, status: low.status, cache: low.cache },
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { inventoryController };
