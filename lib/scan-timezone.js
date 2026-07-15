const DEFAULT_SCAN_TIMEZONE = 'America/Sao_Paulo';
const LATAM_SCAN_TIMEZONE = 'America/Argentina/Buenos_Aires';
const ISRAEL_SCAN_TIMEZONE = 'Asia/Jerusalem';
// Prefer resolveScanTimezone() at call-time — module-load SCAN_TIMEZONE freezes the
// first env value and forced compare.js reloads just to pick LATAM/Israel TZ.
const SCAN_TIMEZONE = process.env.SCAN_TIMEZONE || DEFAULT_SCAN_TIMEZONE;

function resolveScanTimezone() {
  return process.env.SCAN_TIMEZONE || DEFAULT_SCAN_TIMEZONE;
}

function getDateFormatter(timezone = resolveScanTimezone()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

const DATE_FORMATTER = getDateFormatter(SCAN_TIMEZONE);

function parseIsoDate(isoDate) {
  const [year, month, day] = String(isoDate).split('-').map(Number);
  return { year, month, day };
}

function formatIsoDate({ year, month, day }) {
  return [
    year,
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');
}

function addDaysIso(isoDate, deltaDays) {
  const { year, month, day } = parseIsoDate(isoDate);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return formatIsoDate({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
}

function daysBetweenIso(fromIso, toIso) {
  const from = parseIsoDate(fromIso);
  const to = parseIsoDate(toIso);
  const fromMs = Date.UTC(from.year, from.month - 1, from.day);
  const toMs = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((toMs - fromMs) / 86400000);
}

function tomorrowIsoInTimezone(timezone = resolveScanTimezone()) {
  const now = new Date();
  const todayKey = getDateFormatter(timezone).format(now);
  return addDaysIso(todayKey, 1);
}

function formatDateKeyInTimezone(startTime, timezone = resolveScanTimezone()) {
  if (!startTime) return null;
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return null;
  return getDateFormatter(timezone).format(date);
}

function parseMinutes(time) {
  if (!time) return null;
  const match = String(time).match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function crossMidnightSpanMinutes(lateMinutes, earlyMinutes) {
  return (1440 - lateMinutes) + earlyMinutes;
}

function isTimezoneBoundaryPair(t1, t2) {
  const m1 = parseMinutes(t1);
  const m2 = parseMinutes(t2);
  if (m1 === null || m2 === null) return false;

  const isEarly = (minutes) => minutes >= 0 && minutes <= 6 * 60;
  const isLate = (minutes) => minutes >= 17 * 60 && minutes < 24 * 60;

  let lateMinutes;
  let earlyMinutes;
  if (isLate(m1) && isEarly(m2)) {
    lateMinutes = m1;
    earlyMinutes = m2;
  } else if (isLate(m2) && isEarly(m1)) {
    lateMinutes = m2;
    earlyMinutes = m1;
  } else {
    return false;
  }

  const span = crossMidnightSpanMinutes(lateMinutes, earlyMinutes);
  return span >= 300 && span <= 450;
}

function timeDiffMinutes(t1, t2) {
  const m1 = parseMinutes(t1);
  const m2 = parseMinutes(t2);
  if (m1 === null || m2 === null) return null;
  if (isTimezoneBoundaryPair(t1, t2)) return 0;
  return Math.abs(m1 - m2);
}

function isLateEveningTime(time) {
  const minutes = parseMinutes(time);
  // Only carry games late enough to plausibly spill into the next scan day.
  return minutes !== null && minutes >= 22 * 60;
}

function shouldCarryPreviousDayGame(gameDateKey, targetDate, time) {
  const previousDate = addDaysIso(targetDate, -1);
  return gameDateKey === previousDate && isLateEveningTime(time);
}

function resolveScanTargetDate(rawDate, timezone = resolveScanTimezone()) {
  const value = String(
    rawDate || process.env.TARGET_DATE || process.env.SCAN_DATE || tomorrowIsoInTimezone(timezone)
  ).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid target date "${value}". Expected YYYY-MM-DD.`);
  }
  return value;
}

function normalizeGameStatusKey(status = '') {
  const s = String(status || 'scheduled')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim() || 'scheduled';

  if ([
    'scheduled', 'programacao', 'programacao ao vivo', 'programmed',
    'agendado', 'agenda', 'fixture', 'sched',
  ].includes(s)) {
    return 'scheduled';
  }

  return s;
}

function isStaleFinishedGameStatus(status = '') {
  const s = normalizeGameStatusKey(status);
  if (s === 'scheduled') return false;
  if (/^set\s*\d/.test(s)) return true;
  return [
    'ended', 'live', 'finished', 'ft', 'halftime', 'half time',
    'full time', 'final', 'cancelled', 'canceled', 'postponed',
    'abandoned', 'interrupted', 'walkover', 'retired',
  ].includes(s);
}

function gameBelongsToScanTarget(gameDateKey, targetDate) {
  if (!targetDate) return true;
  if (!gameDateKey) return false;
  return gameDateKey === targetDate;
}

function todayIsoInTimezone(timezone = resolveScanTimezone()) {
  return getDateFormatter(timezone).format(new Date());
}

function scanTimezoneForSport(sportKey = '') {
  const key = String(sportKey || '');
  if (key === 'israel_all' || key.startsWith('israel_')) return ISRAEL_SCAN_TIMEZONE;
  if (key === 'latam_all' || key.startsWith('latam_')) return LATAM_SCAN_TIMEZONE;
  if (key === 'usa_all' || key.endsWith('_usa')) return DEFAULT_SCAN_TIMEZONE;
  return DEFAULT_SCAN_TIMEZONE;
}

function timeZoneOffsetMs(utcDate, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(utcDate);
  const values = {};
  for (const part of parts) {
    if (part.type !== 'literal') values[part.type] = part.value;
  }
  const hour = values.hour === '24' ? '0' : values.hour;
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(hour),
    Number(values.minute),
    Number(values.second)
  );
  return asUtc - utcDate.getTime();
}

function localDateTimeInZoneToUtc(dateKey, time, timeZone) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  let offset = timeZoneOffsetMs(new Date(utcGuess), timeZone);
  let utcMs = utcGuess - offset;
  offset = timeZoneOffsetMs(new Date(utcMs), timeZone);
  return new Date(utcGuess - offset);
}

function formatLocalDateTimeFromUtc(utcDate, timeZone) {
  const dateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(utcDate);

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(utcDate);

  const hour = parts.find(part => part.type === 'hour')?.value || '00';
  const minute = parts.find(part => part.type === 'minute')?.value || '00';
  const normalizedHour = hour === '24' ? '00' : hour;

  return {
    dateKey,
    time: `${normalizedHour.padStart(2, '0')}:${minute}`,
  };
}

module.exports = {
  DEFAULT_SCAN_TIMEZONE,
  LATAM_SCAN_TIMEZONE,
  ISRAEL_SCAN_TIMEZONE,
  SCAN_TIMEZONE,
  resolveScanTimezone,
  scanTimezoneForSport,
  DATE_FORMATTER,
  addDaysIso,
  daysBetweenIso,
  tomorrowIsoInTimezone,
  todayIsoInTimezone,
  formatDateKeyInTimezone,
  parseMinutes,
  isLateEveningTime,
  isTimezoneBoundaryPair,
  timeDiffMinutes,
  shouldCarryPreviousDayGame,
  resolveScanTargetDate,
  normalizeGameStatusKey,
  isStaleFinishedGameStatus,
  gameBelongsToScanTarget,
  localDateTimeInZoneToUtc,
  formatLocalDateTimeFromUtc,
};
