const fs = require('fs');
const path = require('path');
const { canonicalizeRomanNumerals } = require('./youth-markers');

const TERM_ALIASES_FILE = path.join(__dirname, '..', 'config', 'term_aliases.json');

let cache = null;

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

function loadTermAliases() {
  if (cache) return cache;

  try {
    const raw = JSON.parse(fs.readFileSync(TERM_ALIASES_FILE, 'utf-8'));
    cache = Array.isArray(raw.approved) ? raw.approved : [];
  } catch (_) {
    cache = [];
  }

  return cache;
}

function clearTermAliasesCache() {
  cache = null;
}

function resolveTermAlias(value = '', type = '', sportKey = '') {
  const key = normAliasKey(value);
  if (!key) return value;

  for (const alias of loadTermAliases()) {
    if (type && alias.type && alias.type !== type) continue;
    if (sportKey && alias.sport && alias.sport !== sportKey && alias.sport !== 'all') continue;

    const key365 = normAliasKey(alias.value365 || '');
    const keyFlash = normAliasKey(alias.valueFlash || '');
    if (key === key365 || key === keyFlash) {
      return alias.canonical || alias.value365 || alias.valueFlash || value;
    }

    if (alias.type === 'name' && (!type || type === 'name')) {
      const parts365 = splitAliasPair(alias.value365);
      const partsFlash = splitAliasPair(alias.valueFlash);
      const canonicalParts = splitAliasPair(alias.canonical || alias.value365);

      if (parts365.length > 0 && parts365.length === partsFlash.length) {
        for (let i = 0; i < parts365.length; i++) {
          if (key === normAliasKey(parts365[i]) || key === normAliasKey(partsFlash[i])) {
            return canonicalParts[i] || parts365[i];
          }
        }
      }
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
