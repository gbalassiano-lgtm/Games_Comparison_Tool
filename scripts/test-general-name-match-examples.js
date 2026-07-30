const assert = require('assert');
const { compareCountry } = require('../compare.js');
const { possibleUnmatchedGameCandidate } = require('../server.js');

function assertMatched(label, games365, gamesFlash, country = 'Test') {
  const result = compareCountry(country, games365, gamesFlash, 'football');
  assert.strictEqual(
    result.matched_pairs.length,
    games365.length,
    `${label}: expected ${games365.length} matched, got ${result.matched_pairs.length} (only365=${result.so_no_365.length}, onlyFlash=${result.so_no_flash.length})`
  );
  assert.strictEqual(result.so_no_365.length, 0, `${label}: unexpected only365`);
  assert.strictEqual(result.so_no_flash.length, 0, `${label}: unexpected onlyFlash`);
}

assertMatched(
  'Austria 2. Liga Vienna/Sturm',
  [{
    home: 'First Vienna FC 1894',
    away: 'SK Sturm AM',
    time: '13:30',
    status: 'scheduled',
    competition: '2. Liga',
  }],
  [{
    home: 'First Vienna',
    away: 'Sturm Graz II',
    time: '13:30',
    status: 'scheduled',
    competition: '2. Liga',
  }],
  'Austria'
);

assertMatched(
  'Brazil Gaucho A2 ↔ Gaucho 2',
  [
    {
      home: 'Gramadense',
      away: 'Veranopolis',
      time: '15:00',
      status: 'scheduled',
      competition: 'Gaucho A2',
    },
    {
      home: 'Santa Cruz RS',
      away: 'Glória de Vacaria',
      time: '15:00',
      status: 'scheduled',
      competition: 'Gaucho A2',
    },
    {
      home: 'Esportivo/RS',
      away: 'Guarani-VA',
      time: '17:00',
      status: 'scheduled',
      competition: 'Gaucho A2',
    },
  ],
  [
    {
      home: 'Gramadense',
      away: 'Veranopolis',
      time: '15:00',
      status: 'scheduled',
      competition: 'Gaucho 2',
    },
    {
      home: 'Santa Cruz RS',
      away: 'GE Gloria',
      time: '15:00',
      status: 'scheduled',
      competition: 'Gaucho 2',
    },
    {
      home: 'Esportivo',
      away: 'EC Guarani',
      time: '17:00',
      status: 'scheduled',
      competition: 'Gaucho 2',
    },
  ],
  'Brazil'
);

// Near-misses that still fail auto-match should at least be Term Fix candidates.
const nearMiss365 = {
  home: 'Some Club Alpha',
  away: 'Some Club Beta',
  time: '16:00',
  status: 'scheduled',
  competition: 'Regional 2',
};
const nearMissFlash = {
  home: 'Some Club Alpha',
  away: 'Club Beta United',
  time: '16:00',
  status: 'scheduled',
  competition: 'Regional 2',
};
assert.ok(
  possibleUnmatchedGameCandidate(nearMiss365, nearMissFlash),
  'same-time regional tier fixtures with shared tokens should be Term Fix candidates'
);

// Unrelated clubs that only share reserve markers must never be Term Fix candidates.
assert.strictEqual(
  possibleUnmatchedGameCandidate(
    {
      home: 'Mönchengladbach II',
      away: 'SV Rödinghausen',
      time: '09:00',
      horario: '09:00',
      competition: 'Regionalliga',
      competicao: 'Regionalliga',
    },
    {
      home: 'Eckernforder SV',
      away: 'Lubeck II',
      time: '09:00',
      horario: '09:00',
      competition: 'Regionalliga Nord',
      competicao: 'Regionalliga Nord',
    }
  ),
  null,
  'unrelated Regionalliga leftovers must not become Term Fix name pairs'
);

console.log('test-general-name-match-examples: ok');
