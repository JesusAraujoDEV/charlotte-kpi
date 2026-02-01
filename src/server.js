const { createApp } = require('./app');
const { config } = require('./config');

const app = createApp();

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[charlotte-kpi] listening on :${config.port} (tz=${config.timezone}, cacheTtlMs=${config.cacheTtlMs})`);
});
