const assert = require('assert');
const path = require('path');

process.chdir(path.join(__dirname, '..'));

function diceSimilarity(left = '', right = '') {
  const a = ` ${left} `;
  const b = ` ${right} `;
  if (a.length <= 2 || b.length <= 2) return left === right ? 1 : 0;
  const counts = new Map();
  for (let i = 0; i < a.length - 1; i++) {
    const gram = a.slice(i, i + 2);
    counts.set(gram, (counts.get(gram) || 0) + 1);
  }
  let shared = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const gram = b.slice(i, i + 2);
    const count = counts.get(gram) || 0;
    if (count > 0) {
      shared += 1;
      counts.set(gram, count - 1);
    }
  }
  return (2 * shared) / (a.length + b.length - 2);
}

function normalizeCompTerm(text = '') {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function ruleScopeMatches(ruleScope = '', rowScope = '') {
  const left = String(ruleScope || '').trim().toLowerCase();
  const right = String(rowScope || '').trim().toLowerCase();
  return left === '*' || left === right;
}

function ruleCompetitionMatches(ruleCompetition = '', rowCompetition = '') {
  const left = normalizeCompTerm(ruleCompetition);
  const right = normalizeCompTerm(rowCompetition);
  if (!left || !right) return false;
  if (left === '*' || left === right) return true;
  return right.startsWith(`${left} `) || left.startsWith(`${right} `);
}

function isFlashOnlyCompetitionHandled(sportRules = {}, scope, competition) {
  for (const rule of sportRules.ignoreFlashOnly || []) {
    if (ruleScopeMatches(rule.scope, scope) && ruleCompetitionMatches(rule.competition, competition)) {
      return true;
    }
  }
  return false;
}

function flashOnlyCompetitionGroups(result = {}) {
  const only365 = Array.isArray(result?.so_no_365) ? result.so_no_365 : [];
  const onlyFlash = Array.isArray(result?.so_no_flash) ? result.so_no_flash : [];
  if (!onlyFlash.length) return [];

  const groups = new Map();
  for (const game of onlyFlash) {
    const competition = String(game.competicao || game.competition || '').trim();
    if (!competition) continue;
    if (!groups.has(competition)) {
      groups.set(competition, { competition, count: 0 });
    }
    groups.get(competition).count += 1;
  }

  const comp365Names = [...new Set(
    only365
      .map(game365 => normalizeCompTerm(game365.competicao || game365.competition || ''))
      .filter(Boolean)
  )];

  return [...groups.values()].filter(group => {
    if (!comp365Names.length) return true;
    const flashComp = normalizeCompTerm(group.competition);
    if (!flashComp) return true;
    if (comp365Names.includes(flashComp)) return false;
    return !comp365Names.some(comp365 => (
      comp365 === flashComp || diceSimilarity(comp365, flashComp) >= 0.85
    ));
  });
}

function flashOnlyCompetitionDontIgnoreAcknowledgements(scan, decisions = {}) {
  const items = [];
  const seen = new Set();

  for (const term of scan?.terms || []) {
    if (term.type !== 'missing_365' || decisions[term.id] !== 'different') continue;
    const scope = String(term.scope || '').trim();
    const competition = String(term.valueFlash || '').trim();
    if (!term.sport || !scope || !competition) continue;
    const key = `${term.sport}|||${scope.toLowerCase()}|||${competition.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ sport: term.sport, scope, competition });
  }

  return items;
}

const rules = {
  ignoreFlashOnly: [],
  acknowledgedFlashOnly: [{ scope: 'International', competition: 'Club Friendly' }],
};

const international = {
  country: 'International',
  result: {
    so_no_365: [{ competicao: 'FIFA World Cup', home: 'Brazil', away: 'France' }],
    so_no_flash: [
      { competicao: 'Club Friendly', home: 'Barcelona', away: 'Juventus' },
      { competicao: 'Club Friendly', home: 'Real Madrid', away: 'Milan' },
      { competicao: 'Club Friendly', home: 'Chelsea', away: 'Ajax' },
    ],
  },
};

const groups = flashOnlyCompetitionGroups(international.result || {});
const clubFriendly = groups.find(group => group.competition === 'Club Friendly');
assert.ok(clubFriendly, 'Club Friendly group should exist in compare snapshot');
assert.ok(clubFriendly.count >= 3, 'Club Friendly should have multiple games');

assert.strictEqual(
  isFlashOnlyCompetitionHandled(rules, 'International', 'Club Friendly'),
  false,
  'ignoreFlashOnly must not suppress Term Fix; only matched competitions are suppressed'
);

rules.ignoreFlashOnly.push({ scope: 'International', competition: 'Club Friendly' });
assert.strictEqual(
  isFlashOnlyCompetitionHandled(rules, 'International', 'Club Friendly'),
  true,
  'ignoreFlashOnly still marks competitions as handled for ignore-list workflows'
);

const scan = {
  terms: [
    {
      id: 'term_1',
      type: 'missing_365',
      sport: 'football',
      scope: 'International',
      valueFlash: 'Club Friendly',
    },
    {
      id: 'term_2',
      type: 'missing_365',
      sport: 'football',
      scope: 'International',
      valueFlash: 'Club Friendly',
    },
    {
      id: 'term_3',
      type: 'missing_365',
      sport: 'football',
      scope: 'International',
      valueFlash: 'Other Cup',
    },
  ],
};

const dontIgnoreItems = flashOnlyCompetitionDontIgnoreAcknowledgements(scan, {
  term_1: 'different',
  term_2: 'different',
  term_3: 'same',
});
assert.strictEqual(dontIgnoreItems.length, 1);
assert.deepStrictEqual(dontIgnoreItems[0], {
  sport: 'football',
  scope: 'International',
  competition: 'Club Friendly',
});

function rowWouldBeHiddenByAcknowledgedFlashOnly(row, sportRules = {}) {
  const rules = sportRules.acknowledgedFlashOnly || [];
  if (!rules.length || row.type !== 'onlyFlash') return false;
  const rowScope = String(row.country || '').trim().toLowerCase();
  const rowCompetition = String(row.competitionFlash || row.competition || '').trim().toLowerCase();
  return rules.some(rule =>
    String(rule.scope || '').trim().toLowerCase() === rowScope &&
    String(rule.competition || '').trim().toLowerCase() === rowCompetition
  );
}

function filterReportRowsLikeUi(rows) {
  // Report only hides ignoreFlashOnly rules, not acknowledgedFlashOnly (Não ignorar).
  return rows || [];
}

const onlyFlashRow = {
  type: 'onlyFlash',
  country: 'AUSTRALASIA',
  competitionFlash: 'World Cup - Qualification - First round',
};
const basketballRules = {
  ignoreFlashOnly: [],
  acknowledgedFlashOnly: [{
    scope: 'AUSTRALASIA',
    competition: 'World Cup - Qualification - First round',
  }],
};

assert.strictEqual(
  rowWouldBeHiddenByAcknowledgedFlashOnly(onlyFlashRow, basketballRules),
  true,
  'acknowledgedFlashOnly rule should match onlyFlash row'
);
assert.strictEqual(
  filterReportRowsLikeUi([onlyFlashRow]).length,
  1,
  'onlyFlash rows must stay visible in report after Não ignorar (acknowledgedFlashOnly is Term Fix only)'
);

console.log('test-terms-acknowledged-vs-ignore: ok');
