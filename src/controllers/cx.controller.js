const { config } = require('../config');
const atc = require('../services/atc.service');
const { fetchJsonCached } = require('../lib/fetchWithCache');
const { asArray } = require('../lib/extract');
const { durationMs } = require('../lib/dates');

function avg(values) {
  const arr = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

const cxController = {
  async serviceQuality(req, res, next) {
    try {
      const r = await fetchJsonCached({
        baseURL: config.atcBaseUrl,
        path: '/api/v1/atencion-cliente/service-requests',
        params: {},
        requestId: req.id,
        ttlMs: 5_000,
        fetcher: ({ requestId }) => atc.getServiceRequests({ requestId }),
      });

      const list = asArray(r.data);
      const waiter = list.filter((x) => String(x?.type ?? '').toUpperCase() === 'CALL_WAITER');

      const now = new Date().toISOString();
      const durations = waiter
        .map((x) => durationMs(x?.created_at ?? x?.createdAt, x?.attended_at ?? x?.attendedAt ?? now))
        .filter((v) => v != null);

      const pending = waiter.filter((x) => String(x?.status ?? '').toUpperCase() === 'PENDING').length;

      const avgMs = r.ok ? avg(durations) : 0;

      res.json({
        service_quality: {
          call_waiter_total: r.ok ? waiter.length : 0,
          pending_calls: r.ok ? pending : 0,
          avg_response_ms: avgMs,
          avg_response_minutes: avgMs / 60000,
        },
        sources: {
          atc: { ok: r.ok, status: r.status, cache: r.cache },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async roomOccupancy(req, res, next) {
    try {
      const [occupied, total] = await Promise.all([
        fetchJsonCached({
          baseURL: config.atcBaseUrl,
          path: '/api/v1/atencion-cliente/tables',
          params: { status: 'OCCUPIED' },
          requestId: req.id,
          ttlMs: 5_000,
          fetcher: ({ requestId }) => atc.getTables({ status: 'OCCUPIED', requestId }),
        }),
        fetchJsonCached({
          baseURL: config.atcBaseUrl,
          path: '/api/v1/atencion-cliente/tables',
          params: {},
          requestId: req.id,
          ttlMs: 5_000,
          fetcher: ({ requestId }) => atc.getTables({ status: undefined, requestId }),
        }),
      ]);

      const occ = asArray(occupied.data);
      const all = asArray(total.data);

      const occupiedCount = occupied.ok ? occ.length : 0;
      const totalCount = total.ok ? all.length : 0;

      res.json({
        room_occupancy: {
          occupied: occupiedCount,
          total: totalCount,
          percentage: totalCount ? (occupiedCount / totalCount) * 100 : 0,
        },
        sources: {
          atc_occupied: { ok: occupied.ok, status: occupied.status, cache: occupied.cache },
          atc_total: { ok: total.ok, status: total.status, cache: total.cache },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async ghostClients(req, res, next) {
    try {
      const r = await fetchJsonCached({
        baseURL: config.atcBaseUrl,
        path: '/api/v1/atencion-cliente/clients/active',
        params: {},
        requestId: req.id,
        ttlMs: 5_000,
        fetcher: ({ requestId }) => atc.getActiveClients({ requestId }),
      });

      const clients = asArray(r.data);
      const ghosts = clients.filter((c) => c?.isGhostCandidate === true);

      res.json({
        ghost_clients: {
          count: r.ok ? ghosts.length : 0,
          clients: ghosts.map((c) => ({
            id: c?.id ?? c?._id,
            table_id: c?.table_id ?? c?.tableId,
            since: c?.created_at ?? c?.createdAt,
          })),
        },
        sources: {
          atc: { ok: r.ok, status: r.status, cache: r.cache },
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { cxController };
