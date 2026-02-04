const { config } = require('../config');
const cocina = require('../services/cocina.service');
const { fetchJsonCached } = require('../lib/fetchWithCache');
const { asArray } = require('../lib/extract');
const { safeDiv } = require('../lib/numbers');

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
};

module.exports = { workforceController };
