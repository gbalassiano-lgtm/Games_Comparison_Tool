const assert = require('assert');
const {
  filterFlashGamesForScanTarget,
  normalizeFlashGameForScanTarget,
  assessPageDateContent,
  buildFlashDateSelectionError,
} = require('../scrapers/flashscore-shared');
const { addDaysIso, todayIsoInTimezone } = require('../lib/scan-timezone');

const targetDate = '2026-07-08';
const today = '2026-06-26';

assert.deepStrictEqual(
  assessPageDateContent({ sampleCount: 0, dateKeys: [], uniqueDateKeys: [], today }, targetDate),
  { ok: true, reason: 'empty-schedule' }
);

assert.deepStrictEqual(
  assessPageDateContent({
    sampleCount: 5,
    dateKeys: [today, today, today],
    uniqueDateKeys: [today],
    today,
  }, targetDate),
  { ok: false, reason: 'starttimes-are-today' }
);

assert.deepStrictEqual(
  assessPageDateContent({
    sampleCount: 3,
    dateKeys: [targetDate, targetDate],
    uniqueDateKeys: [targetDate],
    today,
  }, targetDate),
  { ok: true, reason: 'starttimes-match-target' }
);

assert.deepStrictEqual(
  assessPageDateContent({
    sampleCount: 4,
    dateKeys: [],
    uniqueDateKeys: [],
    timeOnlyCount: 4,
    today,
  }, targetDate),
  { ok: null, reason: 'time-only-matches' }
);

const todayGameNoTimestamp = filterFlashGamesForScanTarget([
  {
    home: 'Atletico GO',
    away: 'Ponte Preta',
    time: '16:00',
    status: 'scheduled',
    competition: 'Serie B',
  },
], targetDate);
assert.strictEqual(
  todayGameNoTimestamp.length,
  0,
  'time-only games without page validation must not pass the date filter'
);

const validatedTimeOnly = filterFlashGamesForScanTarget([
  {
    home: 'Ponte Preta',
    away: 'Criciúma',
    time: '20:00',
    status: 'scheduled',
  },
], targetDate, { assignTimeOnlyDate: true });
assert.strictEqual(validatedTimeOnly.length, 1);
assert.strictEqual(validatedTimeOnly[0].dateKey, targetDate);

const futureGameTimeOnly = normalizeFlashGameForScanTarget(
  { home: 'Ponte Preta', away: 'Criciúma', time: '20:00', status: 'scheduled' },
  targetDate,
  { assignTimeOnlyDate: true }
);
assert.strictEqual(futureGameTimeOnly.dateKey, targetDate);

const todayWithStartTime = filterFlashGamesForScanTarget([
  {
    home: 'Atletico GO',
    away: 'Ponte Preta',
    time: '16:00',
    status: 'scheduled',
    startTime: `${Math.floor(new Date(`${today}T16:00:00`).getTime() / 1000)}`,
  },
], targetDate);
assert.strictEqual(todayWithStartTime.length, 0, 'games with today startTime must be filtered out');

const farFutureDate = addDaysIso(todayIsoInTimezone(), 10);
assert.strictEqual(
  buildFlashDateSelectionError(farFutureDate, '28/06 SU', 'test').includes('7 dias'),
  true,
  'far-future dates should mention Flashscore range'
);

console.log('test-flashscore-date-filter: ok');
