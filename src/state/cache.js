const { config } = require('../config');
const { TtlCache } = require('../lib/cache');

const cache = new TtlCache({ defaultTtlMs: config.cacheTtlMs });

module.exports = { cache };
