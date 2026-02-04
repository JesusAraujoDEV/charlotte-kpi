const { DateTime } = require('luxon');

function getDayRangeIso({ timezone, date }) {
  const normalizedDate = typeof date === 'string' && date.toLowerCase() === 'today' ? undefined : date;

  const parsed = normalizedDate ? DateTime.fromISO(normalizedDate, { zone: timezone }) : null;
  const base = parsed && parsed.isValid
    ? parsed
    : DateTime.now().setZone(timezone);

  const start = base.startOf('day');
  const end = base.endOf('day');

  return {
    startIso: start.toUTC().toISO(),
    endIso: end.toUTC().toISO(),
    startLocalIso: start.toISO(),
    endLocalIso: end.toISO(),
  };
}

function getWeekStartIso({ timezone, date }) {
  const base = date
    ? DateTime.fromISO(date, { zone: timezone })
    : DateTime.now().setZone(timezone);

  const start = base.startOf('week');
  return {
    startIso: start.toUTC().toISO(),
    startLocalIso: start.toISO(),
  };
}

function durationMs(start, end) {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;
  const diff = endMs - startMs;
  return diff >= 0 ? diff : null;
}

module.exports = { getDayRangeIso, getWeekStartIso, durationMs };
