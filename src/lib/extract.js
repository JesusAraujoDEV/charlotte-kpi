function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.items)) return value.items;
  if (Array.isArray(value.results)) return value.results;
  return [];
}

function get(value, path, fallback) {
  try {
    return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), value) ?? fallback;
  } catch {
    return fallback;
  }
}

function pickFirstNumber(obj, keys) {
  for (const key of keys) {
    const value = get(obj, key, undefined);
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

module.exports = { asArray, get, pickFirstNumber };
