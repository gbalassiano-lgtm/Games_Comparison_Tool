const assert = require('assert');
const {
  loadPriorityListSync,
  competitionPopularityRank,
  reportRowPopularityRank,
} = require('../lib/football-popularity');

loadPriorityListSync();

assert.strictEqual(competitionPopularityRank('UEFA Champions League', 'Europe'), 1);
assert.strictEqual(competitionPopularityRank('Champions League', 'EUROPE:'), 1);
assert.strictEqual(competitionPopularityRank('LaLiga', 'Spain'), 2);
assert.strictEqual(competitionPopularityRank('Premier League', 'England'), 3);
assert.strictEqual(competitionPopularityRank('Premier League', 'Egypt'), 37);
assert.strictEqual(competitionPopularityRank('Serie A', 'Italy'), 4);
assert.strictEqual(competitionPopularityRank('Serie A', 'Brazil'), 8);
assert.strictEqual(competitionPopularityRank('Brasileirão Série A', 'Brazil'), 8);
assert.strictEqual(competitionPopularityRank('Random Cup', 'Brazil'), Number.POSITIVE_INFINITY);
assert.strictEqual(competitionPopularityRank('Primera Division', 'Guatemala'), Number.POSITIVE_INFINITY);
assert.strictEqual(competitionPopularityRank('Primera Division', 'Spain'), 2);
assert.strictEqual(competitionPopularityRank('LaLiga', ''), 2);
assert.strictEqual(competitionPopularityRank('Premier League', ''), Number.POSITIVE_INFINITY);
assert.strictEqual(
  competitionPopularityRank('Champions League', 'Europe', 'basketball'),
  Number.POSITIVE_INFINITY
);

assert.ok(
  reportRowPopularityRank({
    sport: 'football',
    country: 'Europe',
    competitionFlash: 'Champions League - Qualification',
  }) < reportRowPopularityRank({
    sport: 'football',
    country: 'Brazil',
    competition: 'Brasileirão - Série B',
  })
);

assert.ok(
  reportRowPopularityRank({
    sport: 'latam_football',
    country: 'Brazil',
    competition: 'Copa do Brasil',
  }) < 20
);

console.log('test-football-popularity: ok');
