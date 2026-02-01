const axios = require('axios');

const { config } = require('../config');

function createHttpClient({ baseURL }) {
  return axios.create({
    baseURL,
    timeout: config.httpTimeoutMs,
    headers: {
      accept: 'application/json',
    },
    validateStatus: () => true,
  });
}

function buildCacheKey({ baseURL, path, params }) {
  const normalizedBase = String(baseURL || '').replace(/\/+$/, '');
  const normalizedPath = String(path || '').startsWith('/') ? path : `/${path}`;
  const sortedParams = params
    ? Object.keys(params)
        .sort()
        .reduce((acc, key) => {
          const value = params[key];
          if (value === undefined || value === null || value === '') return acc;
          acc[key] = value;
          return acc;
        }, {})
    : {};

  return `${normalizedBase}${normalizedPath}?${JSON.stringify(sortedParams)}`;
}

async function httpGetJson({ client, path, params, requestId }) {
  const response = await client.get(path, {
    params,
    headers: requestId ? { 'x-request-id': requestId } : undefined,
  });

  const contentType = String(response.headers?.['content-type'] || '');
  const data = response.data;

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    contentType,
    data,
  };
}

module.exports = { createHttpClient, httpGetJson, buildCacheKey };
