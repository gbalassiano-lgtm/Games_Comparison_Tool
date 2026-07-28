const assert = require('assert');
const {
  flexibleNameSimilarity,
  normalizeTeamNameCore,
} = require('../lib/flexible-names');

function assertMatch(a, b, minScore = 0.88) {
  const score = flexibleNameSimilarity(a, b);
  assert.ok(
    score >= minScore,
    `Expected "${a}" ↔ "${b}" >= ${minScore}, got ${score} (norm: ${normalizeTeamNameCore(a)} | ${normalizeTeamNameCore(b)})`
  );
}

function assertExact(a, b) {
  assert.strictEqual(
    normalizeTeamNameCore(a),
    normalizeTeamNameCore(b),
    `Expected same normalized form for "${a}" and "${b}"`
  );
}

// Ecuador Serie B example that previously failed to pair.
assertMatch('Independiente Juniors', 'Ind. Juniors', 0.9);
assertExact('Atlético FC', 'Atletico FC');
assertMatch('Atlético FC', 'Atletico FC', 0.99);

// Atlético Junior / Junior must not collapse to empty after junior stripping.
assert.ok(
  normalizeTeamNameCore('Junior'),
  'standalone Junior must not normalize to empty'
);
assert.ok(
  normalizeTeamNameCore('Junior FC'),
  'Junior FC must not normalize to empty'
);
assertMatch('Junior', 'Junior FC', 0.99);
assertMatch('Junior Barranquilla', 'Junior FC', 0.9);
assertMatch('Atlético Junior', 'Junior', 0.9);
// Still strip junior(s) as a longer-club modifier.
assert.ok(
  !/\bjunior/.test(normalizeTeamNameCore('Boca Juniors')),
  'Boca Juniors should drop trailing Juniors modifier'
);
assertMatch('Independiente Juniors', 'Independiente', 0.9);

// Common LatAm club truncations / accents.
assertMatch('Independiente del Valle', 'Ind. del Valle', 0.9);
assertMatch('Atlético Mineiro', 'Atletico Mineiro', 0.99);
assertMatch('Deportivo Cuenca', 'Dep. Cuenca', 0.9);
assertMatch('Estudiantes', 'Est.', 0.9);
assertMatch('Nacional', 'Nac.', 0.9);

// Should still match existing flexible cases.
assertMatch('Portland Timbers II', 'Portland Timbers 2', 0.9);
assertMatch('Astana', 'FC Astana', 0.9);

// Avoid collapsing unrelated short names.
assert.ok(
  flexibleNameSimilarity('Inter', 'Internacional') >= 0.9,
  'Inter ↔ Internacional should match via abbreviation map'
);

// Flash Club Friendlies: country codes in parentheses + local short forms.
assertMatch('Hoffenheim II', 'Hoffenheim II (Ger)', 0.99);
assertMatch('Vitesse', 'Vitesse (Ned)', 0.99);
assertMatch('Sonnenhof Großaspach', 'Grossaspach (Ger)', 0.9);
assertMatch('PSV Eindhoven', 'PSV (Ned)', 0.9);
assertMatch('Union St. Gilloise', 'Royale Union SG (Bel)', 0.9);
assertMatch('Jazira Abu Dhabi', 'Al Jazira (Uae)', 0.9);
assertMatch('HB Køge', 'Koge (Den)', 0.9);
assertMatch('FC VSS Kosice', 'Kosice (Svk)', 0.9);
assertMatch('Diosgyori VTK', 'DVTK (Hun)', 0.9);
assertMatch('STVV', 'St. Truiden (Bel)', 0.9);
assertMatch('Frome Town', 'Frome (Eng)', 0.9);
assertMatch('Worthing United', 'Worthing (Eng)', 0.9);
assertMatch('Moreirense', 'Moreirense (Por)', 0.99);
assertMatch('AVS', 'AFS (Por)', 0.9);
assertMatch('Graffin Vlasim', 'Vlasim (Cze)', 0.9);

// Do not collapse distinct clubs that only look similar.
assert.ok(
  flexibleNameSimilarity('Domzale', 'Domazlice (Cze)') < 0.88,
  'Domzale ↔ Domazlice should remain distinct'
);

console.log('test-name-abbrev-match: ok');
