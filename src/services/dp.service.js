const { config } = require('../config');
const { createHttpClient, httpGetJson } = require('../lib/http');

const dpClient = createHttpClient({ baseURL: config.dpBaseUrl });

async function getOrders({ status, date, requestId }) {
  const params = {};
  if (status) params.status = status;
  if (date) params.date = date;

  return httpGetJson({
    client: dpClient,
    path: '/api/dp/v1/orders',
    params,
    requestId,
  });
}

async function getDashboardOrders({ requestId }) {
  return httpGetJson({
    client: dpClient,
    path: '/api/dp/v1/dashboard/orders',
    params: {},
    requestId,
  });
}

async function getAlerts({ requestId }) {
  return httpGetJson({
    client: dpClient,
    path: '/api/dp/v1/alerts',
    params: {},
    requestId,
  });
}

async function getActiveOrders({ date, requestId }) {
  const params = {};
  if (date) params.date = date;

  return httpGetJson({
    client: dpClient,
    path: '/api/dp/v1/orders/active',
    params,
    requestId,
  });
}

module.exports = {
  getOrders,
  getDashboardOrders,
  getAlerts,
  getActiveOrders,
};
