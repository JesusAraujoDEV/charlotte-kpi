const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { kpiRouter } = require('./routes/kpi.routes');
const setupSwagger = require('./swagger/swagger');
const { requestOriginLogger } = require('./middleware/requestOriginLogger');

function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.use(requestOriginLogger);

  app.use((req, res, next) => {
    const reqId = req.header('x-request-id') || `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    req.id = reqId;
    res.setHeader('x-request-id', reqId);
    next();
  });

  app.use(morgan(':method :url :status :response-time ms - :res[content-length] rid=:req[x-request-id]'));

  app.get('/healthz', (req, res) => {
    res.json({ ok: true, service: 'charlotte-kpi', time: new Date().toISOString() });
  });

  setupSwagger(app);

  app.use('/api/kpi/v1', kpiRouter);

  // 404
  app.use((req, res) => {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Route not found',
      path: req.path,
    });
  });

  // Error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.statusCode || err.status || 500;
    res.status(status).json({
      error: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Unexpected error',
      request_id: req.id,
    });
  });

  return app;
}

module.exports = { createApp };
