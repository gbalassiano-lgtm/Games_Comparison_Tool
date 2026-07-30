const assert = require('assert');
const path = require('path');

process.chdir(path.join(__dirname, '..'));

const { compareCountry } = require('../compare.js');
const { possibleUnmatchedGameCandidate, buildTermSuggestions } = require('../server.js');
const { extractSideCategoryMarkers, fixturesCategoryCompatible } = require('../lib/youth-markers');
const { flexibleNameSimilarity } = require('../lib/flexible-names');

// --- Category: two-token "... II" is a club reserve, not a league tier ---
assert.strictEqual(
  extractSideCategoryMarkers('Mönchengladbach II').youthKey,
  'reserve',
  'Mönchengladbach II must be reserve'
);
assert.strictEqual(
  extractSideCategoryMarkers('Lubeck II').youthKey,
  'reserve',
  'Lubeck II must be reserve'
);
assert.strictEqual(
  extractSideCategoryMarkers('Gaucho 2', { role: 'competition' }).youthKey,
  null,
  'Gaucho 2 competition must stay non-reserve'
);
assert.strictEqual(
  fixturesCategoryCompatible(
    ['Mönchengladbach II', 'SV Rödinghausen', 'Regionalliga'],
    ['B. Monchengladbach II', 'Rodinghausen', 'Regionalliga West']
  ),
  true,
  'Regionalliga reserve pair must be category-compatible'
);

// --- Auto-match: prioritize teams over split Regionalliga comps ---
const regionResult = compareCountry(
  'Germany',
  [{
    home: 'Mönchengladbach II',
    away: 'SV Rödinghausen',
    time: '09:00',
    status: 'scheduled',
    competition: 'Regionalliga',
  }],
  [
    {
      home: 'B. Monchengladbach II',
      away: 'Rodinghausen',
      time: '09:00',
      status: 'scheduled',
      competition: 'Regionalliga West',
    },
    {
      home: 'Eckernforder SV',
      away: 'Lubeck II',
      time: '09:00',
      status: 'scheduled',
      competition: 'Oberliga Schleswig-Holstein',
    },
  ],
  'football'
);

assert.strictEqual(regionResult.matched_pairs.length, 1, 'expected one Regionalliga match');
assert.strictEqual(regionResult.matched_pairs[0].homeFlash, 'B. Monchengladbach II');
assert.strictEqual(regionResult.matched_pairs[0].awayFlash, 'Rodinghausen');
assert.strictEqual(regionResult.so_no_flash.length, 1);
assert.strictEqual(regionResult.so_no_flash[0].home, 'Eckernforder SV');

// Bad pair alone must not auto-match
const badAlone = compareCountry(
  'Germany',
  [{
    home: 'Mönchengladbach II',
    away: 'SV Rödinghausen',
    time: '09:00',
    status: 'scheduled',
    competition: 'Regionalliga',
  }],
  [{
    home: 'Eckernforder SV',
    away: 'Lubeck II',
    time: '09:00',
    status: 'scheduled',
    competition: 'Oberliga Schleswig-Holstein',
  }],
  'football'
);
assert.strictEqual(badAlone.matched_pairs.length, 0, 'unrelated reserve fixtures must not match');
assert.strictEqual(badAlone.so_no_365.length, 1);
assert.strictEqual(badAlone.so_no_flash.length, 1);

// Term Fix must not suggest the nonsense Germany pair
assert.strictEqual(
  possibleUnmatchedGameCandidate(
    {
      home: 'Mönchengladbach II',
      away: 'SV Rödinghausen',
      horario: '09:00',
      competicao: 'Regionalliga',
    },
    {
      home: 'Eckernforder SV',
      away: 'Lubeck II',
      horario: '09:00',
      competicao: 'Oberliga Schleswig-Holstein',
    }
  ),
  null,
  'Term Fix must reject Mönchengladbach II / Rödinghausen ↔ Eckernforder / Lubeck II'
);

assert.strictEqual(
  possibleUnmatchedGameCandidate(
    {
      home: 'Mönchengladbach II',
      away: 'SV Rödinghausen',
      horario: '09:00',
      competicao: 'Regionalliga',
    },
    {
      home: 'Eckernforder SV',
      away: 'Lubeck II',
      horario: '09:00',
      competicao: 'Regionalliga Nord',
    }
  ),
  null,
  'Term Fix must reject weak teams even when both comps say Regionalliga*'
);

// Legitimate near-miss with shared club tokens should still be a Term Fix candidate
assert.ok(
  possibleUnmatchedGameCandidate(
    {
      home: 'Some Club Alpha',
      away: 'Some Club Beta',
      horario: '16:00',
      competicao: 'Regional 2',
    },
    {
      home: 'Some Club Alpha',
      away: 'Club Beta United',
      horario: '16:00',
      competicao: 'Regional 2',
    }
  ),
  'shared club tokens + same time should remain a Term Fix candidate'
);

// Near-exact teams across Regionalliga parent/subdivision should Term Fix if unmatched
assert.ok(
  possibleUnmatchedGameCandidate(
    {
      home: 'Mönchengladbach II',
      away: 'SV Rödinghausen',
      horario: '09:00',
      competicao: 'Regionalliga',
    },
    {
      home: 'B. Monchengladbach II',
      away: 'Rodinghausen',
      horario: '09:00',
      competicao: 'Regionalliga West',
    }
  ),
  'strong Regionalliga team near-miss should be Term Fix candidate'
);

// Kazakhstan transliteration when both sides exist
assert.ok(
  flexibleNameSimilarity('FC Qyzyljar', 'Kyzylzhar') >= 0.9,
  'Qyzyljar ↔ Kyzylzhar should normalize as the same club'
);

const kz = compareCountry(
  'Kazakhstan',
  [{
    home: 'FC Qyzyljar',
    away: 'Aktobe',
    time: '11:00',
    status: 'scheduled',
    competition: 'Premier League',
  }],
  [{
    home: 'Kyzylzhar',
    away: 'Aktobe',
    time: '11:00',
    status: 'scheduled',
    competition: 'Premier League',
  }],
  'football'
);
assert.strictEqual(kz.matched_pairs.length, 1, 'Qyzyljar/Aktobe must match Kyzylzhar/Aktobe');

// buildTermSuggestions should not surface the bad Germany pair from unmatched leftovers
const badTerms = buildTermSuggestions(
  [{
    country: 'Germany',
    sport: 'football',
    result: {
      so_no_365: [{
        competicao: 'Regionalliga',
        home: 'Mönchengladbach II',
        away: 'SV Rödinghausen',
        horario: '09:00',
      }],
      so_no_flash: [{
        competicao: 'Regionalliga Nord',
        home: 'Eckernforder SV',
        away: 'Lubeck II',
        horario: '09:00',
      }],
      matched_pairs: [],
      divergencias_nome: [],
    },
  }],
  'football'
).filter(term => term.type === 'name');

assert.strictEqual(
  badTerms.length,
  0,
  'buildTermSuggestions must not propose the nonsense Germany Regionalliga pair'
);

console.log('test-regionalliga-team-priority: ok');
