const { config } = require('../config');
const { DateTime } = require('luxon');
const dp = require('../services/dp.service');
const atc = require('../services/atc.service');
const cocina = require('../services/cocina.service');
const { fetchJsonCached } = require('../lib/fetchWithCache');
const { getDayRangeIso } = require('../lib/dates');
const { asArray, get } = require('../lib/extract');
const { toNumber, safeDiv } = require('../lib/numbers');

function sumOrderAmounts(orders) {
  return asArray(orders).reduce((acc, o) => {
    const amount = toNumber(
      o?.monto_total ??
        o?.total_amount ??
        o?.totalAmount ??
        o?.total ??
        o?.amount
    );
    return acc + amount;
  }, 0);
}

function sumClientAmounts(clients) {
  return asArray(clients).reduce((acc, c) => {
    const amount = toNumber(
      c?.total_amount ??
        c?.totalAmount ??
        c?.total ??
        c?.amount
    );
    return acc + amount;
  }, 0);
}

function estimateKdsTaskValue(task) {
  const direct = toNumber(task?.total_amount ?? task?.totalAmount ?? task?.total ?? task?.amount);
  if (direct) return direct;

  const items = task?.items || task?.products || task?.orderItems;
  if (!Array.isArray(items)) return 0;

  return items.reduce((acc, it) => {
    const price = toNumber(it?.price ?? it?.unitPrice ?? it?.unit_price);
    const qty = toNumber(it?.quantity ?? it?.qty ?? 1) || 1;
    return acc + price * qty;
  }, 0);
}

function mergeSources(results) {
  const list = results.filter(Boolean);
  if (!list.length) return { ok: true, status: 200, cache: 'MISS' };

  const ok = list.every((x) => x.ok);
  const status = ok ? (list.find((x) => x?.status)?.status ?? 200) : (list.find((x) => !x.ok)?.status ?? 0);
  const cacheValues = list.map((x) => x?.cache).filter(Boolean);
  const cache = cacheValues.length
    ? cacheValues.every((c) => c === cacheValues[0])
      ? cacheValues[0]
      : 'MIXED'
    : undefined;

  return { ok, status, cache };
}

const financialController = {
  async dailyRevenue(req, res, next) {
    try {
      const date = req.query.date; // optional ISO date (YYYY-MM-DD) or 'today'
      const { startIso, endIso } = getDayRangeIso({ timezone: config.timezone, date });

      console.log(`ejecutando... GET Del modulo de DP ${config.dpBaseUrl}/api/dp/v1/orders?status=DELIVERED&date=${date || 'today'}`);
      console.log(`ejecutando... GET Del modulo de ATC ${config.atcBaseUrl}/api/v1/atencion-cliente/clients?status=CLOSED&date_from=${startIso}&date_to=${endIso}`);

      const [dpDelivered, atcClosed] = await Promise.all([
        fetchJsonCached({
          baseURL: config.dpBaseUrl,
          path: '/api/dp/v1/orders',
          params: { status: 'DELIVERED', date: date || 'today' },
          requestId: req.id,
          ttlMs: 60_000,
          fetcher: ({ requestId }) => dp.getOrders({ status: 'DELIVERED', date: date || 'today', requestId }),
        }),
        fetchJsonCached({
          baseURL: config.atcBaseUrl,
          path: '/api/v1/atencion-cliente/clients',
          params: { status: 'CLOSED', date_from: startIso, date_to: endIso },
          requestId: req.id,
          ttlMs: 60_000,
          fetcher: ({ requestId }) => atc.getClosedClients({ dateFrom: startIso, dateTo: endIso, requestId }),
        }),
      ]);

      const dpOrders = asArray(dpDelivered.data);
      const atcClients = asArray(atcClosed.data);

      const delivery = dpDelivered.ok ? sumOrderAmounts(dpOrders) : 0;
      const dineIn = atcClosed.ok ? sumClientAmounts(atcClients) : 0;

      res.json({
        date_range: { start: startIso, end: endIso },
        daily_revenue: {
          total: delivery + dineIn,
          delivery,
          dine_in: dineIn,
        },
        sources: {
          dp: { ok: dpDelivered.ok, status: dpDelivered.status, cache: dpDelivered.cache },
          atc: { ok: atcClosed.ok, status: atcClosed.status, cache: atcClosed.cache },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async aov(req, res, next) {
    try {
      const date = req.query.date;
      const { startIso, endIso } = getDayRangeIso({ timezone: config.timezone, date });

      console.log(`ejecutando... GET Del modulo de DP ${config.dpBaseUrl}/api/dp/v1/orders?status=DELIVERED&date=${date || 'today'}`);
      console.log(`ejecutando... GET Del modulo de ATC ${config.atcBaseUrl}/api/v1/atencion-cliente/clients?status=CLOSED&date_from=${startIso}&date_to=${endIso}`);

      const [dpDelivered, atcClosed] = await Promise.all([
        fetchJsonCached({
          baseURL: config.dpBaseUrl,
          path: '/api/dp/v1/orders',
          params: { status: 'DELIVERED', date: date || 'today' },
          requestId: req.id,
          ttlMs: 60_000,
          fetcher: ({ requestId }) => dp.getOrders({ status: 'DELIVERED', date: date || 'today', requestId }),
        }),
        fetchJsonCached({
          baseURL: config.atcBaseUrl,
          path: '/api/v1/atencion-cliente/clients',
          params: { status: 'CLOSED', date_from: startIso, date_to: endIso },
          requestId: req.id,
          ttlMs: 60_000,
          fetcher: ({ requestId }) => atc.getClosedClients({ dateFrom: startIso, dateTo: endIso, requestId }),
        }),
      ]);

      const dpOrders = asArray(dpDelivered.data);
      const atcClients = asArray(atcClosed.data);

      const revenue = (dpDelivered.ok ? sumOrderAmounts(dpOrders) : 0) + (atcClosed.ok ? sumClientAmounts(atcClients) : 0);
      const count = (dpDelivered.ok ? dpOrders.length : 0) + (atcClosed.ok ? atcClients.length : 0);

      res.json({
        date_range: { start: startIso, end: endIso },
        average_ticket: {
          value: safeDiv(revenue, count),
          total_revenue: revenue,
          total_orders: count,
        },
        sources: {
          dp: { ok: dpDelivered.ok, status: dpDelivered.status, cache: dpDelivered.cache },
          atc: { ok: atcClosed.ok, status: atcClosed.status, cache: atcClosed.cache },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async lostRevenue(req, res, next) {
    try {
      const date = req.query.date;
      const { startIso } = getDayRangeIso({ timezone: config.timezone, date });

      console.log(`ejecutando... GET Del modulo de DP ${config.dpBaseUrl}/api/dp/v1/orders?status=CANCELLED&date=${date || 'today'}`);
      console.log(`ejecutando... GET Del modulo de cocina ${config.cocinaBaseUrl}/kds/history?startDate=${startIso}`);

      const [dpCancelled, cocinaRejected] = await Promise.all([
        fetchJsonCached({
          baseURL: config.dpBaseUrl,
          path: '/api/dp/v1/orders',
          params: { status: 'CANCELLED', date: date || 'today' },
          requestId: req.id,
          ttlMs: 60_000,
          fetcher: ({ requestId }) => dp.getOrders({ status: 'CANCELLED', date: date || 'today', requestId }),
        }),
        fetchJsonCached({
          baseURL: config.cocinaBaseUrl,
          path: '/kds/history',
          params: { status: 'REJECTED', startDate: startIso },
          requestId: req.id,
          ttlMs: 60_000,
          fetcher: ({ requestId }) => cocina.getKdsHistory({ status: 'REJECTED', startDate: startIso, requestId }),
        }),
      ]);

      const dpOrders = asArray(dpCancelled.data);
      const rejectedTasks = asArray(cocinaRejected.data);

      const deliveryCancelled = dpCancelled.ok ? sumOrderAmounts(dpOrders) : 0;
      const kitchenRejectedEstimated = cocinaRejected.ok
        ? rejectedTasks.reduce((acc, t) => acc + estimateKdsTaskValue(t), 0)
        : 0;

      res.json({
        day_start: startIso,
        lost_revenue: {
          total_estimated: deliveryCancelled + kitchenRejectedEstimated,
          delivery_cancelled: deliveryCancelled,
          kitchen_rejected_estimated: kitchenRejectedEstimated,
        },
        notes: {
          kitchen_estimation: 'If Cocina tasks do not include totals, value is estimated from items.* fields when available.',
        },
        sources: {
          dp: { ok: dpCancelled.ok, status: dpCancelled.status, cache: dpCancelled.cache },
          cocina: { ok: cocinaRejected.ok, status: cocinaRejected.status, cache: cocinaRejected.cache },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async revenueSeries(req, res, next) {
    try {
      const { from, to, groupBy } = req.query;
      const group = String(groupBy || '').toLowerCase();

      if (!from || !to || !groupBy) {
        res.status(400).json({ error: 'Missing required query params: from, to, groupBy' });
        return;
      }

      if (group !== 'day' && group !== 'month') {
        res.status(400).json({ error: 'Invalid groupBy. Use "day" or "month".' });
        return;
      }

      const start = DateTime.fromISO(from, { zone: config.timezone }).startOf('day');
      const end = DateTime.fromISO(to, { zone: config.timezone }).startOf('day');

      if (!start.isValid || !end.isValid) {
        res.status(400).json({ error: 'Invalid from/to. Use YYYY-MM-DD.' });
        return;
      }

      if (end < start) {
        res.status(400).json({ error: '`to` must be on/after `from`.' });
        return;
      }

      const days = [];
      for (let cursor = start; cursor <= end; cursor = cursor.plus({ days: 1 })) {
        days.push(cursor);
      }

      const dailyResults = await Promise.all(
        days.map(async (day) => {
          const dateStr = day.toISODate();
          const { startIso, endIso } = getDayRangeIso({ timezone: config.timezone, date: dateStr });

          console.log(`ejecutando... GET Del modulo de DP ${config.dpBaseUrl}/api/dp/v1/orders?status=DELIVERED&date=${dateStr}`);
          console.log(`ejecutando... GET Del modulo de ATC ${config.atcBaseUrl}/api/v1/atencion-cliente/clients?status=CLOSED&date_from=${startIso}&date_to=${endIso}`);

          const [dpDelivered, atcClosed] = await Promise.all([
            fetchJsonCached({
              baseURL: config.dpBaseUrl,
              path: '/api/dp/v1/orders',
              params: { status: 'DELIVERED', date: dateStr },
              requestId: req.id,
              ttlMs: 60_000,
              fetcher: ({ requestId }) => dp.getOrders({ status: 'DELIVERED', date: dateStr, requestId }),
            }),
            fetchJsonCached({
              baseURL: config.atcBaseUrl,
              path: '/api/v1/atencion-cliente/clients',
              params: { status: 'CLOSED', date_from: startIso, date_to: endIso },
              requestId: req.id,
              ttlMs: 60_000,
              fetcher: ({ requestId }) => atc.getClosedClients({ dateFrom: startIso, dateTo: endIso, requestId }),
            }),
          ]);

          const dpOrders = asArray(dpDelivered.data);
          const atcClients = asArray(atcClosed.data);

          const delivery = dpDelivered.ok ? sumOrderAmounts(dpOrders) : 0;
          const dineIn = atcClosed.ok ? sumClientAmounts(atcClients) : 0;
          const total = delivery + dineIn;

          return {
            label: dateStr,
            delivery,
            dine_in: dineIn,
            total,
            sources: { dp: dpDelivered, atc: atcClosed },
          };
        })
      );

      let series = dailyResults.map((r) => ({
        label: r.label,
        delivery: r.delivery,
        dine_in: r.dine_in,
        total: r.total,
      }));

      if (group === 'month') {
        const monthMap = new Map();
        dailyResults.forEach((r) => {
          const label = DateTime.fromISO(r.label).toFormat('yyyy-LL');
          const prev = monthMap.get(label) || { label, delivery: 0, dine_in: 0, total: 0 };
          monthMap.set(label, {
            label,
            delivery: prev.delivery + r.delivery,
            dine_in: prev.dine_in + r.dine_in,
            total: prev.total + r.total,
          });
        });

        series = Array.from(monthMap.values()).sort((a, b) => (a.label > b.label ? 1 : -1));
      }

      const totalPeriod = series.reduce((acc, s) => acc + s.total, 0);
      const best = series.reduce((acc, s) => (s.total > acc.total ? s : acc), { label: null, total: 0 });
      const avgDaily = series.length ? totalPeriod / series.length : 0;

      res.json({
        series,
        summary: {
          total_period: totalPeriod,
          best_day: best.label,
          avg_daily: avgDaily,
        },
        sources: {
          dp: mergeSources(dailyResults.map((r) => r.sources.dp)),
          atc: mergeSources(dailyResults.map((r) => r.sources.atc)),
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { financialController };
