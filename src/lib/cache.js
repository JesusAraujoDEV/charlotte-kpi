class TtlCache {
  constructor({ defaultTtlMs }) {
    this.defaultTtlMs = Number(defaultTtlMs || 15000);
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttlMs) {
    const ttl = Number(ttlMs || this.defaultTtlMs);
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  delete(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

module.exports = { TtlCache };
