const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
process.chdir(ROOT);

const { clearTermAliasesCache, resolveTermAlias } = require('../lib/term-aliases');
const { flexibleNameSimilarity } = require('../lib/flexible-names');

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

function parseTeamPairLabel(value = '') {
  const clean = String(value || '').trim();
  if (!clean) return [];
  if (clean.includes(' / ')) return clean.split(' / ').map(part => part.trim()).filter(Boolean);
  if (clean.includes('/')) return clean.split('/').map(part => part.trim()).filter(Boolean);
  return [clean];
}

function teamNamesEquivalent(left = '', right = '') {
  if (!left && !right) return true;
  if (!left || !right) return false;
  if (flexibleNameSimilarity(left, right) >= 0.88) return true;
  return diceSimilarity(left.toLowerCase(), right.toLowerCase()) >= 0.85;
}

function gameMatchesTeamPair(game = {}, pairLabel = '') {
  const parts = parseTeamPairLabel(pairLabel);
  if (parts.length < 2) return false;
  const [home, away] = parts;
  const direct = teamNamesEquivalent(game.home || '', home) && teamNamesEquivalent(game.away || '', away);
  const flipped = teamNamesEquivalent(game.home || '', away) && teamNamesEquivalent(game.away || '', home);
  return direct || flipped;
}

function applyApprovedTermMerges(allResults = [], approved = []) {
  for (const row of allResults || []) {
    const result = row.result;
    if (!result) continue;

    const merged365 = new Set();
    const mergedFlash = new Set();
    const newPairs = [];

    for (const alias of approved) {
      if (alias.type !== 'name') continue;
      if (alias.scope && alias.scope.toLowerCase() !== String(row.country || '').toLowerCase()) continue;

      const idx365 = (result.so_no_365 || []).findIndex((game, index) => (
        !merged365.has(index) && gameMatchesTeamPair(game, alias.value365)
      ));
      const idxFlash = (result.so_no_flash || []).findIndex((game, index) => (
        !mergedFlash.has(index) && gameMatchesTeamPair(game, alias.valueFlash)
      ));
      if (idx365 === -1 || idxFlash === -1) continue;

      merged365.add(idx365);
      mergedFlash.add(idxFlash);
      newPairs.push({
        g365: result.so_no_365[idx365],
        gFlash: result.so_no_flash[idxFlash],
      });
    }

    if (!newPairs.length) continue;
    result.so_no_365 = (result.so_no_365 || []).filter((_, index) => !merged365.has(index));
    result.so_no_flash = (result.so_no_flash || []).filter((_, index) => !mergedFlash.has(index));
    result.matched_pairs = result.matched_pairs || [];
    for (const { g365, gFlash } of newPairs) {
      result.matched_pairs.push({ home365: g365.home, away365: g365.away, homeFlash: gFlash.home, awayFlash: gFlash.away });
    }
  }
  return allResults;
}

clearTermAliasesCache();
const aliasResolved = resolveTermAlias('Uni X Labs', 'name', 'football');
assert.strictEqual(aliasResolved, 'Uni Minsk', `expected Uni Minsk alias, got ${aliasResolved}`);

const belarus = [{
  country: 'Belarus',
  result: {
    so_no_365: [{ competicao: 'Pershaya Liga', home: 'Uni Minsk', away: 'Niva Dolbizno', horario: '15:00' }],
    so_no_flash: [{ competicao: 'Pershaya Liga', home: 'Uni X Labs', away: 'Niva Dolbizno', horario: '15:00' }],
    matched_pairs: [],
  },
}];

const approved = [{
  sport: 'football',
  type: 'name',
  scope: 'Belarus',
  value365: 'Uni Minsk / Niva Dolbizno',
  valueFlash: 'Uni X Labs / Niva Dolbizno',
  canonical: 'Uni Minsk / Niva Dolbizno',
}];

applyApprovedTermMerges(belarus, approved);
assert.strictEqual(belarus[0].result.so_no_365.length, 0);
assert.strictEqual(belarus[0].result.so_no_flash.length, 0);
assert.strictEqual(belarus[0].result.matched_pairs.length, 1);

console.log('test-term-alias-merge: ok');
