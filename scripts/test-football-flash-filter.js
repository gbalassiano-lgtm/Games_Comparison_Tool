const assert = require('assert');
const {
  looksLikeIndividualParticipant,
  isNonFootballFlashMatch,
  filterFootballFlashMatches,
  assertFootballFlashScrapeQuality,
} = require('../lib/football-flash-filter');

assert.strictEqual(looksLikeIndividualParticipant('Pang J.'), true);
assert.strictEqual(looksLikeIndividualParticipant('Un-Nooh T.'), true);
assert.strictEqual(looksLikeIndividualParticipant('Real Madrid'), false);
assert.strictEqual(looksLikeIndividualParticipant('River Plate'), false);

const snookerMatch = {
  country: 'WORLD:',
  competition: 'Championship League - First stage',
  home: 'Pang J.',
  away: 'Zetao L.',
};
assert.strictEqual(isNonFootballFlashMatch(snookerMatch), true);

const footballMatch = {
  country: 'Brazil',
  competition: 'Serie A',
  home: 'Flamengo',
  away: 'Palmeiras',
};
assert.strictEqual(isNonFootballFlashMatch(footballMatch), false);

const filtered = filterFootballFlashMatches([
  snookerMatch,
  footballMatch,
  {
    country: 'International',
    competition: 'Club Friendly',
    home: 'Barcelona',
    away: 'Juventus',
  },
]);
assert.strictEqual(filtered.length, 2);

assert.throws(
  () => assertFootballFlashScrapeQuality(12, []),
  /none passed football validation/
);

assert.doesNotThrow(() => assertFootballFlashScrapeQuality(0, []));

console.log('test-football-flash-filter: ok');
