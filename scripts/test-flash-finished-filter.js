const assert = require('assert');
const {
  filterFlashGamesForScanTarget,
  parseEmbeddedFlashSchedule,
} = require('../scrapers/flashscore-shared');

const filtered = filterFlashGamesForScanTarget([
  { country: 'Brazil', competition: 'Serie A', home: 'A', away: 'B', time: '20:00', status: 'scheduled', dateKey: '2026-06-29' },
  { country: 'Brazil', competition: 'Serie A', home: 'C', away: 'D', time: '18:00', status: 'finished', dateKey: '2026-06-29' },
  { country: 'Brazil', competition: 'Serie A', home: 'E', away: 'F', time: '21:00', status: 'live', dateKey: '2026-06-29' },
], '2026-06-29');

assert.strictEqual(filtered.length, 1);
assert.strictEqual(filtered[0].home, 'A');

const embedded = parseEmbeddedFlashSchedule('29.06. 19:00', '2026-06-29');
assert.deepStrictEqual(embedded, { dateKey: '2026-06-29', time: '19:00' });

const dated = filterFlashGamesForScanTarget([
  {
    country: 'Brazil',
    competition: 'Serie D - Play Offs',
    home: 'Democrata GV',
    away: 'Ivinhema',
    time: '29.06. 19:00',
    status: 'scheduled',
  },
  {
    country: 'Brazil',
    competition: 'Serie D - Play Offs',
    home: 'Other',
    away: 'Teams',
    time: '28.06. 17:00',
    status: 'scheduled',
  },
], '2026-06-29');

assert.strictEqual(dated.length, 1);
assert.strictEqual(dated[0].home, 'Democrata GV');
assert.strictEqual(dated[0].time, '19:00');
assert.strictEqual(dated[0].dateKey, '2026-06-29');

console.log('test-flash-finished-filter: ok');
