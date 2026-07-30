/**
 * Football competition popularity priority (top 100).
 * Used to surface popular leagues first in the comparison report / xlsx.
 *
 * Works in Node (compare/server) and in the browser (ui.js via window.FootballPopularity).
 */

const FOOTBALL_SPORT_KEYS = new Set([
  'football',
  'latam_football',
  'israel_football',
]);

const COUNTRY_ALIASES = {
  international: 'world',
  internacional: 'world',
  mundo: 'world',
  europe: 'europe',
  europa: 'europe',
  'south america': 'south america',
  'america do sul': 'south america',
  'north america': 'north america',
  'america do norte': 'north america',
  olympics: 'olympics',
  olimpiadas: 'olympics',
  turkiye: 'turkiye',
  turkey: 'turkiye',
  'united states': 'usa',
  'united states of america': 'usa',
  usa: 'usa',
  eua: 'usa',
  england: 'england',
  'saudi arabia': 'saudi arabia',
  'united arab emirates': 'uae',
  uae: 'uae',
};

let priorityList = null;
let indexes = null;

function loadPriorityListSync() {
  if (priorityList) return priorityList;
  if (typeof require === 'function' && typeof module !== 'undefined') {
    try {
      const path = require('path');
      const data = require(path.join(__dirname, '..', 'config', 'football_popularity_priority.json'));
      setPriorityList(data);
      return priorityList;
    } catch (_) {
      priorityList = [];
      indexes = buildIndexes([]);
      return priorityList;
    }
  }
  priorityList = [];
  indexes = buildIndexes([]);
  return priorityList;
}

function setPriorityList(data) {
  const competitions = Array.isArray(data)
    ? data
    : (Array.isArray(data?.competitions) ? data.competitions : []);
  priorityList = competitions.map((item, index) => ({
    rank: Number(item.rank) || (index + 1),
    id: item.id == null ? null : Number(item.id),
    name: String(item.name || '').trim(),
    country: String(item.country || '').trim(),
    aliases: Array.isArray(item.aliases)
      ? item.aliases.map(a => String(a || '').trim()).filter(Boolean)
      : [],
  })).filter(item => item.name);
  indexes = buildIndexes(priorityList);
  return priorityList;
}

function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[''`´]/g, '')
    .replace(/\bqualifiers\b/g, 'qualification')
    .replace(/[-–—_/.,:;|()[\]{}]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCountry(value = '') {
  let key = normalizeText(value)
    .replace(/^(football|futebol)\s*\/\s*/i, '')
    .replace(/:+$/g, '')
    .trim();
  if (COUNTRY_ALIASES[key]) key = COUNTRY_ALIASES[key];
  return key;
}

function competitionMatchKeys(name = '') {
  const raw = normalizeText(name);
  if (!raw) return [];

  const keys = new Set([raw]);
  const stripped = raw
    .replace(/^(uefa|conmebol|fifa|caf|afc)\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (stripped) keys.add(stripped);

  // Flash often appends stage suffixes: " - Play Offs", " - Qualification"
  const withoutStage = stripped
    .replace(/\s+-\s+(play\s*offs?|qualification|group\s+stage|final|semi finals?|quarter finals?).*$/i, '')
    .replace(/\s+(play\s*offs?)$/i, '')
    .trim();
  if (withoutStage) keys.add(withoutStage);

  return [...keys];
}

function buildIndexes(list) {
  const byCountryAndName = new Map();
  const byName = new Map();

  const add = (map, key, item) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  };

  for (const item of list) {
    const countryKey = normalizeCountry(item.country);
    const names = [item.name, ...(item.aliases || [])];
    for (const name of names) {
      for (const nameKey of competitionMatchKeys(name)) {
        add(byName, nameKey, item);
        add(byCountryAndName, `${countryKey}|||${nameKey}`, item);
      }
    }
  }

  return { byCountryAndName, byName };
}

function ensureIndexes() {
  if (!indexes) loadPriorityListSync();
  return indexes;
}

function isFootballSportKey(sportKey = '') {
  const key = String(sportKey || '').trim().toLowerCase();
  if (FOOTBALL_SPORT_KEYS.has(key)) return true;
  // Multi-sport rows carry the core sport, e.g. sport: "football"
  return key === 'football';
}

function pickBestCandidate(candidates = []) {
  if (!candidates.length) return null;
  let best = candidates[0];
  for (let i = 1; i < candidates.length; i++) {
    if (candidates[i].rank < best.rank) best = candidates[i];
  }
  return best;
}

function uniqueByRank(candidates = []) {
  const seen = new Set();
  const out = [];
  for (const item of candidates) {
    const key = `${item.rank}|${item.id}|${item.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function lookupPriorityEntry({ competition = '', country = '' } = {}) {
  const idx = ensureIndexes();
  if (!idx || !priorityList?.length) return null;

  const countryKey = normalizeCountry(country);
  const nameKeys = competitionMatchKeys(competition);
  if (!nameKeys.length) return null;

  const withCountry = [];
  for (const nameKey of nameKeys) {
    const hits = idx.byCountryAndName.get(`${countryKey}|||${nameKey}`);
    if (hits?.length) withCountry.push(...hits);
  }
  const countryHits = uniqueByRank(withCountry);
  if (countryHits.length) return pickBestCandidate(countryHits);

  // Fall back to unique name-only matches (e.g. LaLiga appears under Spain only once).
  const nameOnly = [];
  for (const nameKey of nameKeys) {
    const hits = idx.byName.get(nameKey);
    if (hits?.length) nameOnly.push(...hits);
  }
  const uniqueNames = uniqueByRank(nameOnly);
  if (uniqueNames.length === 1) return uniqueNames[0];

  // Ambiguous name (Premier League, Super Cup, …) without a country hit → no priority.
  return null;
}

function competitionPopularityRank(competition = '', country = '', sportKey = 'football') {
  if (sportKey && !isFootballSportKey(sportKey)) return Number.POSITIVE_INFINITY;
  const entry = lookupPriorityEntry({ competition, country });
  return entry ? entry.rank : Number.POSITIVE_INFINITY;
}

function reportRowPopularityRank(row = {}, sportKey = '') {
  const sport = sportKey || row.sport || 'football';
  if (!isFootballSportKey(sport)) return Number.POSITIVE_INFINITY;

  const country = row.country || '';
  const names = [
    row.competition365,
    row.competitionFlash,
    row.competition,
    row.competicao,
    row.competicao_365,
    row.competicao_flash,
  ].filter(Boolean);

  let best = Number.POSITIVE_INFINITY;
  for (const name of names) {
    const rank = competitionPopularityRank(name, country, sport);
    if (rank < best) best = rank;
  }
  return best;
}

function compareByFootballPopularity(a, b, getMeta) {
  const metaA = getMeta(a);
  const metaB = getMeta(b);
  const rankA = reportRowPopularityRank(metaA, metaA.sport);
  const rankB = reportRowPopularityRank(metaB, metaB.sport);
  if (rankA !== rankB) return rankA - rankB;
  return 0;
}

function sortByFootballPopularity(items, getMeta) {
  return [...items].sort((a, b) => compareByFootballPopularity(a, b, getMeta));
}

const FootballPopularityAPI = {
  FOOTBALL_SPORT_KEYS,
  setPriorityList,
  loadPriorityListSync,
  normalizeText,
  normalizeCountry,
  isFootballSportKey,
  competitionPopularityRank,
  reportRowPopularityRank,
  compareByFootballPopularity,
  sortByFootballPopularity,
  lookupPriorityEntry,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FootballPopularityAPI;
}

if (typeof window !== 'undefined') {
  window.FootballPopularity = FootballPopularityAPI;
}
