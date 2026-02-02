function requestOriginLogger(req, res, next) {
  try {
    if (req.url.match(/\.(css|js|ico|png|jpg|jpeg|woff|woff2|svg|map)$/)) {
      next();
      return;
    }

    const origin = req.get('Origin') || req.get('Referer') || 'unknown';
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Ghost';
    const path = (req.originalUrl || req.url || '').replace(/^\/+/, '');

    // eslint-disable-next-line no-console
    console.log(`📡 [${req.method}] /${path}`);
    // eslint-disable-next-line no-console
    console.log(`   ↳ Desde: ${origin}`);
    // eslint-disable-next-line no-console
    console.log(`   ↳ IP: ${ip} | Agente: ${userAgent}`);
    // eslint-disable-next-line no-console
    console.log('------------------------------------------------');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Logger error', e?.message || e);
  }
  next();
}

module.exports = { requestOriginLogger };