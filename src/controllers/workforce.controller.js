const { config } = require('../config');
const cocina = require('../services/cocina.service');
const atc = require('../services/atc.service');
const { fetchJsonCached } = require('../lib/fetchWithCache');
const { asArray } = require('../lib/extract');
const { safeDiv } = require('../lib/numbers');
const { getDayRangeIso } = require('../lib/dates');

function countChefs(staff) {
  const list = asArray(staff);
  return list.filter((s) => String(s?.role ?? s?.position ?? '').toUpperCase() === 'CHEF').length;
}

const workforceController = {
  async ordersPerChef(req, res, next) {
    try {
      console.log(`ejecutando... GET Del modulo de cocina ${config.cocinaBaseUrl}/staff/active`);
      console.log(`ejecutando... GET Del modulo de cocina ${config.cocinaBaseUrl}/kds/queue?status=PENDING`);
      console.log(`ejecutando... GET Del modulo de cocina ${config.cocinaBaseUrl}/kds/queue?status=COOKING`);

      const [staff, pending, cooking] = await Promise.all([
        fetchJsonCached({
          baseURL: config.cocinaBaseUrl,
          path: '/staff/active',
          params: {},
          requestId: req.id,
          ttlMs: 5_000,
          fetcher: ({ requestId }) => cocina.getActiveStaff({ requestId }),
        }),
        fetchJsonCached({
          baseURL: config.cocinaBaseUrl,
          path: '/kds/queue',
          params: { status: 'PENDING' },
          requestId: req.id,
          ttlMs: 5_000,
          fetcher: ({ requestId }) => cocina.getKdsQueue({ status: 'PENDING', requestId }),
        }),
        // Best-effort: some implementations may use COOKING / IN_PROGRESS.
        fetchJsonCached({
          baseURL: config.cocinaBaseUrl,
          path: '/kds/queue',
          params: { status: 'COOKING' },
          requestId: req.id,
          ttlMs: 5_000,
          fetcher: ({ requestId }) => cocina.getKdsQueue({ status: 'COOKING', requestId }),
        }),
      ]);

      const chefs = staff.ok ? countChefs(staff.data) : 0;
      const pendingTasks = pending.ok ? asArray(pending.data).length : 0;
      const cookingTasks = cooking.ok ? asArray(cooking.data).length : 0;
      const tasks = pendingTasks + cookingTasks;

      res.json({
        orders_per_chef: {
          chefs,
          tasks,
          pending_tasks: pendingTasks,
          cooking_tasks: cookingTasks,
          ratio: safeDiv(tasks, chefs),
        },
        sources: {
          staff: { ok: staff.ok, status: staff.status, cache: staff.cache },
          pending: { ok: pending.ok, status: pending.status, cache: pending.cache },
          cooking: { ok: cooking.ok, status: cooking.status, cache: cooking.cache },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async waiterRanking(req, res, next) {
    try {
      const date = req.query.date;
      const from = req.query.from;
      const to = req.query.to;
      const pageSize = Math.min(100, Math.max(1, Number(req.query.page_size || 50)));
      const page = Math.max(1, Number(req.query.page || 1));

      const range = date ? getDayRangeIso({ timezone: config.timezone, date }) : null;
      const fromIso = range ? range.startIso : from;
      const toIso = range ? range.endIso : to;

      const qs = [
        'granularity=global',
        `page_size=${pageSize}`,
        `page=${page}`,
        fromIso ? `from=${encodeURIComponent(fromIso)}` : null,
        toIso ? `to=${encodeURIComponent(toIso)}` : null,
      ].filter(Boolean).join('&');

      console.log(
        `ejecutando... GET Del modulo de ATC ${config.atcBaseUrl}/api/v1/atencion-cliente/ratings/by-waiter?${qs}`
      );

      const resp = await fetchJsonCached({
        baseURL: config.atcBaseUrl,
        path: '/api/v1/atencion-cliente/ratings/by-waiter',
        params: {
          granularity: 'global',
          page_size: pageSize,
          page,
          ...(fromIso ? { from: fromIso } : {}),
          ...(toIso ? { to: toIso } : {}),
        },
        requestId: req.id,
        ttlMs: 5_000,
        fetcher: ({ requestId }) =>
          atc.getRatingsByWaiter({
            granularity: 'global',
            page,
            pageSize,
            from: fromIso,
            to: toIso,
            requestId,
          }),
      });

      const list = asArray(resp?.data?.data ?? resp?.data ?? []);
      const items = list
        .map((x) => ({
          waiter_id: x?.waiter?.id ?? x?.waiterId ?? x?.waiter_id,
          name: x?.waiter?.name,
          average: x?.stats?.average ?? 0,
          total_reviews: x?.stats?.count ?? 0,
        }))
        .sort((a, b) => b.average - a.average);

      res.json({
        date_range: range ? { start: range.startIso, end: range.endIso } : undefined,
        waiter_ranking: {
          page,
          page_size: pageSize,
          total_waiters: Number(resp?.data?.total_waiters ?? resp?.data?.total ?? list.length) || 0,
          items,
        },
        sources: {
          atc: { ok: resp.ok, status: resp.status, cache: resp.cache },
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { workforceController };
