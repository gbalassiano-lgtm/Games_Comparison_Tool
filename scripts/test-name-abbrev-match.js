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

console.log('test-name-abbrev-match: ok');
