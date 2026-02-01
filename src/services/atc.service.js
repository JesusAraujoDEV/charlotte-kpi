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

module.exports = {
  getClosedClients,
  getServiceRequests,
  getTables,
  getActiveClients,
};
