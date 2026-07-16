const assert = require('assert');
const {
  isUpcomingKickoff,
  shouldDropStaleFinishedGame,
  isStaleFinishedGameStatus,
} = require('../lib/scan-timezone');
const {
  normalizeMobileApiPayload,
  parseGames,
} = require('../scrapers/365-api');
const {
  normalizeTennisScope,
  getScopeKey,
  groupByScope,
  compareCountry,
} = require('../compare');
const { catalogScopeKey } = require('../lib/365-competition-catalog');

assert.strictEqual(normalizeTennisScope('Exhibition Men'), 'international');
assert.strictEqual(normalizeTennisScope('Exhibition - Women'), 'international');
assert.strictEqual(normalizeTennisScope('International'), 'international');
assert.strictEqual(getScopeKey('Exhibition Men', 'tennis'), 'international');
assert.strictEqual(getScopeKey('International', 'tennis'), 'international');
assert.strictEqual(catalogScopeKey('Exhibition Men'), 'international');

const morning = new Date('2026-07-16T12:00:00-03:00');
assert.strictEqual(
  isUpcomingKickoff('2026-07-16', '18:00', { now: morning, timezone: 'America/Sao_Paulo' }),
  true
);
assert.strictEqual(
  shouldDropStaleFinishedGame('ended', '2026-07-16', '18:00', {
    now: morning,
    timezone: 'America/Sao_Paulo',
  }),
  false
);
assert.strictEqual(
  shouldDropStaleFinishedGame('ended', '2026-07-16', '18:00', {
    now: new Date('2026-07-16T22:00:00-03:00'),
    timezone: 'America/Sao_Paulo',
  }),
  true
);
assert.strictEqual(isStaleFinishedGameStatus('ended'), true);

const normalized = normalizeMobileApiPayload({
  Countries: [{ ID: 54, Name: 'International' }],
  Competitions: [{ ID: 9089, Name: 'UTS', CID: 54 }],
  Games: [{
    ID: 4771688,
    Comp: 9089,
    STime: '17-07-2026 00:00',
    IsFinished: true,
    Active: false,
    Comps: [
      { Name: 'Corentin Moutet', SymbolicName: 'MOU' },
      { Name: 'Tallon Griekspoor', SymbolicName: 'GRI' },
    ],
  }],
});

const kept = parseGames(normalized, {
  sportKey: 'tennis',
  targetDate: '2026-07-16',
  now: morning,
});
assert.strictEqual(kept.length, 1, 'premature finished UTS kickoff must stay in scrape');
assert.strictEqual(kept[0].competition, 'UTS');
assert.strictEqual(kept[0].status, 'scheduled');
assert.strictEqual(kept[0].time, '18:00');
assert.strictEqual(kept[0].groupName, 'International');

const dropped = parseGames(normalized, {
  sportKey: 'tennis',
  targetDate: '2026-07-16',
  now: new Date('2026-07-16T22:30:00-03:00'),
});
assert.strictEqual(dropped.length, 0, 'truly past finished games must still be dropped');

const games365 = [{
  country: 'International',
  competition: 'UTS',
  home: 'Corentin Moutet',
  away: 'Tallon Griekspoor',
  time: '18:00',
  status: 'scheduled',
}];
const gamesFlash = [{
  country: 'Exhibition Men',
  competition: 'UTS Championship (World), clay',
  home: 'Moutet C.',
  away: 'Griekspoor T.',
  time: '18:00',
  status: 'scheduled',
}];

const by365 = groupByScope(games365, 'tennis', '365');
const byFlash = groupByScope(gamesFlash, 'tennis', 'flash');
assert.ok(by365.international, '365 UTS must group under international');
assert.ok(byFlash.international, 'Flash exhibition men must group under international');
assert.strictEqual(by365.international.countryName, 'International');
assert.strictEqual(byFlash.international.countryName, 'International');

const result = compareCountry(
  'International',
  by365.international.games,
  byFlash.international.games,
  'tennis'
);
assert.strictEqual((result.matched_pairs || []).length, 1, 'UTS pair must match across sources');
assert.strictEqual((result.so_no_flash || []).length, 0);
assert.strictEqual((result.so_no_365 || []).length, 0);

console.log('test-tennis-uts-exhibition: ok');
