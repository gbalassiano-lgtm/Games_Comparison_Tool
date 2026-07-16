const fs = require('fs');
const path = require('path');
const { resolveScopeKey } = require('./country-flags');

const CATALOG_FILES = {
  football: 'football_365_competitions.json',
  basketball: 'basketball_365_competitions.json',
  hockey: 'hockey_365_competitions.json',
  tennis: 'tennis_365_competitions.json',
  baseball: 'baseball_365_competitions.json',
  american_football: 'american_football_365_competitions.json',
};

const CATALOG_SCOPE_ALIASES = {
  '*': 'international',
  world: 'international',
  mundial: 'international',
  global: 'international',
  intl: 'international',
  exhibition: 'international',
  'exhibition men': 'international',
  'exhibition women': 'international',
  'exhibition man': 'international',
  'exhibition woman': 'international',
};

function normalizeCompetition(text = '') {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[:.!?_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function catalogScopeKey(scope = '') {
  const key = resolveScopeKey(String(scope || '').replace(/[()]/g, ' '));
  const normalized = CATALOG_SCOPE_ALIASES[key] || key;
  return normalized || 'international';
}

function compactSimilarityText(value = '') {
  return normalizeCompetition(value).replace(/\s+/g, '');
}

function diceSimilarity(left = '', right = '') {
  const a = compactSimilarityText(left);
  const b = compactSimilarityText(right);
  if (!a || !b) return a === b ? 1 : 0;
  if (a === b) return 1;
  if (a.length === 1 || b.length === 1) return a === b ? 1 : 0;

  const counts = new Map();
  for (let i = 0; i < a.length - 1; i++) {
    const gram = a.slice(i, i + 2);
    counts.set(gram, (counts.get(gram) || 0) + 1);
  }

  let shared = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const gram = b.slice(i, i + 2);
    const count = counts.get(gram) || 0;
    if (!count) continue;
    shared += 1;
    counts.set(gram, count - 1);
  }

  return (2 * shared) / (a.length + b.length - 2);
}

const TRACKABLE_FRIENDLY_KEYS = new Set([
  'club friendly',
  'friendly international',
  'club friendlies',
  'international friendlies',
  'amistoso internacional',
  'amistosos internacionais',
  'amistoso de clube',
  'amistosos de clube',
  'amistoso de clubes',
  'amistosos de clubes',
]);

function isTrackableFriendlyCompetition(competition = '') {
  const key = normalizeCompetition(competition);
  if (!key) return false;
  if (TRACKABLE_FRIENDLY_KEYS.has(key)) return true;
  if (key.startsWith('club friendly')) return true;
  if (key.startsWith('friendly international')) return true;
  if (key.startsWith('amistoso internacional')) return true;
  if (key.startsWith('amistoso de clube') || key.startsWith('amistoso de clubes')) return true;
  return false;
}

function resolveCatalogSportKey(sportKey = '') {
  const key = String(sportKey || '').trim();
  if (!key) return null;
  if (key.startsWith('latam_')) return resolveCatalogSportKey(key.slice(6));
  if (key.startsWith('israel_')) return resolveCatalogSportKey(key.slice(7));
  if (key.endsWith('_usa')) return resolveCatalogSportKey(key.slice(0, -4));
  return CATALOG_FILES[key] ? key : null;
}

function matchesCatalogCompetition(catalogRow, competition = '') {
  const competitionKey = normalizeCompetition(competition);
  if (!competitionKey) return false;
  if (catalogRow.competitionKey === competitionKey) return true;
  if (catalogRow.competitionKey.startsWith(`${competitionKey} `) || competitionKey.startsWith(`${catalogRow.competitionKey} `)) {
    return true;
  }
  return diceSimilarity(catalogRow.competition, competition) >= 0.72;
}

function buildCatalogIndex(entries = []) {
  const byScope = new Map();
  for (const entry of entries) {
    const scopeKey = catalogScopeKey(entry.country || '');
    const row = {
      id: String(entry.id ?? ''),
      competition: entry.competition || '',
      country: entry.country || '',
      scopeKey,
      competitionKey: normalizeCompetition(entry.competition || ''),
    };
    if (!row.competitionKey) continue;
    if (!byScope.has(scopeKey)) byScope.set(scopeKey, []);
    byScope.get(scopeKey).push(row);
  }
  return byScope;
}

function competitionInCatalogIndex(catalogIndex, scope = '', competition = '') {
  if (!catalogIndex) return null;
  const scopeKey = catalogScopeKey(scope);
  const rows = catalogIndex.get(scopeKey) || [];
  if (!rows.length) return false;
  return rows.some(row => matchesCatalogCompetition(row, competition));
}

function readCatalogEntries(configDir, sport) {
  const fileName = CATALOG_FILES[sport];
  if (!fileName) return [];
  const filePath = path.join(configDir, fileName);
  if (!fs.existsSync(filePath)) return [];
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return Array.isArray(raw) ? raw : [];
}

class CatalogStore {
  constructor(configDir) {
    this.configDir = configDir;
    this.catalogs = {};
    this.indexes = {};
  }

  load() {
    this.catalogs = {};
    this.indexes = {};
    for (const sport of Object.keys(CATALOG_FILES)) {
      const entries = readCatalogEntries(this.configDir, sport);
      this.catalogs[sport] = entries;
      this.indexes[sport] = buildCatalogIndex(entries);
    }
    return this;
  }

  listCatalogs() {
    return { ...this.catalogs };
  }

  hasCatalog(sportKey) {
    return Boolean(this.indexes[resolveCatalogSportKey(sportKey)]);
  }

  isInCatalog(sportKey, scope = '', competition = '') {
    const sport = resolveCatalogSportKey(sportKey);
    if (!sport) return null;
    return competitionInCatalogIndex(this.indexes[sport], scope, competition);
  }

  isOutsideCatalog(sportKey, scope = '', competition = '') {
    const inCatalog = this.isInCatalog(sportKey, scope, competition);
    if (inCatalog === null) return null;
    return !inCatalog;
  }
}

function resolveCoreSportKey(sportKey = '') {
  const key = String(sportKey || '').trim();
  if (key === 'latam_all' || key === 'israel_all') return key;
  if (key.startsWith('latam_')) return key.slice(6);
  if (key.startsWith('israel_')) return key.slice(7);
  return key;
}

function competitionMatchesPresenceIndex(scopeSet, competition = '') {
  const competitionKey = normalizeCompetition(competition);
  if (!competitionKey || !scopeSet) return false;
  if (scopeSet.has(competitionKey)) return true;

  for (const itemKey of scopeSet) {
    if (itemKey.startsWith(`${competitionKey} `) || competitionKey.startsWith(`${itemKey} `)) return true;
    if (diceSimilarity(itemKey, competitionKey) >= 0.72) return true;
  }

  return false;
}

function buildScan365PresenceIndex(scan, scopeKeyFn = catalogScopeKey) {
  const index = new Map();
  const entries = scan?.result?.countries || [];

  for (const entry of entries) {
    const sport = entry.sport || scan?.sport || '';
    if (!sport || sport === 'all' || sport === 'usa_all' || sport === 'latam_all' || sport === 'israel_all') {
      continue;
    }

    const result = entry.result || {};
    const scopeKey = scopeKeyFn(entry.country || '', sport);

    const addCompetition = (competitionName = '') => {
      const competitionKey = normalizeCompetition(competitionName);
      if (!competitionKey) return;
      if (!index.has(sport)) index.set(sport, new Map());
      const byScope = index.get(sport);
      if (!byScope.has(scopeKey)) byScope.set(scopeKey, new Set());
      byScope.get(scopeKey).add(competitionKey);
    };

    for (const pair of result.matched_pairs || []) addCompetition(pair.competition365);
    for (const game of result.so_no_365 || []) addCompetition(game.competicao || game.competition);
  }

  return index;
}

function competitionInScan365Presence(sport, scope, competition, presenceIndex, scopeKeyFn = catalogScopeKey) {
  const scopeKey = scopeKeyFn(scope, sport);
  const competitionKey = normalizeCompetition(competition);
  if (!competitionKey || !presenceIndex) return false;

  const sportKeys = [sport];
  const coreSport = resolveCoreSportKey(sport);
  if (coreSport && coreSport !== sport) sportKeys.push(coreSport);

  for (const sportKey of sportKeys) {
    const byScope = presenceIndex.get(sportKey);
    if (!byScope) continue;

    const scopeSet = byScope.get(scopeKey);
    if (scopeSet && competitionMatchesPresenceIndex(scopeSet, competition)) return true;
  }

  return false;
}

function competition365CoversLeague(store, sport, scope, competition, scan, presenceIndex = null) {
  if (store.isInCatalog(sport, scope, competition) === true) return true;
  const index = presenceIndex || buildScan365PresenceIndex(scan);
  return competitionInScan365Presence(sport, scope, competition, index);
}

function isCompetitionOutside365Catalog(store, sport, scope, competition, scan, presenceIndex = null) {
  if (isTrackableFriendlyCompetition(competition)) return false;
  if (competition365CoversLeague(store, sport, scope, competition, scan, presenceIndex)) return false;
  if (!store.hasCatalog(sport)) return false;
  return true;
}

module.exports = {
  CATALOG_FILES,
  CatalogStore,
  buildCatalogIndex,
  buildScan365PresenceIndex,
  catalogScopeKey,
  competition365CoversLeague,
  competitionInCatalogIndex,
  competitionInScan365Presence,
  competitionMatchesPresenceIndex,
  diceSimilarity,
  isCompetitionOutside365Catalog,
  isTrackableFriendlyCompetition,
  matchesCatalogCompetition,
  normalizeCompetition,
  readCatalogEntries,
  resolveCatalogSportKey,
  resolveCoreSportKey,
};
