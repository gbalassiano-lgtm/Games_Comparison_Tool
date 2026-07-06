const assert = require('assert');
const path = require('path');
const { isNormalizedCompPrefixMatch } = require('../lib/competition-prefix');
const {
  getCurrentBridge,
  isCompetitionMatchedInCurrentScan,
  isCompKnownShared,
  isCompetitionTermFixSuppressed,
  buildTermFixSuppressedKeys,
} = require('../compare.js');

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

function flashCompetitionMatchedInResult(result = {}, competition = '', sportKey = '', scope = '') {
  if (sportKey) {
    const sportLabel = sportKey === 'tennis' ? 'Tênis' : '';
    const bridge = getCurrentBridge(result, sportLabel);
    if (isCompetitionMatchedInCurrentScan('flash', competition, sportLabel, bridge)) {
      return true;
    }
    if (isCompKnownShared(sportKey, competition, 'flash', scope)) {
      return true;
    }
  }

  const flashComp = normalizeCompTerm(competition);
  if (!flashComp) return false;

  const pairedCompNames = [...new Set(
    (result?.matched_pairs || []).flatMap(pair => [
      normalizeCompTerm(pair.competition365 || ''),
      normalizeCompTerm(pair.competitionFlash || ''),
    ]).filter(Boolean)
  )];

  return pairedCompNames.some(pairedComp => (
    pairedComp === flashComp ||
    isNormalizedCompPrefixMatch(pairedComp, flashComp) ||
    diceSimilarity(pairedComp, flashComp) >= 0.85
  ));
}

function flashOnlyCompetitionGroups(result = {}, sportKey = '', scope = '') {
  const only365 = Array.isArray(result?.so_no_365) ? result.so_no_365 : [];
  const onlyFlash = Array.isArray(result?.so_no_flash) ? result.so_no_flash : [];
  if (!onlyFlash.length) return [];

  const groups = new Map();
  for (const game of onlyFlash) {
    const competition = String(game.competicao || game.competition || '').trim();
    if (!competition) continue;
    if (!groups.has(competition)) {
      groups.set(competition, { competition, count: 0, sampleHome: game.home || '', sampleAway: game.away || '' });
    }
    groups.get(competition).count += 1;
  }

  const comp365Names = [...new Set(
    only365
      .map(game365 => normalizeCompTerm(game365.competicao || game365.competition || ''))
      .filter(Boolean)
  )];
  const flashCompKey = (competition = '') => normalizeCompTerm(competition);

  return [...groups.values()].filter(group => {
    if (flashCompetitionMatchedInResult(result, group.competition, sportKey, scope)) return false;

    const flashComp = flashCompKey(group.competition);
    if (!flashComp) return true;
    if (!comp365Names.length) return true;
    if (comp365Names.includes(flashComp)) return false;

    return !comp365Names.some(comp365 => (
      comp365 === flashComp ||
      isNormalizedCompPrefixMatch(comp365, flashComp) ||
      diceSimilarity(comp365, flashComp) >= 0.85
    ));
  });
}

const faroe = {
  so_no_365: [],
  so_no_flash: [
    { competicao: '1. Deild', home: 'HB Torshavn', away: 'KI Klaksvik', horario: '18:00' },
    { competicao: '1. Deild', home: 'NSI Runavik', away: 'B36 Torshavn', horario: '20:00' },
  ],
};
const faroeGroups = flashOnlyCompetitionGroups(faroe, 'football', 'Faroe Islands');
assert.strictEqual(faroeGroups.length, 1);
assert.strictEqual(faroeGroups[0].competition, '1. Deild');
assert.strictEqual(faroeGroups[0].count, 2);

const mixed = {
  so_no_365: [{ competicao: 'Veikkausliiga', home: 'HJK', away: 'KuPS', horario: '17:00' }],
  so_no_flash: [
    { competicao: 'Kakkonen Group A', home: 'Team A', away: 'Team B', horario: '15:00' },
    { competicao: 'Kakkonen Group A', home: 'Team C', away: 'Team D', horario: '16:00' },
  ],
};
const mixedGroups = flashOnlyCompetitionGroups(mixed, 'football', 'Finland');
assert.strictEqual(mixedGroups.length, 1);
assert.strictEqual(mixedGroups[0].competition, 'Kakkonen Group A');

const pairedComp = {
  so_no_365: [{ competicao: 'Kakkonen Group A', home: 'A', away: 'B' }],
  so_no_flash: [{ competicao: 'Kakkonen Group A', home: 'C', away: 'D' }],
};
assert.strictEqual(flashOnlyCompetitionGroups(pairedComp, 'football', 'Finland').length, 0);

const looselyRelated = {
  so_no_365: [{ competicao: 'Division 1', home: 'A', away: 'B' }],
  so_no_flash: [{ competicao: 'Division 2', home: 'C', away: 'D' }],
};
assert.strictEqual(flashOnlyCompetitionGroups(looselyRelated, 'football', 'Norway').length, 1);
assert.strictEqual(flashOnlyCompetitionGroups(looselyRelated, 'football', 'Norway')[0].competition, 'Division 2');

const bridgedViaMatchedPairs = {
  so_no_365: [],
  so_no_flash: [
    { competicao: 'Premier League', home: 'Arsenal', away: 'Chelsea', horario: '15:00' },
    { competicao: 'FA Cup', home: 'Liverpool', away: 'Everton', horario: '17:00' },
  ],
  matched_pairs: [
    {
      competition365: 'England: Premier League',
      competitionFlash: 'Premier League',
      compKey365: 'england premier league',
      compKeyFlash: 'premier league',
      home365: 'Man City', away365: 'Tottenham',
      homeFlash: 'Newcastle', awayFlash: 'Brighton',
    },
  ],
};
const bridgedGroups = flashOnlyCompetitionGroups(bridgedViaMatchedPairs, 'football', 'England');
assert.strictEqual(
  bridgedGroups.some(group => group.competition === 'Premier League'),
  false,
  'Premier League should be excluded when bridged via matched_pairs'
);
assert.strictEqual(bridgedGroups.length, 1);
assert.strictEqual(bridgedGroups[0].competition, 'FA Cup');

const sharedMemoryResult = {
  so_no_365: [],
  so_no_flash: [
    { competicao: 'MLS Next Pro', home: 'Team A', away: 'Team B', horario: '20:00' },
  ],
  matched_pairs: [],
};
assert.strictEqual(
  isCompKnownShared('football', 'MLS Next Pro', 'flash', 'USA'),
  true,
  'MLS Next Pro should be known from shared_competitions memory'
);
assert.strictEqual(
  flashOnlyCompetitionGroups(sharedMemoryResult, 'football', 'USA').length,
  0,
  'Known shared competitions should not appear in missing_365 groups'
);

const suppressed = buildTermFixSuppressedKeys([
  {
    country: 'USA',
    sport: 'football',
    result: sharedMemoryResult,
  },
], 'football');
assert.ok(
  suppressed.some(item => item.competition === 'MLS Next Pro'),
  'buildTermFixSuppressedKeys should include shared-memory competitions'
);
assert.strictEqual(
  isCompetitionTermFixSuppressed('football', 'USA', 'MLS Next Pro', 'flash', sharedMemoryResult),
  true
);

console.log('test-terms-missing365: ok');
