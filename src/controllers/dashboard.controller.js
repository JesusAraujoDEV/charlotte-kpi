const { config } = require('../config');
const dp = require('../services/dp.service');
const atc = require('../services/atc.service');
const cocina = require('../services/cocina.service');
const { fetchJsonCached } = require('../lib/fetchWithCache');
const { getDayRangeIso } = require('../lib/dates');
const { asArray } = require('../lib/extract');
const { toNumber, safeDiv } = require('../lib/numbers');

function sumAmounts(list) {
  return asArray(list).reduce((acc, x) => {
    const amount = toNumber(
      x?.monto_total ??
        x?.total_amount ??
        x?.totalAmount ??
        x?.total ??
        x?.amount
    );
    return acc + amount;
  }, 0);
}

function kitchenLoadFromCount(count) {
  if (count >= 30) return 'CRITICAL';
  if (count >= 15) return 'HIGH';
  if (count >= 5) return 'MEDIUM';
  return 'LOW';
}

function addWarning(warnings, moduleName, resp) {
  if (!resp || resp.ok) return;
  warnings.push({
    module: moduleName,
    status: resp.status,
    message: resp?.error?.message || 'Upstream returned non-2xx response',
  });
}

async function settle(moduleName, promise, warnings) {
  try {
    const value = await promise;
    addWarning(warnings, moduleName, value);
    return value;
  } catch (err) {
    warnings.push({
      module: moduleName,
      status: 0,
      message: err?.message || 'Upstream request failed',
    });
    return { ok: false, status: 0, data: null, error: { message: err?.message, code: err?.code } };
  }
}

const dashboardController = {
  async overview(req, res, next) {
    try {
      const date = req.query.date;
      const { startIso, endIso } = getDayRangeIso({ timezone: config.timezone, date });

      const warnings = [];

      const [dpDelivered, atcClosed, queuePending, dpActive, atcActiveClients, lowStock, dpAlerts] = await Promise.all([
        settle(
          'dp_orders_delivered',
          fetchJsonCached({
            baseURL: config.dpBaseUrl,
            path: '/api/dp/v1/orders',
            params: { status: 'DELIVERED', date: date || 'today' },
            requestId: req.id,
            ttlMs: 5_000,
            fetcher: ({ requestId }) => dp.getOrders({ status: 'DELIVERED', date: date || 'today', requestId }),
          }),
          warnings
        ),
        settle(
          'atc_clients_closed',
          fetchJsonCached({
            baseURL: config.atcBaseUrl,
            path: '/api/v1/atencion-cliente/clients',
            params: { status: 'CLOSED', date_from: startIso, date_to: endIso },
            requestId: req.id,
            ttlMs: 5_000,
            fetcher: ({ requestId }) => atc.getClosedClients({ dateFrom: startIso, dateTo: endIso, requestId }),
          }),
          warnings
        ),
        settle(
          'cocina_queue_pending',
          fetchJsonCached({
            baseURL: config.cocinaBaseUrl,
            path: '/kds/queue',
            params: { status: 'PENDING' },
            requestId: req.id,
            ttlMs: 5_000,
            fetcher: ({ requestId }) => cocina.getKdsQueue({ status: 'PENDING', requestId }),
          }),
          warnings
        ),
        settle(
          'dp_orders_active',
          fetchJsonCached({
            baseURL: config.dpBaseUrl,
            path: '/api/dp/v1/orders/active',
            params: {},
            requestId: req.id,
            ttlMs: 5_000,
            fetcher: ({ requestId }) => dp.getActiveOrders({ requestId }),
          }),
          warnings
        ),
        settle(
          'atc_clients_active',
          fetchJsonCached({
            baseURL: config.atcBaseUrl,
            path: '/api/v1/atencion-cliente/clients/active',
            params: {},
            requestId: req.id,
            ttlMs: 5_000,
            fetcher: ({ requestId }) => atc.getActiveClients({ requestId }),
          }),
          warnings
        ),
        settle(
          'cocina_low_stock',
          fetchJsonCached({
            baseURL: config.cocinaBaseUrl,
            path: '/inventory/items',
            params: { stockStatus: 'LOW' },
            requestId: req.id,
            ttlMs: 5_000,
            fetcher: ({ requestId }) => cocina.getInventoryLow({ requestId }),
          }),
          warnings
        ),
        settle(
          'dp_alerts',
          fetchJsonCached({
            baseURL: config.dpBaseUrl,
            path: '/api/dp/v1/alerts',
            params: {},
            requestId: req.id,
            ttlMs: 5_000,
            fetcher: ({ requestId }) => dp.getAlerts({ requestId }),
          }),
          warnings
        ),
      ]);

      const dpOrders = asArray(dpDelivered.data);
      const atcClients = asArray(atcClosed.data);

      const deliveryRevenue = dpDelivered.ok ? sumAmounts(dpOrders) : 0;
      const dineInRevenue = atcClosed.ok ? sumAmounts(atcClients) : 0;
      const totalRevenue = deliveryRevenue + dineInRevenue;
      const totalOrders = (dpDelivered.ok ? dpOrders.length : 0) + (atcClosed.ok ? atcClients.length : 0);

      const pendingCount = queuePending.ok ? asArray(queuePending.data).length : 0;
      const kitchenLoad = kitchenLoadFromCount(pendingCount);

      const activeDeliveryOrders = dpActive.ok ? asArray(dpActive.data).length : 0;

      const activeClients = asArray(atcActiveClients.data);
      const ghostWarning = atcActiveClients.ok ? activeClients.filter((c) => c?.isGhostCandidate === true).length : 0;

      const lowItems = asArray(lowStock.data);
      const lowStockNames = lowStock.ok ? lowItems.map((x) => x?.name).filter(Boolean).slice(0, 25) : [];

      const alertsList = asArray(dpAlerts.data);
      const deliveryDelays = dpAlerts.ok
        ? alertsList.filter((a) => {
            const sev = String(a?.severity ?? a?.level ?? '').toLowerCase();
            return sev === 'high' || sev === 'critical';
          }).length
        : 0;

      res.json({
        date_range: { start: startIso, end: endIso },
        warnings,
        financial_summary: {
          daily_revenue: {
            total: totalRevenue,
            delivery: deliveryRevenue,
            dine_in: dineInRevenue,
          },
          average_ticket: safeDiv(totalRevenue, totalOrders),
        },
        operational_health: {
          kitchen_load: kitchenLoad,
          kitchen_queue_pending: pendingCount,
          active_delivery_orders: activeDeliveryOrders,
          ghost_clients_warning: ghostWarning,
        },
        critical_alerts: {
          low_stock_items: lowStockNames,
          delivery_delays: deliveryDelays,
        },
        sources: {
          dp_orders_delivered: { ok: dpDelivered.ok, status: dpDelivered.status, cache: dpDelivered.cache },
          atc_clients_closed: { ok: atcClosed.ok, status: atcClosed.status, cache: atcClosed.cache },
          cocina_queue_pending: { ok: queuePending.ok, status: queuePending.status, cache: queuePending.cache },
          dp_orders_active: { ok: dpActive.ok, status: dpActive.status, cache: dpActive.cache },
          atc_clients_active: { ok: atcActiveClients.ok, status: atcActiveClients.status, cache: atcActiveClients.cache },
          cocina_low_stock: { ok: lowStock.ok, status: lowStock.status, cache: lowStock.cache },
          dp_alerts: { ok: dpAlerts.ok, status: dpAlerts.status, cache: dpAlerts.cache },
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { dashboardController };
