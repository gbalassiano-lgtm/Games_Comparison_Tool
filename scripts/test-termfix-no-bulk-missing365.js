const assert = require('assert');
const fs = require('fs');
const path = require('path');

process.chdir(path.join(__dirname, '..'));

delete require.cache[require.resolve('../server.js')];
const { buildTermSuggestions } = require('../server.js');

function clubFriendlyScanResult(gameCount = 37) {
  return {
    so_no_365: [],
    so_no_flash: Array.from({ length: gameCount }, (_, index) => ({
      competicao: 'Club Friendly',
      home: `Home ${index}`,
      away: `Away ${index}`,
    })),
    matched_pairs: [],
  };
}

const clubFriendlyTerms = buildTermSuggestions([
  { country: 'International', sport: 'football', result: clubFriendlyScanResult() },
], 'football');

assert.strictEqual(
  clubFriendlyTerms.filter(term => term.type === 'missing_365').length,
  0,
  'Bulk onlyFlash leagues must not create missing_365 Term Fix rows'
);

const faroeTerms = buildTermSuggestions([
  {
    country: 'Faroe Islands',
    sport: 'football',
    result: {
      so_no_365: [],
      so_no_flash: [
        { competicao: '1. Deild', home: 'HB Torshavn', away: 'KI Klaksvik' },
        { competicao: '1. Deild', home: 'NSI Runavik', away: 'B36 Torshavn' },
      ],
      matched_pairs: [],
    },
  },
], 'football');

assert.strictEqual(
  faroeTerms.filter(term => term.type === 'missing_365').length,
  0,
  'Flash-only competition groups must not surface as Term Fix suggestions'
);

const uiSource = fs.readFileSync(path.join(__dirname, '..', 'ui.js'), 'utf8');
assert.match(
  uiSource,
  /function buildIgnoredCompetitionSuggestions\(scan\) \{\s*\/\/ Bulk onlyFlash leagues belong in the Missing on 365 report, not Term Fix\.\s*return \[\];\s*\}/,
  'Ignored competition banner must stay disabled for bulk onlyFlash leagues'
);

const rules = require('../config/competition_rules.json');
const footballIgnore = rules.football?.ignoreFlashOnly || [];
const blocked = footballIgnore.filter(rule =>
  ['club friendly', 'friendly international'].includes(String(rule.competition || '').toLowerCase())
);
assert.strictEqual(
  blocked.length,
  0,
  'Club Friendly must not be in ignoreFlashOnly (games belong in Missing on 365 report)'
);

console.log('test-termfix-no-bulk-missing365: ok');
