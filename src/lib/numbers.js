function toNumber(value) {
  if (value == null) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = String(value).replace(/[^0-9.,-]/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeDiv(numerator, denominator) {
  const den = toNumber(denominator);
  if (!den) return 0;
  return toNumber(numerator) / den;
}

module.exports = { toNumber, safeDiv };
