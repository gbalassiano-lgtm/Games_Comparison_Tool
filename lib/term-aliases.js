const fs = require('fs');
const path = require('path');
const { canonicalizeRomanNumerals } = require('./youth-markers');

const TERM_ALIASES_FILE = path.join(__dirname, '..', 'config', 'term_aliases.json');

let cache = null;
let lookupIndex = null;

function normAliasKey(text = '') {
  return canonicalizeRomanNumerals(String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\b(w|women|woman)\b/g, '')
    .replace(/\b(fc|cf|sc|ac|ec|se|es|af|rc|sd|ud|rcd|ca|cd|fk|sk|bk|if|hk|nk|ik)\b/g, '')
    .replace(/[:.!?_\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

function splitAliasPair(value = '') {
  const clean = String(value || '').trim();
  if (!clean) return [];
  if (clean.includes(' / ')) return clean.split(' / ').map(part => part.trim()).filter(Boolean);
  if (clean.includes('/')) return clean.split('/').map(part => part.trim()).filter(Boolean);
  return [clean];
}

function addAliasLookup(map, key, entry) {
  if (!key) return;
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(entry);
}

function buildTermAliasLookup(aliases = []) {
  const byKey = new Map();

  for (const alias of aliases) {
    const key365 = normAliasKey(alias.value365 || '');
    const keyFlash = normAliasKey(alias.valueFlash || '');
    addAliasLookup(byKey, key365, { alias, kind: 'full', side: '365' });
    if (keyFlash && keyFlash !== key365) {
      addAliasLookup(byKey, keyFlash, { alias, kind: 'full', side: 'flash' });
    }

    if (alias.type === 'name') {
      const parts365 = splitAliasPair(alias.value365);
      const partsFlash = splitAliasPair(alias.valueFlash);
      const canonicalParts = splitAliasPair(alias.canonical || alias.value365);

      if (parts365.length > 0 && parts365.length === partsFlash.length) {
        for (let i = 0; i < parts365.length; i++) {
          const partKey365 = normAliasKey(parts365[i]);
          const partKeyFlash = normAliasKey(partsFlash[i]);
          const canonical = canonicalParts[i] || parts365[i];
          addAliasLookup(byKey, partKey365, { alias, kind: 'part', index: i, canonical });
          if (partKeyFlash && partKeyFlash !== partKey365) {
            addAliasLookup(byKey, partKeyFlash, { alias, kind: 'part', index: i, canonical });
          }
        }
      }
    }
  }

  return byKey;
}

function loadTermAliases() {
  if (cache) return cache;

  try {
    const raw = JSON.parse(fs.readFileSync(TERM_ALIASES_FILE, 'utf-8'));
    cache = Array.isArray(raw.approved) ? raw.approved : [];
  } catch (_) {
    cache = [];
  }

  lookupIndex = buildTermAliasLookup(cache);
  return cache;
}

function getTermAliasLookup() {
  if (!lookupIndex) loadTermAliases();
  return lookupIndex || new Map();
}

function clearTermAliasesCache() {
  cache = null;
  lookupIndex = null;
}

function aliasMatchesFilters(alias, type = '', sportKey = '') {
  if (type && alias.type && alias.type !== type) return false;
  if (sportKey && alias.sport && alias.sport !== sportKey && alias.sport !== 'all') return false;
  return true;
}

function resolveTermAlias(value = '', type = '', sportKey = '') {
  const key = normAliasKey(value);
  if (!key) return value;

  const hits = getTermAliasLookup().get(key) || [];
  for (const hit of hits) {
    const alias = hit.alias;
    if (!aliasMatchesFilters(alias, type, sportKey)) continue;

    if (hit.kind === 'full') {
      return alias.canonical || alias.value365 || alias.valueFlash || value;
    }

    if (hit.kind === 'part' && (!type || type === 'name') && (!alias.type || alias.type === 'name')) {
      return hit.canonical || value;
    }
  }

  return value;
}

module.exports = {
  loadTermAliases,
  clearTermAliasesCache,
  resolveTermAlias,
  normAliasKey,
  splitAliasPair,
};
