const assert = require('assert');

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

function scores365OnlyCompetitionGroups(result = {}) {
  const only365 = Array.isArray(result?.so_no_365) ? result.so_no_365 : [];
  const onlyFlash = Array.isArray(result?.so_no_flash) ? result.so_no_flash : [];
  if (!only365.length) return [];

  const groups = new Map();
  for (const game of only365) {
    const competition = String(game.competicao || game.competition || '').trim();
    if (!competition) continue;
    if (!groups.has(competition)) {
      groups.set(competition, { competition, count: 0, sampleHome: game.home || '', sampleAway: game.away || '' });
    }
    groups.get(competition).count += 1;
  }

  const compFlashNames = [...new Set(
    onlyFlash
      .map(gameFlash => normalizeCompTerm(gameFlash.competicao || gameFlash.competition || ''))
      .filter(Boolean)
  )];
  const comp365Key = (competition = '') => normalizeCompTerm(competition);

  return [...groups.values()].filter(group => {
    if (!compFlashNames.length) return true;

    const comp365 = comp365Key(group.competition);
    if (!comp365) return true;
    if (compFlashNames.includes(comp365)) return false;

    return !compFlashNames.some(compFlash => (
      compFlash === comp365 || diceSimilarity(compFlash, comp365) >= 0.85
    ));
  });
}

const iceland = {
  so_no_365: [
    { competicao: 'Inkasso Deildin', home: 'Afturelding', away: 'Njardvik', horario: '22:15' },
    { competicao: 'Inkasso Deildin', home: 'Fylkir', away: 'HK Kopavogur', horario: '22:15' },
    { competicao: 'Inkasso Deildin', home: 'Grindavik', away: 'Aegir Thorlakshofn', horario: '22:15' },
    { competicao: 'Inkasso Deildin', home: 'Leiknir Reykjavik', away: 'IR Reykjavik', horario: '22:15' },
  ],
  so_no_flash: [
    { competicao: 'Division 2', home: 'Dalvik/Reynir', away: 'KFA', horario: '17:00' },
  ],
};
const icelandGroups = scores365OnlyCompetitionGroups(iceland);
assert.strictEqual(icelandGroups.length, 1);
assert.strictEqual(icelandGroups[0].competition, 'Inkasso Deildin');
assert.strictEqual(icelandGroups[0].count, 4);

const worldCup = {
  so_no_365: [
    { competicao: 'FIFA World Cup', home: 'Norway', away: 'France', horario: '22:00' },
    { competicao: 'FIFA World Cup', home: 'Senegal', away: 'Iraq', horario: '22:00' },
  ],
  so_no_flash: [],
};
const worldCupGroups = scores365OnlyCompetitionGroups(worldCup);
assert.strictEqual(worldCupGroups.length, 1);
assert.strictEqual(worldCupGroups[0].count, 2);

const pairedComp = {
  so_no_365: [{ competicao: 'Division 2', home: 'A', away: 'B' }],
  so_no_flash: [{ competicao: 'Division 2', home: 'C', away: 'D' }],
};
assert.strictEqual(scores365OnlyCompetitionGroups(pairedComp).length, 0);

console.log('test-terms-missing-flash: ok');
