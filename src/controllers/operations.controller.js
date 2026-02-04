const { config } = require('../config');
const dp = require('../services/dp.service');
const cocina = require('../services/cocina.service');
const { fetchJsonCached } = require('../lib/fetchWithCache');
const { getDayRangeIso } = require('../lib/dates');
const { asArray, get } = require('../lib/extract');
const { safeDiv } = require('../lib/numbers');
const { durationMs } = require('../lib/dates');

function avg(values) {
  const arr = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

const operationsController = {
  async kitchenVelocity(req, res, next) {
    try {
      const date = req.query.date;
      const { startIso } = getDayRangeIso({ timezone: config.timezone, date });

      const served = await fetchJsonCached({
        baseURL: config.cocinaBaseUrl,
        path: '/kds/history',
        params: { status: 'SERVED', startDate: startIso },
        requestId: req.id,
        ttlMs: 5_000,
        fetcher: ({ requestId }) => cocina.getKdsHistory({ status: 'SERVED', startDate: startIso, requestId }),
      });

      const tasks = asArray(served.data);
      const durations = tasks
        .map((t) => durationMs(t?.startedAt ?? t?.started_at, t?.finishedAt ?? t?.finished_at))
        .filter((v) => v != null);

      const avgMs = served.ok ? avg(durations) : 0;

      res.json({
        day_start: startIso,
        kitchen_velocity: {
          avg_ms: avgMs,
          avg_minutes: avgMs / 60000,
          sample_size: durations.length,
        },
        sources: {
          cocina: { ok: served.ok, status: served.status, cache: served.cache },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async deliverySuccessRate(req, res, next) {
    try {
      const date = req.query.date;

      if (date) {
        const [deliveredResp, totalResp] = await Promise.all([
          fetchJsonCached({
            baseURL: config.dpBaseUrl,
            path: '/api/dp/v1/orders',
            params: { status: 'DELIVERED', date },
            requestId: req.id,
            ttlMs: 5_000,
            fetcher: ({ requestId }) => dp.getOrders({ status: 'DELIVERED', date, requestId }),
          }),
          fetchJsonCached({
            baseURL: config.dpBaseUrl,
            path: '/api/dp/v1/orders',
            params: { date },
            requestId: req.id,
            ttlMs: 5_000,
            fetcher: ({ requestId }) => dp.getOrders({ date, requestId }),
          }),
        ]);

        const deliveredList = asArray(deliveredResp.data);
        const totalList = asArray(totalResp.data);

        const deliveredNum = deliveredResp.ok ? deliveredList.length : 0;
        const totalNum = totalResp.ok ? totalList.length : 0;

        res.json({
          date,
          delivery_success_rate: {
            delivered: deliveredNum,
            total: totalNum,
            percentage: safeDiv(deliveredNum, totalNum) * 100,
          },
          sources: {
            dp_delivered: { ok: deliveredResp.ok, status: deliveredResp.status, cache: deliveredResp.cache },
            dp_total: { ok: totalResp.ok, status: totalResp.status, cache: totalResp.cache },
          },
        });

        return;
      }

      const dash = await fetchJsonCached({
        baseURL: config.dpBaseUrl,
        path: '/api/dp/v1/dashboard/orders',
        params: {},
        requestId: req.id,
        ttlMs: 5_000,
        fetcher: ({ requestId }) => dp.getDashboardOrders({ requestId }),
      });

      const payload = dash.data || {};
      const delivered =
        get(payload, 'delivered', null) ??
        get(payload, 'DELIVERED', null) ??
        get(payload, 'data.delivered', null) ??
        get(payload, 'data.DELIVERED', null) ??
        get(payload, 'counts.delivered', null) ??
        get(payload, 'counts.DELIVERED', null);

      const total =
        get(payload, 'total', null) ??
        get(payload, 'TOTAL', null) ??
        get(payload, 'data.total', null) ??
        get(payload, 'data.TOTAL', null) ??
        get(payload, 'counts.total', null) ??
        get(payload, 'counts.TOTAL', null);

      const deliveredNum = Number(delivered) || 0;
      const totalNum = Number(total) || 0;

      res.json({
        delivery_success_rate: {
          delivered: deliveredNum,
          total: totalNum,
          percentage: safeDiv(deliveredNum, totalNum) * 100,
        },
        sources: {
          dp: { ok: dash.ok, status: dash.status, cache: dash.cache },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async criticalAlerts(req, res, next) {
    try {
      const alerts = await fetchJsonCached({
        baseURL: config.dpBaseUrl,
        path: '/api/dp/v1/alerts',
        params: {},
        requestId: req.id,
        ttlMs: 5_000,
        fetcher: ({ requestId }) => dp.getAlerts({ requestId }),
      });

      const list = asArray(alerts.data);
      const critical = list.filter((a) => {
        const sev = String(a?.severity ?? a?.level ?? '').toLowerCase();
        return sev === 'high' || sev === 'critical';
      });

      res.json({
        critical_alerts: {
          count: alerts.ok ? critical.length : 0,
          alerts: critical.map((a) => ({
            alert_id: a?.alert_id ?? a?.id,
            severity: a?.severity ?? a?.level,
            message: a?.message ?? a?.title,
          })),
        },
        sources: {
          dp: { ok: alerts.ok, status: alerts.status, cache: alerts.cache },
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { operationsController };
