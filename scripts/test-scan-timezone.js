const assert = require('assert');
const {
  shouldCarryPreviousDayGame,
  isLateEveningTime,
  tomorrowIsoInTimezone,
  addDaysIso,
  scanTimezoneForSport,
  DEFAULT_SCAN_TIMEZONE,
  LATAM_SCAN_TIMEZONE,
  ISRAEL_SCAN_TIMEZONE,
} = require('../lib/scan-timezone');

assert.strictEqual(isLateEveningTime('21:59'), false);
assert.strictEqual(isLateEveningTime('22:00'), true);
assert.strictEqual(isLateEveningTime('22:15'), true);

const targetDate = '2026-06-27';
const previousDate = addDaysIso(targetDate, -1);
assert.strictEqual(previousDate, '2026-06-26');

assert.strictEqual(
  shouldCarryPreviousDayGame(previousDate, targetDate, '22:00'),
  true
);
assert.strictEqual(
  shouldCarryPreviousDayGame(previousDate, targetDate, '19:00'),
  false
);
assert.strictEqual(
  shouldCarryPreviousDayGame(targetDate, targetDate, '22:00'),
  false
);

const { gameBelongsToScanTarget, isStaleFinishedGameStatus, isUpcomingKickoff, shouldDropStaleFinishedGame } = require('../lib/scan-timezone');
assert.strictEqual(gameBelongsToScanTarget('2026-06-28', '2026-06-28'), true);
assert.strictEqual(gameBelongsToScanTarget('2026-06-27', '2026-06-28'), false);
assert.strictEqual(isStaleFinishedGameStatus('live'), true);
assert.strictEqual(isStaleFinishedGameStatus('scheduled'), false);
assert.strictEqual(
  isUpcomingKickoff('2026-07-16', '18:00', {
    now: new Date('2026-07-16T12:00:00-03:00'),
    timezone: 'America/Sao_Paulo',
  }),
  true
);
assert.strictEqual(
  shouldDropStaleFinishedGame('ended', '2026-07-16', '18:00', {
    now: new Date('2026-07-16T12:00:00-03:00'),
    timezone: 'America/Sao_Paulo',
  }),
  false
);

const tomorrow = tomorrowIsoInTimezone('America/Sao_Paulo');
assert.match(tomorrow, /^\d{4}-\d{2}-\d{2}$/);

assert.strictEqual(scanTimezoneForSport('football'), DEFAULT_SCAN_TIMEZONE);
assert.strictEqual(scanTimezoneForSport('basketball'), DEFAULT_SCAN_TIMEZONE);
assert.strictEqual(scanTimezoneForSport('usa_all'), DEFAULT_SCAN_TIMEZONE);
assert.strictEqual(scanTimezoneForSport('basketball_usa'), DEFAULT_SCAN_TIMEZONE);
assert.strictEqual(scanTimezoneForSport('latam_all'), LATAM_SCAN_TIMEZONE);
assert.strictEqual(scanTimezoneForSport('latam_football'), LATAM_SCAN_TIMEZONE);
assert.strictEqual(scanTimezoneForSport('israel_all'), ISRAEL_SCAN_TIMEZONE);
assert.strictEqual(scanTimezoneForSport('israel_football'), ISRAEL_SCAN_TIMEZONE);

console.log('test-scan-timezone: ok');
