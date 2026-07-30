const assert = require('assert');
const path = require('path');

process.chdir(path.join(__dirname, '..'));
delete require.cache[require.resolve('../server.js')];
delete require.cache[require.resolve('../lib/youth-markers.js')];

const {
  extractSideCategoryMarkers,
  categoryMarkersCompatible,
  textsCategoryCompatible,
} = require('../lib/youth-markers');
const { buildTermSuggestions } = require('../server.js');

assert.strictEqual(extractSideCategoryMarkers('Atlante W').women, true);
assert.strictEqual(extractSideCategoryMarkers('Puerto Rico (W)').women, true);
assert.strictEqual(extractSideCategoryMarkers('Costa Rica U23').youthKey, 'u23');
assert.strictEqual(extractSideCategoryMarkers('Cruz Azul').women, false);
assert.strictEqual(
  categoryMarkersCompatible(
    extractSideCategoryMarkers('Colombia (W)'),
    extractSideCategoryMarkers('Colombia U23')
  ),
  false,
  'W vs U23 must not be compatible'
);
assert.strictEqual(
  textsCategoryCompatible('Liga MX', 'Liga MX Feminino - Apertura'),
  false,
  'men vs women competitions must not be compatible'
);

function nameTerms(result) {
  return buildTermSuggestions(
    [{ country: 'Test', sport: 'football', result }],
    'football'
  ).filter(term => term.type === 'name');
}

const mexicoBad = nameTerms({
  so_no_365: [{
    competicao: 'Liga MX',
    home: 'Cruz Azul',
    away: 'Atlante',
    horario: '00:00',
  }],
  so_no_flash: [{
    competicao: 'Liga MX Feminino - Apertura',
    home: 'Atlante W',
    away: 'Necaxa W',
    horario: '00:00',
  }],
  matched_pairs: [],
  divergencias_nome: [],
});
assert.strictEqual(
  mexicoBad.length,
  0,
  'must not suggest Cruz Azul/Atlante ↔ Atlante W/Necaxa W'
);

const cacBad = nameTerms({
  so_no_365: [
    {
      competicao: 'Central American and Caribbean Games Feminino',
      home: 'Puerto Rico (W)',
      away: 'Colombia (W)',
      horario: '17:00',
    },
    {
      competicao: 'Central American and Caribbean Games Feminino',
      home: 'Jamaica (W)',
      away: 'Mexico (W)',
      horario: '17:00',
    },
  ],
  so_no_flash: [
    {
      competicao: 'Central American & Caribbean Games',
      home: 'Costa Rica U23',
      away: 'Colombia U23',
      horario: '17:00',
    },
    {
      competicao: 'Central American & Caribbean Games',
      home: 'Mexico U23',
      away: 'Guatemala U23',
      horario: '17:00',
    },
  ],
  matched_pairs: [],
  divergencias_nome: [],
});
assert.strictEqual(
  cacBad.length,
  0,
  'must not suggest W senior national teams ↔ U23 fixtures'
);

// Still allow a plausible near-miss with same gender/category.
// Use names that are fuzzy-close but not termsAreEquivalent (otherwise Term Fix
// correctly hides already-normalized pairs).
const okWomen = nameTerms({
  so_no_365: [{
    competicao: 'Liga MX Feminino',
    home: 'Racing Club (W)',
    away: 'Velez Sarsfield Feminino',
    horario: '19:00',
  }],
  so_no_flash: [{
    competicao: 'Liga MX Feminino - Apertura',
    home: 'Racing Avellaneda W',
    away: 'Velez W',
    horario: '19:00',
  }],
  matched_pairs: [],
  divergencias_nome: [],
});
assert.ok(
  okWomen.some(term => /Racing/i.test(term.value365) && /Racing/i.test(term.valueFlash)),
  'same-category women near-miss should still be suggested'
);

// Unmarked roster names in a women's competition must still be category-compatible.
const { fixturesCategoryCompatible } = require('../lib/youth-markers');
assert.strictEqual(
  fixturesCategoryCompatible(
    ['America', 'Tigres', 'Liga MX Feminino'],
    ['America W', 'Tigres W', 'Liga MX Feminino - Apertura']
  ),
  true,
  'women competition + unmarked teams should still match women-marked teams'
);

assert.strictEqual(
  fixturesCategoryCompatible(
    ['Kansas City Current', 'Racing Louisville FC', 'NWSL'],
    ['Kansas City Current W', 'Racing Louisville W', 'NWSL Women']
  ),
  true,
  'NWSL without W markers should still match NWSL Women + W suffixes'
);

assert.strictEqual(
  fixturesCategoryCompatible(
    ['Pärnu JK Vaprus', 'Levadia Tallinn', 'Meistriliiga'],
    ['Parnu JK Vaprus U21', 'Levadia U19', 'Esiliiga B']
  ),
  false,
  'senior vs U21/U19 must not sync as the same fixture'
);

assert.strictEqual(
  fixturesCategoryCompatible(
    ['Club América Men', 'Santos Laguna Men', 'Liga MX Men'],
    ['Santos Laguna W', 'Club America W', 'Liga MX Women - Apertura']
  ),
  false,
  'explicit men vs women must not sync'
);

assert.strictEqual(
  fixturesCategoryCompatible(
    ['Ureña SC', 'Puerto Cabello U20', 'Liga FUTVE 2'],
    ['Urena', 'Puerto Cabello B', 'Liga FUTVE 2']
  ),
  true,
  'U20 should be compatible with reserve/B developmental side'
);

assert.strictEqual(
  fixturesCategoryCompatible(
    ['Puerto Cabello', 'Ureña SC', 'Liga FUTVE'],
    ['Puerto Cabello B', 'Urena', 'Liga FUTVE 2']
  ),
  false,
  'senior (no youth) vs B-team must stay blocked'
);

assert.strictEqual(
  extractSideCategoryMarkers('Puerto Cabello B').youthKey,
  'reserve'
);
assert.strictEqual(
  extractSideCategoryMarkers('Puerto Cabello U20').youthKey,
  'u20'
);

// Colombia / LatAm second divisions are league tiers, not reserve sides.
assert.strictEqual(
  extractSideCategoryMarkers('Primera B').youthKey,
  null,
  'Primera B competition must not be treated as reserve'
);
assert.strictEqual(
  extractSideCategoryMarkers('Primera B - Clausura').youthKey,
  null,
  'Primera B - Clausura must not be treated as reserve'
);
assert.strictEqual(
  extractSideCategoryMarkers('Serie B').youthKey,
  null,
  'Serie B competition must not be treated as reserve'
);
assert.strictEqual(
  fixturesCategoryCompatible(
    ['Real Santander', 'Patriotas', 'Primera B'],
    ['Real Santander', 'Patriotas', 'Primera B - Clausura']
  ),
  true,
  'Primera B ↔ Primera B - Clausura senior fixtures must stay compatible'
);
assert.strictEqual(
  fixturesCategoryCompatible(
    ['Union Magdalena', 'Orsomarso', 'Primera B'],
    ['U. Magdalena', 'Orsomarso', 'Primera B - Clausura']
  ),
  true,
  'Primera B with U./Union abbreviation must stay category-compatible'
);

console.log('test-termfix-category-guards: ok');
