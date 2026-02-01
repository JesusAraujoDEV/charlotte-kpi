const { config } = require('../config');
const { createHttpClient, httpGetJson } = require('../lib/http');

const cocinaClient = createHttpClient({ baseURL: config.cocinaBaseUrl });

async function getKdsHistory({ status, startDate, requestId }) {
  return httpGetJson({
    client: cocinaClient,
    path: '/kds/history',
    params: {
      status,
      startDate,
    },
    requestId,
  });
}

async function getKdsQueue({ status, requestId }) {
  return httpGetJson({
    client: cocinaClient,
    path: '/kds/queue',
    params: status ? { status } : {},
    requestId,
  });
}

async function getActiveStaff({ requestId }) {
  return httpGetJson({
    client: cocinaClient,
    path: '/staff/active',
    params: {},
    requestId,
  });
}

async function getProducts({ activeOnly, requestId }) {
  const params = {};
  if (activeOnly === true) params.activeOnly = 'true';
  if (activeOnly === false) params.activeOnly = 'false';

  return httpGetJson({
    client: cocinaClient,
    path: '/products',
    params,
    requestId,
  });
}

async function getInventoryLow({ requestId }) {
  return httpGetJson({
    client: cocinaClient,
    path: '/inventory/items',
    params: { stockStatus: 'LOW' },
    requestId,
  });
}

async function getInventoryItemLogs({ id, requestId }) {
  return httpGetJson({
    client: cocinaClient,
    path: `/inventory/items/${encodeURIComponent(id)}/logs`,
    params: {},
    requestId,
  });
}

module.exports = {
  getKdsHistory,
  getKdsQueue,
  getActiveStaff,
  getProducts,
  getInventoryLow,
  getInventoryItemLogs,
};
