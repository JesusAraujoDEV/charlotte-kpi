const { config } = require('../config');
const { createHttpClient, httpGetJson } = require('../lib/http');

const atcClient = createHttpClient({ baseURL: config.atcBaseUrl });

async function getClosedClients({ dateFrom, dateTo, requestId }) {
  return httpGetJson({
    client: atcClient,
    path: '/api/v1/atencion-cliente/clients',
    params: {
      status: 'CLOSED',
      date_from: dateFrom,
      date_to: dateTo,
    },
    requestId,
  });
}

async function getServiceRequests({ requestId }) {
  return httpGetJson({
    client: atcClient,
    path: '/api/v1/atencion-cliente/service-requests',
    params: {},
    requestId,
  });
}

async function getTables({ status, requestId }) {
  return httpGetJson({
    client: atcClient,
    path: '/api/v1/atencion-cliente/tables',
    params: status ? { status } : {},
    requestId,
  });
}

async function getActiveClients({ requestId }) {
  return httpGetJson({
    client: atcClient,
    path: '/api/v1/atencion-cliente/clients/active',
    params: {},
    requestId,
  });
}

async function getRatingsSummary({ waiterId, from, to, requestId }) {
  const params = {};
  if (waiterId) params.waiter_id = waiterId;
  if (from) params.from = from;
  if (to) params.to = to;

  return httpGetJson({
    client: atcClient,
    path: '/api/v1/atencion-cliente/ratings/summary',
    params,
    requestId,
  });
}

async function getRatingsByWaiter({ granularity, page, pageSize, from, to, requestId }) {
  const params = {};
  if (granularity) params.granularity = granularity;
  if (page) params.page = page;
  if (pageSize) params.page_size = pageSize;
  if (from) params.from = from;
  if (to) params.to = to;

  return httpGetJson({
    client: atcClient,
    path: '/api/v1/atencion-cliente/ratings/by-waiter',
    params,
    requestId,
  });
}

module.exports = {
  getClosedClients,
  getServiceRequests,
  getTables,
  getActiveClients,
  getRatingsSummary,
  getRatingsByWaiter,
};
