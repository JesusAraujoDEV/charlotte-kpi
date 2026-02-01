const dotenv = require('dotenv');

dotenv.config();

function normalizeBaseUrl(value) {
  if (!value) return value;
  return String(value).trim().replace(/\s+/g, '').replace(/\/+$/, '/')
    .replace(/\/$/, '/');
}

function required(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const config = {
  port: Number(process.env.PORT || 8005),
  timezone: process.env.TIMEZONE || 'UTC',
  cacheTtlMs: Number(process.env.CACHE_TTL_MS || 15000),
  httpTimeoutMs: Number(process.env.HTTP_TIMEOUT_MS || 10000),

  dpBaseUrl: normalizeBaseUrl(required('DP_URL')),
  atcBaseUrl: normalizeBaseUrl(required('ATC_URL')),
  cocinaBaseUrl: normalizeBaseUrl(required('COCINA_URL')),
  seguridadBaseUrl: normalizeBaseUrl(process.env.SEGURIDAD_URL || ''),
};

module.exports = { config };
