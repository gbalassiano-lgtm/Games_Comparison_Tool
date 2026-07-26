const assert = require('assert');
const {
  urlHasTargetDate,
  matchesFlashscoreDateOption,
  flashscoreDatePrefix,
} = require('../scrapers/flashscore-shared');
const { todayIsoInTimezone, tomorrowIsoInTimezone, addDaysIso } = require('../lib/scan-timezone');

assert.strictEqual(urlHasTargetDate('https://www.flashscore.com/football/?date=2026-07-06', '2026-07-06'), true);
assert.strictEqual(urlHasTargetDate('https://www.flashscore.com/football/', '2026-07-06'), false);
assert.strictEqual(urlHasTargetDate('https://www.flashscore.com/snooker/', '2026-07-06'), false);

assert.strictEqual(flashscoreDatePrefix('2026-07-06'), '06/07');
assert.strictEqual(matchesFlashscoreDateOption('06/07 Sunday', '2026-07-06'), true);
assert.strictEqual(matchesFlashscoreDateOption('05/07 Saturday', '2026-07-06'), false);
assert.strictEqual(matchesFlashscoreDateOption('28/07 Tu', '2026-07-28'), true);

// URL date param alone must not count as "selected" — picker label is the source of truth.
assert.strictEqual(
  matchesFlashscoreDateOption('28/06 Saturday', '2026-06-29'),
  false,
  'picker showing today must not match tomorrow target'
);

const today = todayIsoInTimezone();
const tomorrow = tomorrowIsoInTimezone();
assert.strictEqual(matchesFlashscoreDateOption('Today', today), true);
assert.strictEqual(matchesFlashscoreDateOption('Today', tomorrow), false);
assert.strictEqual(matchesFlashscoreDateOption('Tomorrow', tomorrow), true);
assert.strictEqual(
  matchesFlashscoreDateOption('', '2026-07-28', 'Tuesday, July 28, 2026'),
  true,
  'aria-label full date should match target'
);
assert.strictEqual(
  matchesFlashscoreDateOption('', addDaysIso(today, 2), 'Sunday, July 26, 2026'),
  false
);

console.log('test-flashscore-date-fallback: ok');
