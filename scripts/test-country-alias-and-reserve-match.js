const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createRequire } = require('module');

const root = path.join(__dirname, '..');
process.chdir(root);
const comparePath = path.join(root, 'compare.js');
const rootRequire = createRequire(comparePath);
delete require.cache[comparePath];
const code = fs.readFileSync(comparePath, 'utf8');
const sandbox = {
  module: { exports: {} },
  exports: {},
  require: rootRequire,
  __dirname: root,
  path: require('path'),
  fs,
  process,
  console,
};
vm.runInNewContext(
  `${code}\nglobalOut = { normCountry, compareCountry, calculateMatchScore };`,
  sandbox
);
const g = sandbox.globalOut;

const {
  extractSideCategoryMarkers,
  fixturesCategoryCompatible,
  isLeagueTierCompetitionLabel,
} = require('../lib/youth-markers');

// --- Turkey: 365 sends "Turkiye", Flashscore sends "TURKEY:" ---
assert.strictEqual(g.normCountry('Turkiye'), g.normCountry('TURKEY:'));
assert.strictEqual(g.normCountry('Turquia'), g.normCountry('Turkiye'));

const turkey365 = [
  { country: 'Turkiye', competition: '1. Lig', time: '13:00', home: 'Igdir Fk', away: 'Fatih Karagümrük', status: 'scheduled' },
  { country: 'Turkiye', competition: '1. Lig', time: '13:00', home: 'Sariyer', away: 'Muglaspor', status: 'scheduled' },
  { country: 'Turkiye', competition: '1. Lig', time: '15:30', home: 'Bodrumspor', away: 'Bursaspor', status: 'scheduled' },
  { country: 'Turkiye', competition: '1. Lig', time: '15:30', home: 'Van Spor FK', away: 'Kayserispor', status: 'scheduled' },
];
const turkeyFlash = [
  { country: 'TURKEY:', competition: '1. Lig', time: '13:00', home: 'Igdir FK', away: 'Karagumruk', status: 'scheduled' },
  { country: 'TURKEY:', competition: '1. Lig', time: '13:00', home: 'Sariyer', away: 'Muglaspor', status: 'scheduled' },
  { country: 'TURKEY:', competition: '1. Lig', time: '15:30', home: 'Bodrumspor', away: 'Bursaspor', status: 'scheduled' },
  { country: 'TURKEY:', competition: '1. Lig', time: '15:30', home: 'Vanspor FK', away: 'Kayserispor', status: 'scheduled' },
];
const turkeyResult = g.compareCountry('turkiye', turkey365, turkeyFlash, 'football');
assert.strictEqual(turkeyResult.matched_pairs.length, 4, 'all 4 Turkish fixtures must match');
assert.strictEqual(turkeyResult.so_no_365.length, 0);
assert.strictEqual(turkeyResult.so_no_flash.length, 0);

// --- Reserve sides: 365 "Zamora FC B" ↔ Flash "Zamora 2" ---
assert.strictEqual(
  extractSideCategoryMarkers('Zamora 2', { knownTeam: true }).youthKey,
  'reserve',
  'fixture team "Zamora 2" is a reserve side'
);
assert.strictEqual(
  fixturesCategoryCompatible(
    ['Club Atletico Barinas', 'Zamora FC B', 'Liga FUTVE 2'],
    ['Atletico Barinas', 'Zamora 2', 'Liga FUTVE 2']
  ),
  true
);
const zamora = g.calculateMatchScore(
  { home: 'Club Atletico Barinas', away: 'Zamora FC B', competition: 'Liga FUTVE 2', time: '16:30', status: 'scheduled' },
  { home: 'Atletico Barinas', away: 'Zamora 2', competition: 'Liga FUTVE 2', time: '16:30', status: 'scheduled' },
  'football'
);
assert.ok(zamora && zamora.score > 0, `Barinas/Zamora must match, got ${JSON.stringify(zamora)}`);

// Reserve marker must still not leak from a competition tier label.
assert.strictEqual(isLeagueTierCompetitionLabel('gaucho 2'), true);
assert.strictEqual(extractSideCategoryMarkers('Gaucho 2').youthKey, null);
assert.strictEqual(extractSideCategoryMarkers('Gaucho 2', { role: 'competition' }).youthKey, null);
assert.strictEqual(
  fixturesCategoryCompatible(
    ['Gramadense', 'Veranopolis', 'Gaucho A2'],
    ['Gramadense', 'Veranopolis', 'Gaucho 2']
  ),
  true,
  'senior fixtures in a tier-2 league stay compatible'
);

// Senior ↔ reserve must stay blocked.
assert.strictEqual(
  fixturesCategoryCompatible(
    ['Zamora FC', 'Puerto Cabello', 'Liga FUTVE'],
    ['Zamora 2', 'Puerto Cabello', 'Liga FUTVE']
  ),
  false,
  'senior side must not pair with a reserve side'
);

console.log('test-country-alias-and-reserve-match: ok');
