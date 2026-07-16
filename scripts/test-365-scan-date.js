const assert = require('assert');
const {
  shouldIncludeGameForScan,
  apiFetchWindow,
  parseGames,
  dedupe365Rows,
} = require('../scrapers/365-api');
const { gameBelongsToScanTarget, isStaleFinishedGameStatus } = require('../lib/scan-timezone');

const targetDate = '2026-06-28';
const previousDate = '2026-06-27';
const nextDate = '2026-06-29';

assert.strictEqual(shouldIncludeGameForScan(targetDate, targetDate), true);
assert.strictEqual(shouldIncludeGameForScan(previousDate, targetDate), false);
assert.strictEqual(shouldIncludeGameForScan(nextDate, targetDate), false);
assert.strictEqual(shouldIncludeGameForScan(null, targetDate), false);

assert.deepStrictEqual(apiFetchWindow(targetDate), {
  startDate: targetDate,
  endDate: '2026-06-29',
});

const parsed = parseGames({
  games: [
    {
      id: 1,
      startTime: '2026-06-28T15:00:00.000Z',
      statusText: 'Scheduled',
      homeCompetitor: { name: 'Home A' },
      awayCompetitor: { name: 'Away A' },
      competitionDisplayName: 'League A',
      countryName: 'Brazil',
    },
    {
      id: 2,
      startTime: '2026-06-27T23:30:00.000Z',
      statusText: 'Scheduled',
      homeCompetitor: { name: 'Home B' },
      awayCompetitor: { name: 'Away B' },
      competitionDisplayName: 'League B',
      countryName: 'Brazil',
    },
    {
      id: 3,
      startTime: '2026-06-29T16:00:00.000Z',
      statusText: 'Scheduled',
      homeCompetitor: { name: 'Home C' },
      awayCompetitor: { name: 'Away C' },
      competitionDisplayName: 'League C',
      countryName: 'Brazil',
    },
    {
      id: 4,
      startTime: '2026-06-28T18:00:00.000Z',
      statusText: 'Finished',
      homeCompetitor: { name: 'Home D' },
      awayCompetitor: { name: 'Away D' },
      competitionDisplayName: 'League D',
      countryName: 'Brazil',
    },
  ],
  countries: [],
  competitions: [],
}, { sportKey: 'football', targetDate });

assert.strictEqual(parsed.length, 1);
assert.strictEqual(parsed[0].home, 'Home A');
assert.strictEqual(parsed[0].dateKey, targetDate);

const deduped = dedupe365Rows([
  { groupName: 'Brazil', competition: 'Cup', home: 'A', away: 'B', time: '22:00', status: 'scheduled', dateKey: previousDate },
  { groupName: 'Brazil', competition: 'Cup', home: 'A', away: 'B', time: '22:00', status: 'scheduled', dateKey: targetDate },
], targetDate);

assert.strictEqual(deduped.length, 1);
assert.strictEqual(deduped[0].dateKey, targetDate);

assert.strictEqual(isStaleFinishedGameStatus('finished'), true);
assert.strictEqual(isStaleFinishedGameStatus('scheduled'), false);
assert.strictEqual(gameBelongsToScanTarget(targetDate, targetDate), true);
assert.strictEqual(gameBelongsToScanTarget(previousDate, targetDate), false);

const finishedOnTarget = parseGames({
  games: [
    {
      id: 10,
      mobileDateKey: targetDate,
      mobileTime: '18:00',
      statusText: 'ended',
      homeCompetitor: { name: 'Home E' },
      awayCompetitor: { name: 'Away E' },
      competitionDisplayName: 'UTS',
      countryName: 'International',
    },
  ],
  countries: [],
  competitions: [],
}, {
  sportKey: 'tennis',
  targetDate,
  now: new Date(`${targetDate}T12:00:00-03:00`),
});
assert.strictEqual(finishedOnTarget.length, 1);
assert.strictEqual(finishedOnTarget[0].status, 'scheduled');

console.log('test-365-scan-date: ok');
