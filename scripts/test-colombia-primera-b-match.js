const assert = require('assert');
const { compareCountry } = require('../compare');

const games365 = [
  {
    home: 'Real Santander',
    away: 'Patriotas',
    time: '18:00',
    status: 'scheduled',
    competition: 'Primera B',
    country: 'Colombia',
  },
  {
    home: 'Union Magdalena',
    away: 'Orsomarso',
    time: '20:00',
    status: 'scheduled',
    competition: 'Primera B',
    country: 'Colombia',
  },
];

const gamesFlash = [
  {
    home: 'Real Santander',
    away: 'Patriotas',
    time: '18:00',
    status: 'scheduled',
    competition: 'Primera B - Clausura',
    country: 'COLOMBIA:',
  },
  {
    home: 'U. Magdalena',
    away: 'Orsomarso',
    time: '20:00',
    status: 'scheduled',
    competition: 'Primera B - Clausura',
    country: 'COLOMBIA:',
  },
];

const result = compareCountry('Colombia', games365, gamesFlash, 'football');

assert.strictEqual(
  result.matched_pairs.length,
  2,
  `expected both Colombia Primera B pairs to match, got ${result.matched_pairs.length}`
);
assert.strictEqual(result.so_no_365.length, 0, 'no only365 leftovers');
assert.strictEqual(result.so_no_flash.length, 0, 'no onlyFlash leftovers');

assert.ok(
  result.matched_pairs.some(
    p =>
      /Real Santander/i.test(p.home365) &&
      /Patriotas/i.test(p.away365) &&
      /Real Santander/i.test(p.homeFlash) &&
      /Patriotas/i.test(p.awayFlash)
  ),
  'Real Santander / Patriotas must match across Primera B ↔ Primera B - Clausura'
);

assert.ok(
  result.matched_pairs.some(
    p =>
      /Union Magdalena/i.test(p.home365) &&
      /Orsomarso/i.test(p.away365) &&
      /U\.?\s*Magdalena/i.test(p.homeFlash) &&
      /Orsomarso/i.test(p.awayFlash)
  ),
  'Union Magdalena ↔ U. Magdalena must match'
);

// Do not force-match Goiano-style opponent mismatches.
const goiano = compareCountry(
  'Brasil',
  [
    {
      home: 'Anapolina',
      away: 'Goiatuba',
      time: '16:00',
      status: 'scheduled',
      competition: 'Goiano',
      country: 'Brazil',
    },
  ],
  [
    {
      home: 'Anapolina',
      away: 'Jataiense',
      time: '16:00',
      status: 'scheduled',
      competition: 'Goiano',
      country: 'BRAZIL:',
    },
  ],
  'football'
);
assert.strictEqual(
  goiano.matched_pairs.length,
  0,
  'must not match unrelated Goiano opponents that only share one team'
);

console.log('test-colombia-primera-b-match: ok');
