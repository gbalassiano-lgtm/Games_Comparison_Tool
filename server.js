require('dotenv').config();

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { tomorrowIsoInTimezone, timeDiffMinutes, isTimezoneBoundaryPair, scanTimezoneForSport, todayIsoInTimezone, addDaysIso, DEFAULT_SCAN_TIMEZONE } = require('./lib/scan-timezone');
const asana = require('./lib/asana');
const { startReminderPolling } = require('./lib/asana-reminders');
const { resolveScopeKey } = require('./lib/country-flags');
const { isNormalizedCompPrefixMatch } = require('./lib/competition-prefix');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const RULES_FILE = path.join(ROOT, 'config', 'competition_rules.json');
const TERM_ALIASES_FILE = path.join(ROOT, 'config', 'term_aliases.json');
const COMPETITION_REGISTRY_FILE = path.join(ROOT, 'config', 'competition_registry.json');
const FOOTBALL_365_COMPETITIONS_FILE = path.join(ROOT, 'config', 'football_365_competitions.json');
const { CatalogStore } = require('./lib/365-competition-catalog');
const catalogStore = new CatalogStore(path.join(ROOT, 'config')).load();
const HISTORY_FILE = path.join(ROOT, 'db', 'scan_history.json');

function invalidateCompareRulesCache() {
  try {
    const compare = require('./compare.js');
    if (typeof compare.clearCompetitionRulesCache === 'function') {
      compare.clearCompetitionRulesCache();
    }
  } catch (_) {}
}

// Flash and 365 sometimes name the same competition differently (e.g. Flash
// "Catarinense 2" vs 365 "Catarinense - Serie B"), linked via shared_competitions.json
// and config/term_aliases.json. Rules stored using one side's name must also match the
// other side's name — expand via compare.js's helper so the ignore checks stay in sync.
function expandCompetitionNamesForScope(sportKey = '', competitionName = '') {
  const seed = String(competitionName || '').trim();
  if (!seed) return [];
  try {
    const compare = require('./compare.js');
    if (typeof compare.expandCompetitionNamesForIgnore === 'function') {
      const expanded = compare.expandCompetitionNamesForIgnore(sportKey, seed);
      if (Array.isArray(expanded) && expanded.length) return expanded;
    }
  } catch (_) {}
  return [seed];
}

const BRAND_ASSETS = {
  '/favicon.ico': {
    file: path.join(ROOT, 'brand', 'logo-dark.png'),
    type: 'image/png',
  },
  '/brand/365scores.png': {
    file: path.join(ROOT, 'brand', '365scores.png'),
    type: 'image/png',
  },
  '/brand/flashscore.png': {
    file: path.join(ROOT, 'brand', 'flashscore.png'),
    type: 'image/png',
  },
};

const SPORTS = {
  football: {
    key: 'football',
    label: 'Football',
    scraper365: 'scrapers/365-football.js',
    scraperFlash: 'scrapers/flashscore-football.js',
    output365: path.join(ROOT, 'output', 'football', '365_tomorrow_by_country.json'),
    outputFlash: path.join(ROOT, 'output', 'football', 'flashscore_tomorrow_all_countries.json'),
    xlsx: path.join(ROOT, 'output', 'football', 'comparacao_amanha_futebol.xlsx'),
  },
  basketball: {
    key: 'basketball',
    label: 'Basketball',
    scraper365: 'scrapers/365-basketball.js',
    scraperFlash: 'scrapers/flashscore-basketball.js',
    output365: path.join(ROOT, 'output', 'basketball', '365_tomorrow_basketball_by_country.json'),
    outputFlash: path.join(ROOT, 'output', 'basketball', 'flashscore_tomorrow_basketball_all_countries.json'),
    xlsx: path.join(ROOT, 'output', 'basketball', 'comparacao_amanha_basquete.xlsx'),
  },
  basketball_usa: {
    key: 'basketball_usa',
    label: 'Basketball',
    scraper365: 'scrapers/365-basketball-usa.js',
    scraperFlash: 'scrapers/flashscore-basketball-usa.js',
    output365: path.join(ROOT, 'output', 'basketball_usa', '365_tomorrow_basketball_usa_by_country.json'),
    outputFlash: path.join(ROOT, 'output', 'basketball_usa', 'flashscore_tomorrow_basketball_usa.json'),
    xlsx: path.join(ROOT, 'output', 'basketball_usa', 'comparacao_amanha_basquete_usa.xlsx'),
    usaOnly: true,
  },
  american_football_usa: {
    key: 'american_football_usa',
    label: 'American Football',
    scraper365: 'scrapers/365-american-football-usa.js',
    scraperFlash: 'scrapers/flashscore-american-football-usa.js',
    output365: path.join(ROOT, 'output', 'american_football_usa', '365_tomorrow_american_football_usa_by_country.json'),
    outputFlash: path.join(ROOT, 'output', 'american_football_usa', 'flashscore_tomorrow_american_football_usa.json'),
    xlsx: path.join(ROOT, 'output', 'american_football_usa', 'comparacao_amanha_futebol_americano_usa.xlsx'),
    usaOnly: true,
  },
  baseball_usa: {
    key: 'baseball_usa',
    label: 'Baseball',
    scraper365: 'scrapers/365-baseball-usa.js',
    scraperFlash: 'scrapers/flashscore-baseball-usa.js',
    output365: path.join(ROOT, 'output', 'baseball_usa', '365_tomorrow_baseball_usa_by_country.json'),
    outputFlash: path.join(ROOT, 'output', 'baseball_usa', 'flashscore_tomorrow_baseball_usa.json'),
    xlsx: path.join(ROOT, 'output', 'baseball_usa', 'comparacao_amanha_beisebol_usa.xlsx'),
    usaOnly: true,
  },
  hockey: {
    key: 'hockey',
    label: 'Hockey',
    scraper365: 'scrapers/365-hockey.js',
    scraperFlash: 'scrapers/flashscore-hockey.js',
    output365: path.join(ROOT, 'output', 'hockey', '365_tomorrow_hockey_by_country.json'),
    outputFlash: path.join(ROOT, 'output', 'hockey', 'flashscore_tomorrow_hockey_all_countries.json'),
    xlsx: path.join(ROOT, 'output', 'hockey', 'comparacao_amanha_hockey.xlsx'),
  },
  volleyball: {
    key: 'volleyball',
    label: 'Volleyball',
    scraper365: 'scrapers/365-volleyball.js',
    scraperFlash: 'scrapers/flashscore-volleyball.js',
    output365: path.join(ROOT, 'output', 'volleyball', '365_tomorrow_volleyball_by_country.json'),
    outputFlash: path.join(ROOT, 'output', 'volleyball', 'flashscore_tomorrow_volleyball_all_countries.json'),
    xlsx: path.join(ROOT, 'output', 'volleyball', 'comparacao_amanha_volei.xlsx'),
  },
  tennis: {
    key: 'tennis',
    label: 'Tennis',
    scraper365: 'scrapers/365-tennis.js',
    scraperFlash: 'scrapers/flashscore-tennis.js',
    output365: path.join(ROOT, 'output', 'tennis', '365_tomorrow_tennis_by_country.json'),
    outputFlash: path.join(ROOT, 'output', 'tennis', 'flashscore_tomorrow_tennis_all_countries.json'),
    xlsx: path.join(ROOT, 'output', 'tennis', 'comparacao_amanha_tenis.xlsx'),
  },
};

const USA_SPORT_KEYS = ['american_football_usa', 'baseball_usa', 'basketball_usa'];
const CONTENT_CORE_SPORTS = ['football', 'basketball', 'hockey', 'volleyball', 'tennis'];
const LATAM_CORE_SPORTS = ['football', 'basketball'];
const ISRAEL_CORE_SPORTS = ['football', 'basketball'];

for (const coreKey of LATAM_CORE_SPORTS) {
  const core = SPORTS[coreKey];
  const latamKey = `latam_${coreKey}`;
  SPORTS[latamKey] = {
    key: latamKey,
    label: `LATAM ${core.label}`,
    coreSport: coreKey,
    latamOnly: true,
    scraper365: core.scraper365,
    scraperFlash: core.scraperFlash,
    output365: path.join(ROOT, 'output', 'latam', coreKey, path.basename(core.output365)),
    outputFlash: path.join(ROOT, 'output', 'latam', coreKey, path.basename(core.outputFlash)),
    xlsx: path.join(ROOT, 'output', 'latam', coreKey, `latam_${path.basename(core.xlsx)}`),
  };
}

for (const coreKey of ISRAEL_CORE_SPORTS) {
  const core = SPORTS[coreKey];
  const israelKey = `israel_${coreKey}`;
  SPORTS[israelKey] = {
    key: israelKey,
    label: `Israel ${core.label}`,
    coreSport: coreKey,
    israelOnly: true,
    scraper365: core.scraper365,
    scraperFlash: core.scraperFlash,
    output365: path.join(ROOT, 'output', 'israel', coreKey, path.basename(core.output365)),
    outputFlash: path.join(ROOT, 'output', 'israel', coreKey, path.basename(core.outputFlash)),
    xlsx: path.join(ROOT, 'output', 'israel', coreKey, `israel_${path.basename(core.xlsx)}`),
  };
}

const SCAN_OPTIONS = {
  all: { key: 'all', label: 'All sports' },
  usa_all: { key: 'usa_all', label: 'All USA sports', usaAllOnly: true },
  latam_all: { key: 'latam_all', label: 'All LATAM sports', latamAllOnly: true },
  israel_all: { key: 'israel_all', label: 'All Israel sports', israelAllOnly: true },
  ...Object.fromEntries(
    Object.entries(SPORTS).filter(([, sport]) => !sport.usaOnly && !sport.latamOnly && !sport.israelOnly)
  ),
  ...Object.fromEntries(
    USA_SPORT_KEYS.map(key => [key, SPORTS[key]])
  ),
  ...Object.fromEntries(
    LATAM_CORE_SPORTS.map(key => [`latam_${key}`, SPORTS[`latam_${key}`]])
  ),
  ...Object.fromEntries(
    ISRAEL_CORE_SPORTS.map(key => [`israel_${key}`, SPORTS[`israel_${key}`]])
  ),
};

function getLatamCoreSport(sportKey = '') {
  if (!String(sportKey).startsWith('latam_')) return null;
  const coreKey = sportKey.replace('latam_', '');
  return LATAM_CORE_SPORTS.includes(coreKey) ? coreKey : null;
}

function isLatamSportKey(sportKey = '') {
  return Boolean(getLatamCoreSport(sportKey));
}

function getIsraelCoreSport(sportKey = '') {
  if (!String(sportKey).startsWith('israel_')) return null;
  const coreKey = sportKey.replace('israel_', '');
  return ISRAEL_CORE_SPORTS.includes(coreKey) ? coreKey : null;
}

function isIsraelSportKey(sportKey = '') {
  return Boolean(getIsraelCoreSport(sportKey));
}

function isLatamAllSportKey(sportKey = '') {
  return sportKey === 'latam_all';
}

function isIsraelAllSportKey(sportKey = '') {
  return sportKey === 'israel_all';
}

function isUsaAllSportKey(sportKey = '') {
  return sportKey === 'usa_all';
}

let activeScan = null;
let lastScan = null;
const scanChildren = new Map();

const { stripTeamYouthMarkers, canonicalizeCompYouthMarkers, canonicalizeRomanNumerals, fixturesCategoryCompatible } = require('./lib/youth-markers');
const { normalizeTeamNameCore, flexibleNameSimilarity } = require('./lib/flexible-names');
const { resolveTermAlias, clearTermAliasesCache } = require('./lib/term-aliases');

function normalizeTerm(text = '') {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeTeamTerm(text = '', sportKey = '') {
  const aliased = resolveTermAlias(text, 'name', sportKey);
  return normalizeTeamNameCore(stripTeamYouthMarkers(canonicalizeRomanNumerals(normalizeTerm(aliased))));
}

function namesLikelySame(left = '', right = '') {
  if (!left || !right) return false;
  if (normalizeTeamTerm(left) === normalizeTeamTerm(right)) return true;
  return flexibleNameSimilarity(left, right) >= 0.95;
}

function normalizeCompTerm(text = '', sportKey = '') {
  let value = canonicalizeCompYouthMarkers(canonicalizeRomanNumerals(
    normalizeTerm(resolveTermAlias(text, 'competition', sportKey))
  ));
  value = value
    .replace(/\b(play offs?|playoffs?|play outs?|play out|playoff)\b/g, ' ')
    .replace(/\b\d+(?:st|nd|rd|th)?(?:\s*-\s*|\s+)\d+(?:st|nd|rd|th)?\s+places?\b/g, ' ')
    .replace(/\b\d+(?:st|nd|rd|th)?\s+places?\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (/\b(eurobasket|fiba|centrobasket|afrobasket|americup|asiacup|asia cup)\b/.test(value)) {
    value = value
      .replace(/\b(groups?|grupos?)\s+[a-h]\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  if (/\bk\s*3\b|\bk3\b/.test(value) && value.includes('league')) {
    return 'k league 3';
  }
  return value;
}

function splitNameParts(name = '') {
  const clean = normalizeTeamTerm(name.replace(/\./g, ' '));
  const parts = clean.split(/\s+/).filter(Boolean);
  const words = parts.filter(part => part.length > 1);
  const explicitInitials = parts
    .filter(part => part.length === 1)
    .map(part => part[0])
    .filter(Boolean);
  const allInitials = [...new Set([
    ...explicitInitials,
    ...words.map(word => word[0]).filter(Boolean),
  ])];

  return {
    clean,
    words,
    explicitInitials,
    allInitials,
    first: words[0] || '',
    last: words[words.length - 1] || '',
  };
}

function sameAthleteName(a = '', b = '') {
  const left = splitNameParts(a);
  const right = splitNameParts(b);

  if (!left.clean || !right.clean) return false;
  if (left.clean === right.clean) return true;
  if (left.clean.includes(right.clean) || right.clean.includes(left.clean)) return true;
  if (!left.last || !right.last || left.last !== right.last) return false;

  const leftInitials = new Set(left.allInitials);
  const rightInitials = new Set(right.allInitials);
  const sharedInitial = [...leftInitials].some(ch => rightInitials.has(ch));
  if (!sharedInitial) return false;

  const leftHasFirstName = left.words.length > 1;
  const rightHasFirstName = right.words.length > 1;
  const leftInitialFits = left.explicitInitials.length > 0 && left.explicitInitials.every(ch => rightInitials.has(ch));
  const rightInitialFits = right.explicitInitials.length > 0 && right.explicitInitials.every(ch => leftInitials.has(ch));

  return leftHasFirstName || rightHasFirstName || leftInitialFits || rightInitialFits;
}

function splitPairNames(value = '') {
  const clean = String(value || '').trim();
  if (!clean) return [];
  if (clean.includes(' / ')) return clean.split(' / ').map(part => part.trim()).filter(Boolean);
  if (clean.includes('/')) return clean.split('/').map(part => part.trim()).filter(Boolean);
  if (clean.includes(' & ')) return clean.split(' & ').map(part => part.trim()).filter(Boolean);
  return [clean];
}

function sameAthleteOrPair(a = '', b = '') {
  const left = splitPairNames(a);
  const right = splitPairNames(b);

  if (left.length !== right.length) return false;
  if (left.length === 1) return sameAthleteName(left[0], right[0]);

  const sameOrder = left.every((name, index) => sameAthleteName(name, right[index]));
  const reversed = left.every((name, index) => sameAthleteName(name, right[right.length - 1 - index]));
  return sameOrder || reversed;
}

function termsAreEquivalent(type, value365, valueFlash) {
  if (type === 'missing_365' || type === 'missing_flash') return false;
  if (type === 'name') {
    if (normalizeTeamTerm(value365) === normalizeTeamTerm(valueFlash)) return true;
    if (namesLikelySame(value365, valueFlash)) return true;
    return sameAthleteOrPair(value365, valueFlash);
  }
  if (type === 'competition') {
    const left = normalizeCompTerm(value365);
    const right = normalizeCompTerm(valueFlash);
    if (left === right) return true;
    if (isNormalizedCompPrefixMatch(left, right)) return true;
    if (left.includes(right) || right.includes(left)) return true;
    return diceSimilarity(left, right) >= 0.85;
  }
  if (normalizeTerm(value365) === normalizeTerm(valueFlash)) return true;
  return false;
}

function sanitizeScanTerms(scan) {
  if (!scan || !Array.isArray(scan.terms) || !scan.terms.length) return scan;

  const terms = scan.terms.filter(term =>
    term.type !== 'missing_flash' &&
    !termsAreEquivalent(term.type, term.value365 || '', term.valueFlash || '')
  );

  if (terms.length === scan.terms.length) return scan;
  return { ...scan, terms };
}

function teamNamesEquivalent(left = '', right = '') {
  if (!left && !right) return true;
  if (!left || !right) return false;
  if (normalizeTeamTerm(left) === normalizeTeamTerm(right)) return true;
  if (flexibleNameSimilarity(left, right) >= 0.88) return true;
  if (namesLikelySame(left, right)) return true;
  return diceSimilarity(normalizeTeamTerm(left), normalizeTeamTerm(right)) >= 0.85;
}

function competitorsAreSame(pair = {}) {
  const sameOrderTeams =
    teamNamesEquivalent(pair.home365 || '', pair.homeFlash || '') &&
    teamNamesEquivalent(pair.away365 || '', pair.awayFlash || '');
  const reversedTeams =
    teamNamesEquivalent(pair.home365 || '', pair.awayFlash || '') &&
    teamNamesEquivalent(pair.away365 || '', pair.homeFlash || '');

  if (sameOrderTeams || reversedTeams) return true;

  const sameOrderAthletes =
    sameAthleteOrPair(pair.home365 || '', pair.homeFlash || '') &&
    sameAthleteOrPair(pair.away365 || '', pair.awayFlash || '');
  const reversedAthletes =
    sameAthleteOrPair(pair.home365 || '', pair.awayFlash || '') &&
    sameAthleteOrPair(pair.away365 || '', pair.homeFlash || '');

  return sameOrderAthletes || reversedAthletes;
}

function isClubFriendlyCompetition(pair = {}) {
  const text = [
    pair.competition365,
    pair.competitionFlash,
    pair.competicao_365,
    pair.competicao_flash,
    pair.context,
  ].map(value => String(value || '').toLowerCase()).join(' ');
  return /club\s*friendl|friendl/.test(text);
}

function competitorNamesNeedReview(pair = {}) {
  if (competitorsAreSame(pair)) return false;
  const similarity = Number(pair.teamSimilarity || 0);

  // Flash Club Friendlies often only differ by "(Ger)/(Ned)" (and short local forms).
  // Once the matcher already linked the game with a high score, skip Terms Fix noise.
  if (similarity >= 0.82 && isClubFriendlyCompetition(pair)) return false;

  if (similarity >= 0.78) {
    const homeMatch = teamNamesEquivalent(pair.home365 || '', pair.homeFlash || '') ||
      teamNamesEquivalent(pair.home365 || '', pair.awayFlash || '');
    const awayMatch = teamNamesEquivalent(pair.away365 || '', pair.awayFlash || '') ||
      teamNamesEquivalent(pair.away365 || '', pair.homeFlash || '');
    if (homeMatch && awayMatch) return false;
  }
  return similarity >= 0.45;
}

function compactSimilarityText(value = '') {
  return normalizeTeamTerm(value).replace(/\s+/g, '');
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

function pairNameSimilarity(left = {}, right = {}) {
  const homeScore = Math.max(
    diceSimilarity(left.home, right.home),
    flexibleNameSimilarity(left.home, right.home)
  );
  const awayScore = Math.max(
    diceSimilarity(left.away, right.away),
    flexibleNameSimilarity(left.away, right.away)
  );
  const sameOrder = (homeScore + awayScore) / 2;
  const reversedHome = Math.max(diceSimilarity(left.home, right.away), flexibleNameSimilarity(left.home, right.away));
  const reversedAway = Math.max(diceSimilarity(left.away, right.home), flexibleNameSimilarity(left.away, right.home));
  const reversed = (reversedHome + reversedAway) / 2;
  if (sameOrder >= reversed) {
    return { score: sameOrder, minSide: Math.min(homeScore, awayScore), orientation: 'same' };
  }
  return { score: reversed, minSide: Math.min(reversedHome, reversedAway), orientation: 'reversed' };
}

function parseGameMinutes(value = '') {
  const match = String(value || '').match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function candidateTimeDiff(left = {}, right = {}) {
  const leftTime = left.horario || left.time;
  const rightTime = right.horario || right.time;
  if (isTimezoneBoundaryPair(leftTime, rightTime)) return 0;
  return timeDiffMinutes(leftTime, rightTime);
}

function gamesCategoryCompatible(game365 = {}, gameFlash = {}) {
  const texts365 = [
    game365.home,
    game365.away,
    game365.competicao || game365.competition || '',
  ];
  const textsFlash = [
    gameFlash.home,
    gameFlash.away,
    gameFlash.competicao || gameFlash.competition || '',
  ];
  // Aggregate markers per fixture so "America" in Liga Feminino still pairs
  // with "America W", while men↔women and W↔U23 stay rejected.
  return fixturesCategoryCompatible(texts365, textsFlash);
}

function possibleUnmatchedGameCandidate(game365 = {}, gameFlash = {}) {
  // Reject men's/women's or senior/U23 collisions before fuzzy name scoring.
  if (!gamesCategoryCompatible(game365, gameFlash)) return null;

  // Cheap competition check first — pairNameSimilarity is the heavy cost.
  const competitionSimilarity = diceSimilarity(
    normalizeCompTerm(game365.competicao || game365.competition || ''),
    normalizeCompTerm(gameFlash.competicao || gameFlash.competition || '')
  );
  if (competitionSimilarity < 0.55) return null;

  const timeDelta = candidateTimeDiff(game365, gameFlash);
  const timeIsClose = timeDelta !== null && (
    timeDelta <= 5 ||
    isTimezoneBoundaryPair(game365.horario || game365.time, gameFlash.horario || gameFlash.time)
  );

  if (!timeIsClose && competitionSimilarity < 0.65) return null;

  const teamMeta = pairNameSimilarity(game365, gameFlash);
  const teamSimilarity = teamMeta.score;
  // One shared club/country token is not enough (Atlante↔Atlante W, Colombia↔Colombia U23).
  if (teamMeta.minSide < 0.34) return null;
  const teamIsClose = teamSimilarity >= 0.45;

  if (timeIsClose && teamIsClose) {
    return { timeDelta, teamSimilarity, competitionSimilarity };
  }

  if (competitionSimilarity >= 0.72 && teamSimilarity >= 0.60) {
    return { timeDelta, teamSimilarity, competitionSimilarity };
  }

  return null;
}

function unmatchedGameCandidates(result = {}) {
  const only365 = Array.isArray(result?.so_no_365) ? result.so_no_365 : [];
  const onlyFlash = Array.isArray(result?.so_no_flash) ? result.so_no_flash : [];
  if (!only365.length || !onlyFlash.length) return [];

  const product = only365.length * onlyFlash.length;
  // Small countries: full cartesian is fine after cheap early-exits above.
  if (product <= 12000) {
    const candidates = [];
    for (let i = 0; i < only365.length; i++) {
      for (let j = 0; j < onlyFlash.length; j++) {
        const meta = possibleUnmatchedGameCandidate(only365[i], onlyFlash[j]);
        if (!meta) continue;
        candidates.push({
          game365: only365[i],
          gameFlash: onlyFlash[j],
          index365: i,
          indexFlash: j,
          ...meta,
          score: meta.teamSimilarity * 0.72 + meta.competitionSimilarity * 0.22 + (meta.timeDelta === 0 ? 0.06 : 0),
        });
      }
    }
    const used365 = new Set();
    const usedFlash = new Set();
    return candidates
      .sort((a, b) => b.score - a.score)
      .filter(candidate => {
        if (used365.has(candidate.index365) || usedFlash.has(candidate.indexFlash)) return false;
        used365.add(candidate.index365);
        usedFlash.add(candidate.indexFlash);
        return true;
      });
  }

  // Large scopes: candidate shortlist by time window + competition key (not full O(n×m)).
  const flashByMinute = new Map();
  const flashByComp = new Map();
  const flashNoTime = [];
  for (let j = 0; j < onlyFlash.length; j++) {
    const game = onlyFlash[j];
    const minutes = parseGameMinutes(game.horario || game.time || '');
    if (minutes === null) flashNoTime.push(j);
    else {
      if (!flashByMinute.has(minutes)) flashByMinute.set(minutes, []);
      flashByMinute.get(minutes).push(j);
    }
    const compKey = normalizeCompTerm(game.competicao || game.competition || '');
    if (compKey) {
      if (!flashByComp.has(compKey)) flashByComp.set(compKey, []);
      flashByComp.get(compKey).push(j);
    }
  }

  const candidates = [];
  const windowMinutes = 45;

  for (let i = 0; i < only365.length; i++) {
    const game365 = only365[i];
    const flashIndexes = new Set(flashNoTime);
    const minutes365 = parseGameMinutes(game365.horario || game365.time || '');
    if (minutes365 === null) {
      for (let j = 0; j < onlyFlash.length; j++) flashIndexes.add(j);
    } else {
      for (let delta = -windowMinutes; delta <= windowMinutes; delta += 1) {
        const bucket = flashByMinute.get(minutes365 + delta);
        if (bucket) for (const j of bucket) flashIndexes.add(j);
      }
    }
    const compKey = normalizeCompTerm(game365.competicao || game365.competition || '');
    if (compKey) {
      for (const j of flashByComp.get(compKey) || []) flashIndexes.add(j);
    }

    for (const j of flashIndexes) {
      const meta = possibleUnmatchedGameCandidate(game365, onlyFlash[j]);
      if (!meta) continue;
      candidates.push({
        game365,
        gameFlash: onlyFlash[j],
        index365: i,
        indexFlash: j,
        ...meta,
        score: meta.teamSimilarity * 0.72 + meta.competitionSimilarity * 0.22 + (meta.timeDelta === 0 ? 0.06 : 0),
      });
    }
  }

  const used365 = new Set();
  const usedFlash = new Set();
  return candidates
    .sort((a, b) => b.score - a.score)
    .filter(candidate => {
      if (used365.has(candidate.index365) || usedFlash.has(candidate.indexFlash)) return false;
      used365.add(candidate.index365);
      usedFlash.add(candidate.indexFlash);
      return true;
    });
}

function emptyTermAliasStore() {
  return { approved: [], rejected: [] };
}

function loadTermAliases() {
  const raw = readJsonSafe(TERM_ALIASES_FILE, emptyTermAliasStore());
  return {
    approved: Array.isArray(raw.approved) ? raw.approved : [],
    rejected: Array.isArray(raw.rejected) ? raw.rejected : [],
  };
}

function termDecisionKey(term = {}) {
  return [
    term.sport || '',
    term.type || '',
    term.scope || '',
    normalizeTerm(term.value365 || term.term365 || term.source365 || ''),
    normalizeTerm(term.valueFlash || term.termFlash || term.sourceFlash || ''),
  ].join('|||');
}

function knownTermDecisionKeys() {
  const aliases = loadTermAliases();
  return new Set([...aliases.approved, ...aliases.rejected].map(termDecisionKey));
}

function saveTermDecisions(scan, decisions = {}) {
  const aliases = loadTermAliases();
  const byId = new Map((scan?.terms || []).map(term => [String(term.id), term]));

  for (const [id, decision] of Object.entries(decisions || {})) {
    const term = byId.get(String(id));
    if (!term || !['same', 'different'].includes(decision)) continue;

    const record = {
      sport: term.sport,
      type: term.type,
      scope: term.scope,
      value365: term.value365,
      valueFlash: term.valueFlash,
      canonical: decision === 'same' ? (term.value365 || term.valueFlash) : '',
      decidedAt: new Date().toISOString(),
    };
    const key = termDecisionKey(record);

    aliases.approved = aliases.approved.filter(item => termDecisionKey(item) !== key);
    aliases.rejected = aliases.rejected.filter(item => termDecisionKey(item) !== key);

    if (decision === 'same') aliases.approved.push(record);
    else aliases.rejected.push(record);
  }

  writeJson(TERM_ALIASES_FILE, aliases);
  clearTermAliasesCache();
  return aliases;
}

function parseTeamPairLabel(value = '') {
  const clean = String(value || '').trim();
  if (!clean) return [];
  if (clean.includes(' / ')) return clean.split(' / ').map(part => part.trim()).filter(Boolean);
  if (clean.includes('/')) return clean.split('/').map(part => part.trim()).filter(Boolean);
  return [clean];
}

function gameMatchesTeamPair(game = {}, pairLabel = '') {
  const parts = parseTeamPairLabel(pairLabel);
  if (parts.length < 2) return false;

  const [home, away] = parts;
  const gHome = game.home || '';
  const gAway = game.away || '';
  const direct = teamNamesEquivalent(gHome, home) && teamNamesEquivalent(gAway, away);
  const flipped = teamNamesEquivalent(gHome, away) && teamNamesEquivalent(gAway, home);
  return direct || flipped;
}

function applyApprovedTermMerges(allResults = [], defaultSportKey = '') {
  const approved = (loadTermAliases().approved || []).filter(alias => alias.type === 'name');

  for (const row of allResults || []) {
    const sportKey = row.sport || defaultSportKey;
    const scope = row.country || '';
    const result = row.result;
    if (!result || !approved.length) continue;

    const merged365 = new Set();
    const mergedFlash = new Set();
    const newPairs = [];

    for (const alias of approved) {
      if (alias.sport && alias.sport !== sportKey && alias.sport !== 'all') continue;
      if (alias.scope && normalizeTerm(alias.scope) !== normalizeTerm(scope)) continue;

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
      result.matched_pairs.push({
        competition365: g365.competicao || g365.competition || '',
        competitionFlash: gFlash.competicao || gFlash.competition || '',
        home365: g365.home || '',
        away365: g365.away || '',
        homeFlash: gFlash.home || '',
        awayFlash: gFlash.away || '',
        time365: g365.horario || g365.time || '',
        timeFlash: gFlash.horario || gFlash.time || '',
        status365: g365.status || '',
        statusFlash: gFlash.status || '',
        teamSimilarity: 1,
        competitionSimilarity: diceSimilarity(
          normalizeCompTerm(g365.competicao || g365.competition || ''),
          normalizeCompTerm(gFlash.competicao || gFlash.competition || '')
        ),
        aliasMerged: true,
      });
    }
  }

  return allResults;
}

function enrichCompareResults(allResults = [], defaultSportKey = '') {
  return applyApprovedTermMerges(allResults, defaultSportKey);
}

let historyCache = { mtimeMs: -1, history: null };
let weeklyCollectCache = new Map();

function invalidateHistoryCaches() {
  historyCache = { mtimeMs: -1, history: null };
  weeklyCollectCache = new Map();
}

function loadHistory() {
  const history = readJsonSafe(HISTORY_FILE, []);
  return (Array.isArray(history) ? history : []).map(sanitizeScanTerms);
}

function loadHistoryCached() {
  try {
    const stat = fs.statSync(HISTORY_FILE);
    if (historyCache.history && historyCache.mtimeMs === Number(stat.mtimeMs)) {
      return historyCache.history;
    }
    const history = loadHistory();
    historyCache = { mtimeMs: Number(stat.mtimeMs), history };
    return history;
  } catch (_) {
    return loadHistory();
  }
}

function warmHistoryCache() {
  try {
    loadHistoryCached();
  } catch (_) {
    // Best-effort warm-up for first Weekly open.
  }
}

function scannerGroupForSportKey(sportKey = '') {
  const key = String(sportKey || '');
  if (key === 'usa_all' || key.endsWith('_usa')) return 'usa';
  if (key === 'latam_all' || key.startsWith('latam_')) return 'latam';
  if (key === 'israel_all' || key.startsWith('israel_')) return 'israel';
  return 'content';
}

const WEEKLY_ISSUE_TYPES = new Set(['timeDiff', 'statusDiff', 'onlyFlash', 'only365']);
const WEEKLY_TEAM_GROUPS = new Set(['content', 'usa', 'latam', 'israel']);
const WEEKLY_AGGREGATE_SPORTS = new Set(['all', 'usa_all', 'latam_all', 'israel_all']);

function normalizeWeeklyTeamFilter(team = '') {
  const value = String(team || '').trim().toLowerCase();
  return WEEKLY_TEAM_GROUPS.has(value) ? value : 'content';
}

function isWeeklyConcreteSport(sportKey = '') {
  const key = String(sportKey || '').trim();
  return Boolean(key) && !WEEKLY_AGGREGATE_SPORTS.has(key);
}

function emptyWeeklyIssueCounts() {
  return { total: 0, timeDiff: 0, statusDiff: 0, onlyFlash: 0, only365: 0 };
}

function bumpWeeklyIssueCounts(bucket, type) {
  if (!WEEKLY_ISSUE_TYPES.has(type)) return;
  bucket.total += 1;
  bucket[type] += 1;
}

function weeklyRowCompetition(row = {}) {
  return String(
    row.competition || row.competition365 || row.competitionFlash || '-'
  ).trim() || '-';
}

function weeklyRowCountry(row = {}) {
  return String(row.country || '-').trim() || '-';
}

function weeklyRowSport(row = {}, scanSport = '') {
  const fromRow = String(row.sport || '').trim();
  if (fromRow && fromRow !== 'all') return fromRow;
  const fromScan = String(scanSport || '').trim();
  return fromScan && fromScan !== 'all' ? fromScan : fromRow || fromScan || '';
}

function buildWeeklyIgnoreIndex() {
  const rules = listRules();
  const rulesBySport = new Map();
  for (const [sportKey, sportRules] of Object.entries(rules || {})) {
    const lists = [
      ...(sportRules?.ignoreFlashOnly || []),
      ...(sportRules?.ignore365Only || []),
    ];
    if (lists.length) rulesBySport.set(sportKey, lists);
  }

  let registryIgnored = [];
  try {
    const registry = competitionRegistryView();
    registryIgnored = Object.values(registry.competitions || {}).filter(entry =>
      entry && entry.status === 'ignored' && entry.sport && entry.competition
    );
  } catch (_) {
    registryIgnored = [];
  }

  const registryBySport = new Map();
  for (const entry of registryIgnored) {
    const sportKey = String(entry.sport || '');
    if (!registryBySport.has(sportKey)) registryBySport.set(sportKey, []);
    registryBySport.get(sportKey).push(entry);
  }

  return { rulesBySport, registryBySport };
}

function isWeeklyCompetitionIgnoredWithIndex(sportKey = '', scope = '', competition = '', ignoreIndex = null) {
  if (!sportKey || !competition || competition === '-' || !ignoreIndex) return false;

  const ruleLists = ignoreIndex.rulesBySport.get(sportKey) || [];
  if (ruleLists.some(rule =>
    ruleScopeMatches(rule.scope, scope) &&
    ruleCompetitionMatches(rule.competition, competition)
  )) {
    return true;
  }

  const registryRows = ignoreIndex.registryBySport.get(sportKey) || [];
  return registryRows.some(entry =>
    ruleScopeMatches(entry.scope || '', scope) &&
    ruleCompetitionMatches(entry.competition || '', competition)
  );
}

function weeklyRowIsIgnored(row = {}, sportKey = '', ignoreIndex = null) {
  const scope = weeklyRowCountry(row);
  const baseNames = [
    row.competition,
    row.competition365,
    row.competitionFlash,
  ].map(value => String(value || '').trim()).filter(Boolean);

  if (!baseNames.length) baseNames.push(weeklyRowCompetition(row));

  const names = new Set(baseNames);
  for (const name of baseNames) {
    for (const expanded of expandCompetitionNamesForScope(sportKey, name)) {
      names.add(expanded);
    }
  }

  const index = ignoreIndex || buildWeeklyIgnoreIndex();
  return [...names].some(name => isWeeklyCompetitionIgnoredWithIndex(sportKey, scope, name, index));
}

function sortWeeklyRanking(entries = []) {
  return [...entries].sort((left, right) => {
    if (right.total !== left.total) return right.total - left.total;
    return String(left.name || left.competition || '').localeCompare(
      String(right.name || right.competition || ''),
      'en',
      { sensitivity: 'base' }
    );
  });
}

function normalizeWeeklyIssueFilter(issue = '') {
  const value = String(issue || '').trim();
  if (!value || value === 'all') return 'all';
  return WEEKLY_ISSUE_TYPES.has(value) ? value : 'all';
}

const WEEKLY_ISSUES_LIMIT = 150;
const WEEKLY_EMBEDDED_ISSUES_LIMIT = 100;

function sortWeeklyIssues(issues = []) {
  return [...issues].sort((left, right) => {
    if (left.date !== right.date) return String(right.date).localeCompare(String(left.date));
    if (left.type !== right.type) return String(left.type).localeCompare(String(right.type));
    return `${left.home} ${left.away}`.localeCompare(`${right.home} ${right.away}`, 'en', { sensitivity: 'base' });
  });
}

function buildWeeklyIssuesIndex(latestBySportDate = new Map()) {
  const index = new Map();
  const push = (key, issue) => {
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(issue);
  };

  for (const entry of latestBySportDate.values()) {
    const sport = entry.sport || '';
    for (const row of entry.rows || []) {
      const issue = compactWeeklyIssue(row, { sport, date: entry.date });
      const countryKey = weeklyRowCountry(row).toLowerCase();
      const competitionKey = weeklyRowCompetition(row).toLowerCase();
      push(`${sport}|country|${countryKey}`, issue);
      push(`${sport}|league|${countryKey}|${competitionKey}`, issue);
    }
  }

  for (const [key, issues] of index) {
    index.set(key, sortWeeklyIssues(issues));
  }
  return index;
}

function attachEmbeddedWeeklyIssues(entry = {}) {
  const issues = entry._issues || [];
  const total = issues.length;
  const limit = WEEKLY_EMBEDDED_ISSUES_LIMIT;
  const truncated = total > limit;
  const { _issues, ...rest } = entry;
  return {
    ...rest,
    issues: truncated ? issues.slice(0, limit) : issues,
    issuesTotal: total,
    issuesTruncated: truncated,
  };
}

const WEEKLY_MAX_DAYS = 7;

function isWeeklyIsoDate(value = '') {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim());
}

function shiftWeeklyIsoDate(isoDate = '', deltaDays = 0) {
  const date = new Date(`${String(isoDate).trim()}T12:00:00`);
  date.setDate(date.getDate() + Number(deltaDays || 0));
  return formatLocalDate(date);
}

function weeklyInclusiveDaySpan(fromDate = '', toDate = '') {
  const fromMs = new Date(`${fromDate}T12:00:00`).getTime();
  const toMs = new Date(`${toDate}T12:00:00`).getTime();
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return 1;
  return Math.max(1, Math.floor((toMs - fromMs) / 86400000) + 1);
}

function weeklyAnalysisWindow({ days = 7, from = '', to = '' } = {}) {
  const today = formatLocalDate(new Date());
  // Content Team usually scans tomorrow's slate — default window ends there.
  const defaultTo = shiftWeeklyIsoDate(today, 1);
  let toDate = isWeeklyIsoDate(to) ? String(to).trim() : defaultTo;
  let fromDate = isWeeklyIsoDate(from) ? String(from).trim() : '';

  if (!fromDate) {
    const windowDays = Math.min(WEEKLY_MAX_DAYS, Math.max(1, Number(days) || WEEKLY_MAX_DAYS));
    fromDate = shiftWeeklyIsoDate(toDate, -(windowDays - 1));
  }

  if (fromDate > toDate) {
    const swap = fromDate;
    fromDate = toDate;
    toDate = swap;
  }

  // Hard cap: analysis window cannot exceed one week (inclusive).
  if (weeklyInclusiveDaySpan(fromDate, toDate) > WEEKLY_MAX_DAYS) {
    fromDate = shiftWeeklyIsoDate(toDate, -(WEEKLY_MAX_DAYS - 1));
  }

  return {
    windowDays: weeklyInclusiveDaySpan(fromDate, toDate),
    fromDate,
    toDate,
    maxDays: WEEKLY_MAX_DAYS,
  };
}

function daysInMonth(year, month) {
  // Day 0 of the next month rolls back to the last day of the requested month.
  return new Date(year, month, 0).getDate();
}

// Monthly windows are not capped like weekly ones — they always span the full
// calendar month (or up to "tomorrow" for the current month, matching the
// weekly "scan tomorrow's slate" bias). Future months are clamped to the
// current month so users cannot request data that cannot exist yet.
function monthlyAnalysisWindow({ year = '', month = '' } = {}) {
  const today = new Date();
  const todayIso = formatLocalDate(today);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  let y = Number.parseInt(year, 10);
  let m = Number.parseInt(month, 10);
  if (!Number.isFinite(y) || y < 2000 || y > 3000) y = currentYear;
  if (!Number.isFinite(m) || m < 1 || m > 12) m = currentMonth;

  if (y > currentYear || (y === currentYear && m > currentMonth)) {
    y = currentYear;
    m = currentMonth;
  }

  const pad = (n) => String(n).padStart(2, '0');
  const fromDate = `${y}-${pad(m)}-01`;
  const lastDay = daysInMonth(y, m);
  let toDate = `${y}-${pad(m)}-${pad(lastDay)}`;

  const isCurrentMonth = y === currentYear && m === currentMonth;
  if (isCurrentMonth) {
    const tomorrow = shiftWeeklyIsoDate(todayIso, 1);
    if (tomorrow >= fromDate && tomorrow < toDate) toDate = tomorrow;
  }

  return {
    windowDays: weeklyInclusiveDaySpan(fromDate, toDate),
    fromDate,
    toDate,
    year: y,
    month: m,
    maxDays: null,
  };
}

function normalizeWeeklyReportMode(mode = '') {
  return String(mode || '').trim().toLowerCase() === 'monthly' ? 'monthly' : 'weekly';
}

function resolveAnalysisWindow({ mode = 'weekly', days = 7, from = '', to = '', year = '', month = '' } = {}) {
  const resolvedMode = normalizeWeeklyReportMode(mode);
  if (resolvedMode === 'monthly') {
    const monthly = monthlyAnalysisWindow({ year, month });
    return { ...monthly, mode: 'monthly' };
  }
  const weekly = weeklyAnalysisWindow({ days, from, to });
  return { ...weekly, mode: 'weekly', year: null, month: null };
}

const WEEKLY_COLLECT_TTL_MS = 60_000;

function shouldReplaceWeeklySnapshot(prev, next) {
  if (!prev) return true;
  if (next.stamp > prev.stamp) return true;
  if (next.stamp === prev.stamp && next.dedicated && !prev.dedicated) return true;
  return false;
}

function collectWeeklyLatestBySportDate({ days = 7, from = '', to = '', sport = '', issue = '', team = '', mode = 'weekly', year = '', month = '' } = {}) {
  const {
    windowDays,
    fromDate,
    toDate,
    maxDays,
    mode: resolvedMode,
    year: resolvedYear,
    month: resolvedMonth,
  } = resolveAnalysisWindow({ mode, days, from, to, year, month });
  const teamFilter = normalizeWeeklyTeamFilter(team);
  const sportFilter = String(sport || '').trim();
  const issueFilter = normalizeWeeklyIssueFilter(issue);
  const cacheKey = `${resolvedMode}|${fromDate}|${toDate}|${teamFilter}|${sportFilter || 'all'}|${issueFilter}`;
  const cached = weeklyCollectCache.get(cacheKey);
  if (cached && (Date.now() - cached.at) < WEEKLY_COLLECT_TTL_MS) {
    return cached.result;
  }

  const history = loadHistoryCached();
  const ignoreIndex = buildWeeklyIgnoreIndex();
  const candidates = history.filter(scan => {
    if (!scan || scan.status !== 'completed' || !scan.result) return false;
    if (scannerGroupForSportKey(scan.sport) !== teamFilter) return false;
    const scanDate = String(scan.date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scanDate)) return false;
    return scanDate >= fromDate && scanDate <= toDate;
  });

  // One snapshot per team sport + game date.
  // Prefer the newest finalize stamp so a later "all" rescan can replace a stale
  // dedicated sport scan after matcher fixes. Dedicated wins only on equal stamps.
  const latestBySportDate = new Map();
  for (const scan of candidates) {
    const stamp = `${String(scan.finalizedAt || scan.finishedAt || '')}|${scan.id}`;
    const rowsBySport = new Map();

    for (const row of scan.result?.details?.problematic || []) {
      if (!WEEKLY_ISSUE_TYPES.has(row?.type)) continue;
      if (issueFilter !== 'all' && row.type !== issueFilter) continue;
      const rowSport = weeklyRowSport(row, scan.sport);
      if (!isWeeklyConcreteSport(rowSport)) continue;
      if (scannerGroupForSportKey(rowSport) !== teamFilter) continue;
      if (sportFilter && sportFilter !== 'all' && rowSport !== sportFilter) continue;
      if (weeklyRowIsIgnored(row, rowSport, ignoreIndex)) continue;
      if (!rowsBySport.has(rowSport)) rowsBySport.set(rowSport, []);
      rowsBySport.get(rowSport).push(row);
    }

    for (const [rowSport, rows] of rowsBySport) {
      const key = `${rowSport}|${scan.date}`;
      const dedicated = scan.sport === rowSport;
      const next = {
        stamp,
        dedicated,
        rows,
        scanId: scan.id,
        date: String(scan.date || ''),
        sport: rowSport,
      };
      const prev = latestBySportDate.get(key);
      if (shouldReplaceWeeklySnapshot(prev, next)) {
        latestBySportDate.set(key, next);
      }
    }
  }

  const result = {
    windowDays,
    fromDate,
    toDate,
    maxDays,
    mode: resolvedMode,
    year: resolvedYear,
    month: resolvedMonth,
    teamFilter,
    sportFilter: sportFilter || 'all',
    issueFilter,
    latestBySportDate,
    issuesIndex: buildWeeklyIssuesIndex(latestBySportDate),
  };
  weeklyCollectCache.set(cacheKey, { at: Date.now(), result });
  return result;
}

function compactWeeklyIssue(row = {}, meta = {}) {
  return {
    type: row.type || '',
    sport: meta.sport || row.sport || '',
    date: meta.date || '',
    country: weeklyRowCountry(row),
    competition: weeklyRowCompetition(row),
    home: String(row.home || row.home365 || row.homeFlash || '').trim(),
    away: String(row.away || row.away365 || row.awayFlash || '').trim(),
    time: String(row.time || '').trim(),
    time365: String(row.time365 || '').trim(),
    timeFlash: String(row.timeFlash || '').trim(),
    status: String(row.status || '').trim(),
    status365: String(row.status365 || '').trim(),
    statusFlash: String(row.statusFlash || '').trim(),
  };
}

function buildWeeklyAnalysis({ days = 7, from = '', to = '', sport = '', issue = '', team = '', mode = 'weekly', year = '', month = '' } = {}) {
  const {
    windowDays,
    fromDate,
    toDate,
    maxDays,
    mode: resolvedMode,
    year: resolvedYear,
    month: resolvedMonth,
    teamFilter,
    sportFilter,
    issueFilter,
    latestBySportDate,
  } = collectWeeklyLatestBySportDate({ days, from, to, sport, issue, team, mode, year, month });

  const bySport = new Map();
  const ensureSport = (sportKey) => {
    if (!bySport.has(sportKey)) {
      bySport.set(sportKey, {
        sport: sportKey,
        label: SCAN_OPTIONS[sportKey]?.label || sportKey,
        totals: emptyWeeklyIssueCounts(),
        countries: new Map(),
        leagues: new Map(),
        scanIds: new Set(),
      });
    }
    return bySport.get(sportKey);
  };

  for (const [key, entry] of latestBySportDate) {
    const rowSport = entry.sport || key.split('|')[0];
    const bucket = ensureSport(rowSport);
    bucket.scanIds.add(entry.scanId);

    for (const row of entry.rows) {
      bumpWeeklyIssueCounts(bucket.totals, row.type);

      const country = weeklyRowCountry(row);
      const countryKey = country.toLowerCase();
      if (!bucket.countries.has(countryKey)) {
        bucket.countries.set(countryKey, {
          name: country,
          ...emptyWeeklyIssueCounts(),
          _issues: [],
        });
      }
      bumpWeeklyIssueCounts(bucket.countries.get(countryKey), row.type);
      bucket.countries.get(countryKey)._issues.push(
        compactWeeklyIssue(row, { sport: rowSport, date: entry.date })
      );

      const competition = weeklyRowCompetition(row);
      const leagueKey = `${countryKey}|||${competition.toLowerCase()}`;
      if (!bucket.leagues.has(leagueKey)) {
        bucket.leagues.set(leagueKey, {
          country,
          competition,
          ...emptyWeeklyIssueCounts(),
          _issues: [],
        });
      }
      bumpWeeklyIssueCounts(bucket.leagues.get(leagueKey), row.type);
      bucket.leagues.get(leagueKey)._issues.push(
        compactWeeklyIssue(row, { sport: rowSport, date: entry.date })
      );
    }
  }

  const sports = [...bySport.values()]
    .map(entry => ({
      sport: entry.sport,
      label: entry.label,
      scanCount: entry.scanIds.size,
      totals: entry.totals,
      countries: sortWeeklyRanking([...entry.countries.values()])
        .slice(0, 20)
        .map(attachEmbeddedWeeklyIssues),
      leagues: sortWeeklyRanking([...entry.leagues.values()])
        .slice(0, 20)
        .map(attachEmbeddedWeeklyIssues),
    }))
    .sort((left, right) => {
      if (right.totals.total !== left.totals.total) return right.totals.total - left.totals.total;
      return String(left.label).localeCompare(String(right.label), 'en', { sensitivity: 'base' });
    });

  const totals = sports.reduce((acc, entry) => {
    acc.total += entry.totals.total;
    acc.timeDiff += entry.totals.timeDiff;
    acc.statusDiff += entry.totals.statusDiff;
    acc.onlyFlash += entry.totals.onlyFlash;
    acc.only365 += entry.totals.only365;
    return acc;
  }, emptyWeeklyIssueCounts());

  return {
    from: fromDate,
    to: toDate,
    days: windowDays,
    maxDays,
    mode: resolvedMode,
    year: resolvedYear,
    month: resolvedMonth,
    team: teamFilter,
    sport: sportFilter || 'all',
    issue: issueFilter,
    scannerGroup: teamFilter,
    scanCount: latestBySportDate.size,
    issueTypes: [...WEEKLY_ISSUE_TYPES],
    totals,
    sports,
  };
}

function buildWeeklyAnalysisIssues({
  days = 7,
  from = '',
  to = '',
  sport = '',
  issue = '',
  team = '',
  mode = 'weekly',
  year = '',
  month = '',
  country = '',
  competition = '',
  limit = WEEKLY_ISSUES_LIMIT,
} = {}) {
  const countryFilter = String(country || '').trim();
  if (!countryFilter) {
    throw new Error('country is required');
  }

  const competitionFilter = String(competition || '').trim();
  const countryKey = countryFilter.toLowerCase();
  const competitionKey = competitionFilter.toLowerCase();
  const maxIssues = Math.min(500, Math.max(1, Number(limit) || WEEKLY_ISSUES_LIMIT));

  const {
    windowDays,
    fromDate,
    toDate,
    maxDays,
    mode: resolvedMode,
    year: resolvedYear,
    month: resolvedMonth,
    teamFilter,
    sportFilter,
    issueFilter,
    latestBySportDate,
    issuesIndex,
  } = collectWeeklyLatestBySportDate({ days, from, to, sport, issue, team, mode, year, month });

  const resolvedSport = sportFilter && sportFilter !== 'all' ? sportFilter : '';

  if (resolvedSport && issuesIndex) {
    const indexKey = competitionFilter
      ? `${resolvedSport}|league|${countryKey}|${competitionKey}`
      : `${resolvedSport}|country|${countryKey}`;
    const indexed = issuesIndex.get(indexKey) || [];
    const total = indexed.length;
    const truncated = total > maxIssues;
    return {
      from: fromDate,
      to: toDate,
      days: windowDays,
      maxDays,
      mode: resolvedMode,
      year: resolvedYear,
      month: resolvedMonth,
      team: teamFilter,
      sport: sportFilter || 'all',
      issue: issueFilter,
      country: countryFilter,
      competition: competitionFilter || '',
      total,
      truncated,
      limit: maxIssues,
      issues: truncated ? indexed.slice(0, maxIssues) : indexed,
    };
  }

  const issues = [];
  for (const entry of latestBySportDate.values()) {
    if (sportFilter && sportFilter !== 'all' && entry.sport !== sportFilter) continue;
    for (const row of entry.rows) {
      if (weeklyRowCountry(row).toLowerCase() !== countryKey) continue;
      if (competitionFilter && weeklyRowCompetition(row).toLowerCase() !== competitionKey) continue;
      issues.push(compactWeeklyIssue(row, { sport: entry.sport, date: entry.date }));
    }
  }

  issues.sort(sortWeeklyIssues);
  const total = issues.length;
  const truncated = total > maxIssues;

  return {
    from: fromDate,
    to: toDate,
    days: windowDays,
    maxDays,
    mode: resolvedMode,
    year: resolvedYear,
    month: resolvedMonth,
    team: teamFilter,
    sport: sportFilter || 'all',
    issue: issueFilter,
    country: countryFilter,
    competition: competitionFilter || '',
    total,
    truncated,
    limit: maxIssues,
    issues: truncated ? issues.slice(0, maxIssues) : issues,
  };
}

function scanHistoryName(scan) {
  if (!scan?.date || !scan?.sport) return String(scan?.id || Date.now());
  const sport = scan.sport === 'all'
    ? 'Allsports'
    : scan.sport === 'usa_all'
      ? 'Usa_all'
      : scan.sport === 'latam_all'
        ? 'Latam_all'
        : scan.sport === 'israel_all'
          ? 'Israel_all'
          : scan.sport;
  return `${String(scan.date).replace(/-/g, '_')}_${sport}`;
}

function saveScanHistory(scan) {
  const startedAt = Date.now();
  const history = loadHistoryCached();
  const record = sanitizeScanTerms({
    ...scan,
    historyName: scan.historyName || scanHistoryName(scan),
    logs: (scan.logs || []).slice(-120),
  });
  const next = [record, ...history.filter(item => item.id !== record.id)].slice(0, 100);
  // Compact JSON: history can be multi-MB; pretty-print dominated finalize latency.
  writeJson(HISTORY_FILE, next, { pretty: false });
  invalidateHistoryCaches();
  historyCache = {
    mtimeMs: (() => {
      try { return Number(fs.statSync(HISTORY_FILE).mtimeMs); } catch (_) { return Date.now(); }
    })(),
    history: next,
  };
  if (scan?.logs) {
    appendLog(scan, `History saved in ${Date.now() - startedAt}ms`);
  }
  return next;
}

function renameHistoryRecord(id, historyName) {
  const cleanName = String(historyName || '').trim();
  if (!cleanName) throw new Error('History name is required.');

  const history = loadHistory();
  const index = history.findIndex(item => Number(item.id) === Number(id));
  if (index === -1) throw new Error('History record was not found.');

  history[index] = {
    ...history[index],
    historyName: cleanName,
    renamedAt: new Date().toISOString(),
  };

  if (lastScan?.id === history[index].id) lastScan = history[index];
  writeJson(HISTORY_FILE, history, { pretty: false });
  invalidateHistoryCaches();
  return history;
}

function deleteHistoryRecord(id) {
  const history = loadHistory();
  const next = history.filter(item => Number(item.id) !== Number(id));
  if (next.length === history.length) throw new Error('History record was not found.');

  if (lastScan?.id === Number(id)) lastScan = next[0] || null;
  writeJson(HISTORY_FILE, next, { pretty: false });
  invalidateHistoryCaches();
  return next;
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1_000_000) reject(new Error('Request body too large'));
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
  });
}

function readJsonSafe(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (_) {
    return fallback;
  }
}

function sleepSync(ms) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {}
}

function writeJson(file, data, options = {}) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const pretty = options.pretty !== false;
  const payload = pretty ? `${JSON.stringify(data, null, 2)}\n` : `${JSON.stringify(data)}\n`;
  const tempFile = path.join(dir, `.${path.basename(file)}.${process.pid}.${Date.now()}.tmp`);
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      fs.writeFileSync(tempFile, payload, 'utf-8');
      if (process.platform === 'win32' && fs.existsSync(file)) {
        const backup = `${file}.bak`;
        try {
          if (fs.existsSync(backup)) fs.unlinkSync(backup);
        } catch {}
        fs.renameSync(file, backup);
        try {
          fs.renameSync(tempFile, file);
          try {
            fs.unlinkSync(backup);
          } catch {}
        } catch (error) {
          try {
            fs.renameSync(backup, file);
          } catch {}
          throw error;
        }
      } else {
        fs.renameSync(tempFile, file);
      }
      return;
    } catch (error) {
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch {}
      if (attempt === maxAttempts) {
        throw new Error(`Failed to save ${path.basename(file)}: ${error.message}`);
      }
      sleepSync(40 * attempt);
    }
  }
}

function countGames(nested) {
  if (Array.isArray(nested) && nested.every(item => item && typeof item === 'object' && 'home' in item && 'away' in item)) {
    return nested.length;
  }

  return (Array.isArray(nested) ? nested : []).reduce((sum, scope) => (
    sum + (scope.competitions || []).reduce((inner, comp) => inner + (comp.matches?.length || 0), 0)
  ), 0);
}

function summarizeResults(raw365, rawFlash, allResults) {
  const summary = allResults.reduce((acc, row) => {
    const result = row.result || {};
    acc.matched += result.matched_pairs?.length || 0;
    acc.only365 += result.so_no_365?.length || 0;
    acc.onlyFlash += result.so_no_flash?.length || 0;
    acc.timeDiff += result.divergencias_horario?.length || 0;
    acc.statusDiff += result.divergencias_status?.length || 0;
    acc.nameDiff += result.divergencias_nome?.length || 0;
    return acc;
  }, {
    total365: 0,
    totalFlash: 0,
    matched: 0,
    only365: 0,
    onlyFlash: 0,
    timeDiff: 0,
    statusDiff: 0,
    nameDiff: 0,
  });

  summary.total365 = countGames(raw365);
  summary.totalFlash = countGames(rawFlash);
  return summary;
}

function prefixDetailRows(details, sport) {
  const prefixRow = row => ({
    ...row,
    country: row.country || '-',
    sport: sport.key,
    sportLabel: sport.label,
  });

  return {
    problematic: (details.problematic || []).map(prefixRow),
    matched: (details.matched || []).map(prefixRow),
  };
}

function compareSnapshotPath(sportKey) {
  return path.join(ROOT, 'output', sportKey, 'compare_snapshot.json');
}

function writeCompareSnapshot(sportKey, allResults, targetDate = '') {
  const stamp = String(targetDate || process.env.TARGET_DATE || process.env.SCAN_DATE || '').trim();
  const payload = {
    targetDate: /^\d{4}-\d{2}-\d{2}$/.test(stamp) ? stamp : '',
    savedAt: new Date().toISOString(),
    results: Array.isArray(allResults) ? allResults : [],
  };
  fs.writeFileSync(compareSnapshotPath(sportKey), JSON.stringify(payload));
  return payload;
}

function loadCompareSnapshot(sportKey, expectedDate = '') {
  const snapshot = readJsonSafe(compareSnapshotPath(sportKey), null);
  const expected = String(expectedDate || '').trim();

  // Legacy bare-array snapshots have no targetDate stamp. When the caller knows the
  // scan date, refuse them so we never reuse a compare that filtered the wrong day
  // (e.g. "all" summary falling back to tomorrow while scrapers used the scan date).
  if (Array.isArray(snapshot)) {
    if (expected) return null;
    return snapshot;
  }

  if (!snapshot || typeof snapshot !== 'object' || !Array.isArray(snapshot.results)) {
    return null;
  }

  const stamped = String(snapshot.targetDate || '').trim();
  if (expected) {
    if (!stamped || stamped !== expected) return null;
  }

  return snapshot.results;
}

function clearCompareSnapshot(sportKey) {
  try {
    fs.unlinkSync(compareSnapshotPath(sportKey));
  } catch {}
}

async function getCompareResultsForSport(sportKey, scan = null) {
  return withSportTimezone(sportKey, async () => {
    const previousTargetDate = process.env.TARGET_DATE;
    const previousScanDate = process.env.SCAN_DATE;
    const scanDate = String(scan?.date || '').trim();
    if (scanDate) {
      process.env.TARGET_DATE = scanDate;
      process.env.SCAN_DATE = scanDate;
    }

    // Keep compare.js warm — full reload was one of the largest UI compare costs.
    // Rules / aliases are cleared so edits to those files still take effect.
    clearTermAliasesCache();
    try {
      const { clearCompetitionRulesCache } = require('./compare.js');
      if (typeof clearCompetitionRulesCache === 'function') clearCompetitionRulesCache();
    } catch (_) {
      // Module not loaded yet; first require below is enough.
    }
    const { runCompare } = require('./compare.js');

    const originalLog = console.log;
    const originalError = console.error;
    console.log = (...args) => {
      const msg = args.map(value => (typeof value === 'string' ? value : String(value))).join(' ');
      if (scan?.logs) appendLog(scan, msg);
      originalLog(...args);
    };
    console.error = (...args) => {
      const msg = args.map(value => (typeof value === 'string' ? value : String(value))).join(' ');
      if (scan?.logs) appendLog(scan, msg);
      originalError(...args);
    };

    let heartbeat = null;
    if (scan?.logs) {
      heartbeat = setInterval(() => {
        if (!scan.cancelRequested) appendLog(scan, '⏳ Comparison still running...');
      }, 5000);
    }

    try {
      if (scanDate && scan?.logs) {
        appendLog(scan, `Compare target date: ${scanDate}`);
      }
      const result = await runCompare(sportKey, null, { skipTelegram: true, skipXlsx: true });
      if (scanDate) {
        writeCompareSnapshot(sportKey, result, scanDate);
      }
      if (scan?.logs) appendLog(scan, '✅ Comparison finished');
      return enrichCompareResults(result, sportKey);
    } finally {
      if (heartbeat) clearInterval(heartbeat);
      console.log = originalLog;
      console.error = originalError;
      if (scanDate) {
        if (previousTargetDate === undefined) delete process.env.TARGET_DATE;
        else process.env.TARGET_DATE = previousTargetDate;
        if (previousScanDate === undefined) delete process.env.SCAN_DATE;
        else process.env.SCAN_DATE = previousScanDate;
      }
    }
  });
}

async function buildAllSportsSummary(options = {}) {
  const allDetails = { problematic: [], matched: [] };
  const countries = [];
  const sports = [];
  const scan = options.scan || null;
  const scanDate = String(scan?.date || options.targetDate || process.env.TARGET_DATE || process.env.SCAN_DATE || '').trim();
  const forceSportKeys = Array.isArray(options.forceRecompareSports)
    ? new Set(options.forceRecompareSports.map(String))
    : null;
  const forceAll = Boolean(options.forceRecompare) && !forceSportKeys;

  for (const sport of Object.values(SPORTS)) {
    if (sport.usaOnly || sport.latamOnly || sport.israelOnly) continue;
    const raw365 = readJsonSafe(sport.output365, []);
    const rawFlash = readJsonSafe(sport.outputFlash, []);
    const files = {
      json365: path.relative(ROOT, sport.output365),
      jsonFlash: path.relative(ROOT, sport.outputFlash),
      xlsx: path.relative(ROOT, sport.xlsx),
    };

    try {
      const mustRecompare = forceAll || (forceSportKeys && forceSportKeys.has(sport.key));
      const snapshot = !mustRecompare && loadCompareSnapshot(sport.key, scanDate);
      const allResults = snapshot
        ? enrichCompareResults(snapshot, sport.key)
        : await getCompareResultsForSport(sport.key, scan || (scanDate ? { date: scanDate } : null));
      const summary = summarizeResults(raw365, rawFlash, allResults);
      const details = prefixDetailRows(buildDetails(allResults, sport.key), sport);

      allDetails.problematic.push(...details.problematic);
      allDetails.matched.push(...details.matched);
      countries.push(...allResults.map(row => ({
        ...row,
        country: row.country || '-',
        sport: sport.key,
      })));

      sports.push({
        sport: sport.key,
        label: sport.label,
        ...summary,
        files,
        status: 'completed',
      });
    } catch (e) {
      sports.push({
        sport: sport.key,
        label: sport.label,
        total365: countGames(raw365),
        totalFlash: countGames(rawFlash),
        matched: 0,
        only365: 0,
        onlyFlash: 0,
        timeDiff: 0,
        statusDiff: 0,
        nameDiff: 0,
        files,
        status: 'failed',
        error: e.message,
      });
    }
  }

  return {
    summary: sports.reduce((acc, row) => {
      acc.total365 += row.total365;
      acc.totalFlash += row.totalFlash;
      acc.matched += row.matched;
      acc.only365 += row.only365;
      acc.onlyFlash += row.onlyFlash;
      acc.timeDiff += row.timeDiff;
      acc.statusDiff += row.statusDiff;
      acc.nameDiff += row.nameDiff;
      return acc;
    }, { total365: 0, totalFlash: 0, matched: 0, only365: 0, onlyFlash: 0, timeDiff: 0, statusDiff: 0, nameDiff: 0 }),
    sports,
    details: allDetails,
    countries,
    files: {},
  };
}

async function buildUsaAllSummary() {
  const allDetails = { problematic: [], matched: [] };
  const countries = [];
  const sports = [];

  for (const sportKey of USA_SPORT_KEYS) {
    const sport = SPORTS[sportKey];
    const raw365 = readJsonSafe(sport.output365, []);
    const rawFlash = readJsonSafe(sport.outputFlash, []);
    const files = {
      json365: path.relative(ROOT, sport.output365),
      jsonFlash: path.relative(ROOT, sport.outputFlash),
      xlsx: path.relative(ROOT, sport.xlsx),
    };

    try {
      const allResults = await getCompareResultsForSport(sportKey);
      const summary = summarizeResults(raw365, rawFlash, allResults);
      const details = prefixDetailRows(buildDetails(allResults, sport.key), sport);

      allDetails.problematic.push(...details.problematic);
      allDetails.matched.push(...details.matched);
      countries.push(...allResults.map(row => ({
        ...row,
        country: row.country || '-',
        sport: sport.key,
      })));

      sports.push({
        sport: sport.key,
        label: sport.label,
        ...summary,
        files,
        status: 'completed',
      });
    } catch (e) {
      sports.push({
        sport: sport.key,
        label: sport.label,
        total365: countGames(raw365),
        totalFlash: countGames(rawFlash),
        matched: 0,
        only365: 0,
        onlyFlash: 0,
        timeDiff: 0,
        statusDiff: 0,
        nameDiff: 0,
        files,
        status: 'failed',
        error: e.message,
      });
    }
  }

  return {
    summary: sports.reduce((acc, row) => {
      acc.total365 += row.total365;
      acc.totalFlash += row.totalFlash;
      acc.matched += row.matched;
      acc.only365 += row.only365;
      acc.onlyFlash += row.onlyFlash;
      acc.timeDiff += row.timeDiff;
      acc.statusDiff += row.statusDiff;
      acc.nameDiff += row.nameDiff;
      return acc;
    }, { total365: 0, totalFlash: 0, matched: 0, only365: 0, onlyFlash: 0, timeDiff: 0, statusDiff: 0, nameDiff: 0 }),
    sports,
    details: allDetails,
    countries,
    files: {},
  };
}

async function buildLatamAllSummary() {
  const allDetails = { problematic: [], matched: [] };
  const countries = [];
  const sports = [];

  for (const coreKey of LATAM_CORE_SPORTS) {
    const latamKey = `latam_${coreKey}`;
    const latamSport = SPORTS[latamKey];
    const files = {
      json365: path.relative(ROOT, latamSport.output365),
      jsonFlash: path.relative(ROOT, latamSport.outputFlash),
      xlsx: path.relative(ROOT, latamSport.xlsx),
    };

    try {
      const built = await buildLatamSportResult(coreKey);
      const raw365 = readJsonSafe(latamSport.output365, []);
      const rawFlash = readJsonSafe(latamSport.outputFlash, []);
      const summary = summarizeResults(raw365, rawFlash, built.allResults);
      const details = prefixDetailRows(buildDetails(built.allResults, coreKey), latamSport);

      allDetails.problematic.push(...details.problematic);
      allDetails.matched.push(...details.matched);
      countries.push(...built.allResults.map(row => ({
        ...row,
        country: row.country || '-',
        sport: latamKey,
      })));

      sports.push({
        sport: latamKey,
        label: latamSport.label,
        ...summary,
        files,
        status: 'completed',
      });
    } catch (e) {
      sports.push({
        sport: latamKey,
        label: latamSport.label,
        total365: countGames(readJsonSafe(latamSport.output365, [])),
        totalFlash: countGames(readJsonSafe(latamSport.outputFlash, [])),
        matched: 0,
        only365: 0,
        onlyFlash: 0,
        timeDiff: 0,
        statusDiff: 0,
        nameDiff: 0,
        files,
        status: 'failed',
        error: e.message,
      });
    }
  }

  return {
    summary: sports.reduce((acc, row) => {
      acc.total365 += row.total365;
      acc.totalFlash += row.totalFlash;
      acc.matched += row.matched;
      acc.only365 += row.only365;
      acc.onlyFlash += row.onlyFlash;
      acc.timeDiff += row.timeDiff;
      acc.statusDiff += row.statusDiff;
      acc.nameDiff += row.nameDiff;
      return acc;
    }, { total365: 0, totalFlash: 0, matched: 0, only365: 0, onlyFlash: 0, timeDiff: 0, statusDiff: 0, nameDiff: 0 }),
    sports,
    details: allDetails,
    countries,
    files: {},
  };
}

function compactGame(country, type, game, extra = {}) {
  return {
    country,
    type,
    competition: game.competicao || game.competition || game.competicao_365 || game.competicao_flash || '',
    competition365: game.competicao_365 || game.competition365 || '',
    competitionFlash: game.competicao_flash || game.competitionFlash || '',
    home: game.home || game.home_365 || game.home365 || '',
    away: game.away || game.away_365 || game.away365 || '',
    home365: game.home_365 || game.home365 || '',
    away365: game.away_365 || game.away365 || '',
    homeFlash: game.home_flash || game.homeFlash || '',
    awayFlash: game.away_flash || game.awayFlash || '',
    time: game.horario || game.time || game.horario_365 || game.time365 || '',
    status: game.status || game.status_365 || game.status365 || '',
    ...extra,
  };
}

function detailKey(row) {
  return [
    row.country,
    row.competition,
    row.home365 || row.home,
    row.away365 || row.away,
    row.homeFlash || '',
    row.awayFlash || '',
    row.time365 || row.time,
    row.timeFlash || '',
  ].map(v => String(v || '').trim().toLowerCase()).join('|||');
}

function buildDetails(allResults, defaultSportKey = '') {
  enrichCompareResults(allResults, defaultSportKey);
  const problematic = [];
  const problemKeys = new Set();

  for (const { country, result } of allResults || []) {
    for (const g of result?.so_no_365 || []) {
      const row = compactGame(country, 'only365', g, {
        competition365: g.competicao || '',
        home365: g.home || '',
        away365: g.away || '',
        badge: 'Missing on Flashscore',
        severity: 'warning',
      });
      problematic.push(row);
      problemKeys.add(detailKey(row));
    }

    for (const g of result?.so_no_flash || []) {
      const row = compactGame(country, 'onlyFlash', g, {
        competitionFlash: g.competicao || '',
        homeFlash: g.home || '',
        awayFlash: g.away || '',
        badge: 'Missing on 365Scores',
        severity: 'warning',
      });
      problematic.push(row);
      problemKeys.add(detailKey(row));
    }

    for (const g of result?.divergencias_horario || []) {
      const row = compactGame(country, 'timeDiff', g, {
        competition: g.competicao_365 || g.competicao_flash || '',
        competition365: g.competicao_365 || '',
        competitionFlash: g.competicao_flash || '',
        home365: g.home_365 || g.home || '',
        away365: g.away_365 || g.away || '',
        homeFlash: g.home_flash || '',
        awayFlash: g.away_flash || '',
        time365: g.horario_365 || '',
        timeFlash: g.horario_flash || '',
        badge: `365Scores: ${g.horario_365 || '-'} | Flashscore: ${g.horario_flash || '-'}`,
        severity: 'danger',
      });
      problematic.push(row);
      problemKeys.add(detailKey(row));
    }

    for (const g of result?.divergencias_status || []) {
      const row = compactGame(country, 'statusDiff', g, {
        competition: g.competicao_365 || g.competicao_flash || '',
        competition365: g.competicao_365 || '',
        competitionFlash: g.competicao_flash || '',
        home365: g.home_365 || g.home || '',
        away365: g.away_365 || g.away || '',
        homeFlash: g.home_flash || '',
        awayFlash: g.away_flash || '',
        status365: g.status_365 || '',
        statusFlash: g.status_flash || '',
        badge: `365Scores: ${g.status_365 || '-'} | Flashscore: ${g.status_flash || '-'}`,
        severity: 'danger',
      });
      problematic.push(row);
      problemKeys.add(detailKey(row));
    }

    for (const g of result?.divergencias_nome || []) {
      const row = compactGame(country, 'nameDiff', g, {
        competition: g.competicao || '',
        competition365: g.competicao_365 || g.competicao || '',
        competitionFlash: g.competicao_flash || '',
        home365: g.home_365 || '',
        away365: g.away_365 || '',
        homeFlash: g.home_flash || '',
        awayFlash: g.away_flash || '',
        badge: `Similarity: ${g.similaridade || '-'}`,
        severity: 'danger',
      });
      problematic.push(row);
      problemKeys.add(detailKey(row));
    }
  }

  const matched = [];
  for (const { country, result } of allResults || []) {
    for (const pair of result?.matched_pairs || []) {
      const row = {
        country,
        type: 'matched',
        competition: pair.competition365 || pair.competitionFlash || '',
        competition365: pair.competition365 || '',
        competitionFlash: pair.competitionFlash || '',
        home: pair.home365 || '',
        away: pair.away365 || '',
        home365: pair.home365 || '',
        away365: pair.away365 || '',
        homeFlash: pair.homeFlash || '',
        awayFlash: pair.awayFlash || '',
        time: pair.time365 || pair.timeFlash || '',
        time365: pair.time365 || '',
        timeFlash: pair.timeFlash || '',
        status: pair.status365 || pair.statusFlash || '',
        status365: pair.status365 || '',
        statusFlash: pair.statusFlash || '',
        badge: 'Synced',
        severity: 'ok',
      };

      const isClean = String(row.time365 || '') === String(row.timeFlash || '') &&
        String(row.status365 || '') === String(row.statusFlash || '') &&
        !problemKeys.has(detailKey(row));

      if (isClean) matched.push(row);
    }
  }

  return { problematic, matched };
}

function competitionRegistryKey({ sport, source, scope, competition }) {
  return [
    String(sport || '').trim().toLowerCase(),
    String(source || '').trim().toLowerCase(),
    normalizeTerm(scope || ''),
    normalizeTerm(competition || ''),
  ].join('|||');
}

function emptyCompetitionRegistry() {
  return {
    version: 1,
    competitions: {},
  };
}

function readCompetitionRegistry() {
  const raw = readJsonSafe(COMPETITION_REGISTRY_FILE, emptyCompetitionRegistry());
  raw.version ||= 1;
  raw.competitions ||= {};
  return raw;
}

function writeCompetitionRegistry(registry) {
  writeJson(COMPETITION_REGISTRY_FILE, registry, { pretty: false });
}

function upsertCompetitionRegistryEntry(registry, item, status = 'recognized') {
  const sport = String(item.sport || '').trim();
  const source = String(item.source || '').trim();
  const scope = String(item.scope || '').trim();
  const competition = String(item.competition || '').trim();
  if (!sport || !source || !competition) return null;

  const key = competitionRegistryKey({ sport, source, scope, competition });
  const now = new Date().toISOString();
  const previous = registry.competitions[key] || {};
  registry.competitions[key] = {
    key,
    sport,
    source,
    scope,
    competition,
    status: status || previous.status || 'recognized',
    count: Number(previous.count || 0) + 1,
    firstSeenAt: previous.firstSeenAt || now,
    lastSeenAt: now,
  };
  return registry.competitions[key];
}

function competitionRowsFromDetails(scan) {
  const rows = [
    ...(scan?.result?.details?.problematic || []),
    ...(scan?.result?.details?.matched || []),
  ];
  const items = [];

  for (const row of rows) {
    const sport = row.sport || scan?.sport || '';
    if (!sport || sport === 'all') continue;
    const scope = row.country || '';
    const add = (source, competition) => {
      const value = String(competition || '').trim();
      if (!value) return;
      items.push({ sport, source, scope, competition: value });
    };
    add('365scores', row.competition365 || (row.type === 'only365' ? row.competition : ''));
    add('flashscore', row.competitionFlash || (row.type === 'onlyFlash' ? row.competition : ''));
    if (!row.competition365 && !row.competitionFlash && row.competition) {
      add('365scores', row.competition);
      add('flashscore', row.competition);
    }
  }

  const unique = new Map();
  for (const item of items) {
    unique.set(competitionRegistryKey(item), item);
  }
  return [...unique.values()];
}

function seedCompetitionRegistryFromHistory(registry) {
  for (const scan of loadHistory()) {
    for (const item of competitionRowsFromDetails(scan)) {
      upsertCompetitionRegistryEntry(registry, item, 'recognized');
    }
  }
  return registry;
}

function seedCompetitionRegistryFromRules(registry) {
  const rules = listRules();
  for (const [sport, sportRules] of Object.entries(rules)) {
    for (const rule of sportRules.ignore365Only || []) {
      upsertCompetitionRegistryEntry(registry, {
        sport,
        source: '365scores',
        scope: rule.scope,
        competition: rule.competition,
      }, 'ignored');
    }
    for (const rule of sportRules.ignoreFlashOnly || []) {
      upsertCompetitionRegistryEntry(registry, {
        sport,
        source: 'flashscore',
        scope: rule.scope,
        competition: rule.competition,
      }, 'ignored');
    }
  }
  return registry;
}

function cloneCompetitionRegistry(registry) {
  return {
    version: registry.version || 1,
    competitions: { ...(registry.competitions || {}) },
  };
}

function ensureCompetitionRegistryBootstrapped(registry) {
  if (Object.keys(registry.competitions || {}).length > 0) return registry;
  seedCompetitionRegistryFromHistory(registry);
  seedCompetitionRegistryFromRules(registry);
  writeCompetitionRegistry(registry);
  return registry;
}

function competitionRegistryView() {
  const registry = ensureCompetitionRegistryBootstrapped(readCompetitionRegistry());
  const view = cloneCompetitionRegistry(registry);
  seedCompetitionRegistryFromRules(view);
  return view;
}

function computeUnrecognizedCompetitions(scan) {
  const registry = competitionRegistryView();
  const seen = new Set(Object.keys(registry.competitions || {}));
  const unknown = [];
  const emitted = new Set();

  for (const item of competitionRowsFromDetails(scan)) {
    const key = competitionRegistryKey(item);
    if (seen.has(key) || emitted.has(key)) continue;
    emitted.add(key);
    unknown.push({ ...item, key });
  }

  return unknown.sort((a, b) =>
    a.sport.localeCompare(b.sport) ||
    a.source.localeCompare(b.source) ||
    a.scope.localeCompare(b.scope) ||
    a.competition.localeCompare(b.competition)
  );
}

function recognizeCompetition({ sport, source, scope, competition, status }) {
  const normalizedSource = String(source || '').trim().toLowerCase();
  if (!SPORTS[sport]) throw new Error('Unknown sport.');
  if (!['365scores', 'flashscore'].includes(normalizedSource)) throw new Error('Unknown competition source.');
  if (!String(competition || '').trim()) throw new Error('Competition is required.');

  const registry = ensureCompetitionRegistryBootstrapped(readCompetitionRegistry());
  upsertCompetitionRegistryEntry(registry, {
    sport,
    source: normalizedSource,
    scope,
    competition,
  }, ['recognized', 'ignored'].includes(status) ? status : 'recognized');
  writeCompetitionRegistry(registry);
  return registry;
}

function registerScanCompetitions(scan) {
  const startedAt = Date.now();
  const registry = ensureCompetitionRegistryBootstrapped(readCompetitionRegistry());
  for (const item of competitionRowsFromDetails(scan)) {
    upsertCompetitionRegistryEntry(registry, item, 'recognized');
  }
  writeJson(COMPETITION_REGISTRY_FILE, registry, { pretty: false });
  if (scan) appendLog(scan, `Competition registry updated in ${Date.now() - startedAt}ms`);
}

function removeUnrecognizedCompetitionFromScan(scan, item) {
  if (!scan?.unrecognizedCompetitions?.length) return;
  const key = competitionRegistryKey(item);
  scan.unrecognizedCompetitions = scan.unrecognizedCompetitions.filter(row => competitionRegistryKey(row) !== key);
}

const ABSENT_365_MARKER = '(ausente)';
const ABSENT_FLASH_MARKER = '(ausente)';

function missing365TermKey(sport, scope, competition) {
  return termDecisionKey({
    sport,
    type: 'missing_365',
    scope,
    value365: ABSENT_365_MARKER,
    valueFlash: competition,
  });
}

function missingFlashTermKey(sport, scope, competition) {
  return termDecisionKey({
    sport,
    type: 'missing_flash',
    scope,
    value365: competition,
    valueFlash: ABSENT_FLASH_MARKER,
  });
}

function ruleScopeMatches(ruleScope = '', rowScope = '') {
  const left = resolveScopeKey(ruleScope);
  const right = resolveScopeKey(rowScope);
  return left === '*' || right === '*' || left === right;
}

function ruleCompetitionMatches(ruleCompetition = '', rowCompetition = '') {
  const left = normalizeCompTerm(ruleCompetition);
  const right = normalizeCompTerm(rowCompetition);
  if (!left || !right) return false;
  if (left === '*' || left === right) return true;
  return right.startsWith(`${left} `) || left.startsWith(`${right} `);
}

function isFlashOnlyCompetitionHandled(sport, scope, competition) {
  const sportRules = listRules()[sport];
  if (!sportRules) return false;

  for (const rule of sportRules.ignoreFlashOnly || []) {
    if (ruleScopeMatches(rule.scope, scope) && ruleCompetitionMatches(rule.competition, competition)) return true;
  }
  return false;
}

function is365OnlyCompetitionHandled(sport, scope, competition) {
  const sportRules = listRules()[sport];
  if (!sportRules) return false;

  for (const rule of sportRules.acknowledged365Only || []) {
    if (ruleScopeMatches(rule.scope, scope) && ruleCompetitionMatches(rule.competition, competition)) return true;
  }
  for (const rule of sportRules.ignore365Only || []) {
    if (ruleScopeMatches(rule.scope, scope) && ruleCompetitionMatches(rule.competition, competition)) return true;
  }
  return false;
}

function isFlashOnlyCompetitionHandledByTermAliases(sport, scope, competition) {
  const key = missing365TermKey(sport, scope, competition);
  const aliases = loadTermAliases();
  return [...aliases.approved, ...aliases.rejected].some(item => termDecisionKey(item) === key);
}

function is365OnlyCompetitionHandledByTermAliases(sport, scope, competition) {
  const key = missingFlashTermKey(sport, scope, competition);
  const aliases = loadTermAliases();
  return [...aliases.approved, ...aliases.rejected].some(item => termDecisionKey(item) === key);
}

function knownFlashOnlyAcknowledgedKeys() {
  const keys = new Set();
  const rules = listRules();
  for (const [sport, sportRules] of Object.entries(rules)) {
    for (const rule of sportRules.ignoreFlashOnly || []) {
      keys.add(missing365TermKey(sport, rule.scope, rule.competition));
    }
  }
  return keys;
}

function known365OnlyAcknowledgedKeys() {
  const keys = new Set();
  const rules = listRules();
  for (const [sport, sportRules] of Object.entries(rules)) {
    for (const rule of sportRules.acknowledged365Only || []) {
      keys.add(missingFlashTermKey(sport, rule.scope, rule.competition));
    }
    for (const rule of sportRules.ignore365Only || []) {
      keys.add(missingFlashTermKey(sport, rule.scope, rule.competition));
    }
  }
  return keys;
}

function compareSportLabelForBridge(sportKey = '') {
  const core = getLatamCoreSport(sportKey) || getIsraelCoreSport(sportKey) || sportKey;
  return core === 'tennis' ? 'Tênis' : '';
}

function flashCompetitionMatchedInResult(result = {}, competition = '', sportKey = '', scope = '') {
  if (sportKey) {
    try {
      const {
        getCurrentBridge,
        isCompetitionMatchedInCurrentScan,
        isCompKnownShared,
        resolveCompareSportKey,
      } = require('./compare.js');
      const sportLabel = compareSportLabelForBridge(sportKey);
      const bridge = getCurrentBridge(result, sportLabel);
      if (isCompetitionMatchedInCurrentScan('flash', competition, sportLabel, bridge)) {
        return true;
      }
      if (isCompKnownShared(resolveCompareSportKey(sportKey), competition, 'flash', scope)) {
        return true;
      }
    } catch (_) {}
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

function flashOnlyCompetitionAcknowledgements(scan, decisions = {}) {
  const items = [];
  const seen = new Set();

  for (const term of scan?.terms || []) {
    if (term.type !== 'missing_365' || decisions[term.id] !== 'same') continue;
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
      compFlash === comp365 ||
      isNormalizedCompPrefixMatch(compFlash, comp365) ||
      diceSimilarity(compFlash, comp365) >= 0.85
    ));
  });
}

function scores365OnlyCompetitionAcknowledgements(scan, decisions = {}) {
  const items = [];
  const seen = new Set();

  for (const term of scan?.terms || []) {
    if (term.type !== 'missing_flash' || decisions[term.id] !== 'same') continue;
    const scope = String(term.scope || '').trim();
    const competition = String(term.value365 || '').trim();
    if (!term.sport || !scope || !competition) continue;
    const key = `${term.sport}|||${scope.toLowerCase()}|||${competition.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ sport: term.sport, scope, competition });
  }

  return items;
}

function addTermSuggestion(suggestions, seen, known, term) {
  const clean = {
    id: '',
    sport: term.sport || '',
    type: term.type || '',
    scope: String(term.scope || '').trim(),
    value365: String(term.value365 || '').trim(),
    valueFlash: String(term.valueFlash || '').trim(),
    context: term.context || '',
    similarity: term.similarity || '',
  };

  if (!clean.type) return;

  if (clean.type === 'missing_365') {
    if (!clean.scope || !clean.valueFlash) return;
    clean.value365 = ABSENT_365_MARKER;
  } else if (clean.type === 'missing_flash') {
    if (!clean.scope || !clean.value365) return;
    clean.valueFlash = ABSENT_FLASH_MARKER;
  } else if (!clean.value365 || !clean.valueFlash) {
    return;
  }

  if (clean.type !== 'missing_365' && clean.type !== 'missing_flash') {
    if (termsAreEquivalent(clean.type, clean.value365, clean.valueFlash)) return;
  }

  const key = termDecisionKey(clean);
  if (known.has(key) || seen.has(key)) return;

  clean.id = `term_${suggestions.length + 1}_${Date.now()}`;
  seen.add(key);
  suggestions.push(clean);
}

function buildTermSuggestions(allResults, defaultSportKey) {
  const suggestions = [];
  const seen = new Set();
  const known = new Set([
    ...knownTermDecisionKeys(),
    ...knownFlashOnlyAcknowledgedKeys(),
    ...known365OnlyAcknowledgedKeys(),
  ]);

  for (const { country, sport, result } of allResults || []) {
    const sportKey = sport || defaultSportKey;
    const scope = country || '';

    for (const pair of result?.matched_pairs || []) {
      const namesAreSame = competitorsAreSame(pair);
      const namesNeedReview = competitorNamesNeedReview(pair);

      if (namesNeedReview) {
        addTermSuggestion(suggestions, seen, known, {
          sport: sportKey,
          type: 'name',
          scope,
          value365: `${pair.home365 || ''} / ${pair.away365 || ''}`.trim(),
          valueFlash: `${pair.homeFlash || ''} / ${pair.awayFlash || ''}`.trim(),
          context: pair.competition365 || pair.competitionFlash || '',
          similarity: pair.teamSimilarity ? `${Math.round(pair.teamSimilarity * 100)}%` : '',
        });
      }

      if (!namesAreSame && !namesNeedReview) continue;

      if (!namesAreSame) {
        addTermSuggestion(suggestions, seen, known, {
          sport: sportKey,
          type: 'competition',
          scope,
          value365: pair.competition365,
          valueFlash: pair.competitionFlash,
          context: `${pair.home365 || ''} / ${pair.away365 || ''}`,
          similarity: pair.competitionSimilarity ? `${Math.round(pair.competitionSimilarity * 100)}%` : '',
        });
      }
    }

    for (const diff of result?.divergencias_nome || []) {
      addTermSuggestion(suggestions, seen, known, {
        sport: sportKey,
        type: 'name',
        scope,
        value365: `${diff.home_365 || ''} / ${diff.away_365 || ''}`.trim(),
        valueFlash: `${diff.home_flash || ''} / ${diff.away_flash || ''}`.trim(),
        context: diff.competicao || '',
        similarity: diff.similaridade || '',
      });
    }

    for (const candidate of unmatchedGameCandidates(result)) {
      const nameSimilarity = `${Math.round(candidate.teamSimilarity * 100)}%`;
      const competitionSimilarity = `${Math.round(candidate.competitionSimilarity * 100)}%`;
      const time = candidate.game365.horario || candidate.gameFlash.horario || '';
      const comp365 = candidate.game365.competicao || '';
      const compFlash = candidate.gameFlash.competicao || '';

      addTermSuggestion(suggestions, seen, known, {
        sport: sportKey,
        type: 'name',
        scope,
        value365: `${candidate.game365.home || ''} / ${candidate.game365.away || ''}`.trim(),
        valueFlash: `${candidate.gameFlash.home || ''} / ${candidate.gameFlash.away || ''}`.trim(),
        context: `${comp365 || '-'} ↔ ${compFlash || '-'}${time ? ` · ${time}` : ''}`,
        similarity: nameSimilarity,
      });

      addTermSuggestion(suggestions, seen, known, {
        sport: sportKey,
        type: 'competition',
        scope,
        value365: comp365,
        valueFlash: compFlash,
        context: `${candidate.game365.home || ''} / ${candidate.game365.away || ''} ↔ ${candidate.gameFlash.home || ''} / ${candidate.gameFlash.away || ''}`,
        similarity: competitionSimilarity,
      });
    }
  }

  return suggestions;
}

function attachScanTerms(scan, allResults, defaultSportKey) {
  scan.terms = buildTermSuggestions(allResults, defaultSportKey);
  try {
    const { buildTermFixSuppressedKeys } = require('./compare.js');
    scan.termFixSuppressed = buildTermFixSuppressedKeys(allResults, defaultSportKey);
  } catch (_) {
    scan.termFixSuppressed = [];
  }
}

async function buildLatamSportResult(coreSportKey) {
  const latamKey = `latam_${coreSportKey}`;
  const latamSport = SPORTS[latamKey];
  return withSportTimezone(latamKey, async () => {
    delete require.cache[require.resolve('./lib/scan-timezone')];
    delete require.cache[require.resolve('./compare.js')];
    const { runCompareLatam } = require('./compare.js');
    const allResults = enrichCompareResults(
      await runCompareLatam(coreSportKey, { skipTelegram: true }),
      coreSportKey
    );
    const raw365 = readJsonSafe(latamSport.output365, []);
    const rawFlash = readJsonSafe(latamSport.outputFlash, []);
    const summary = summarizeResults(raw365, rawFlash, allResults);

    return {
      allResults,
      result: {
        summary,
        details: buildDetails(allResults, coreSportKey),
        countries: allResults,
        files: {
          json365: path.relative(ROOT, latamSport.output365),
          jsonFlash: path.relative(ROOT, latamSport.outputFlash),
          xlsx: path.relative(ROOT, latamSport.xlsx),
        },
      },
    };
  });
}

async function buildIsraelAllSummary() {
  const allDetails = { problematic: [], matched: [] };
  const countries = [];
  const sports = [];

  for (const coreKey of ISRAEL_CORE_SPORTS) {
    const israelKey = `israel_${coreKey}`;
    const israelSport = SPORTS[israelKey];
    const files = {
      json365: path.relative(ROOT, israelSport.output365),
      jsonFlash: path.relative(ROOT, israelSport.outputFlash),
      xlsx: path.relative(ROOT, israelSport.xlsx),
    };

    try {
      const built = await buildIsraelSportResult(coreKey);
      const raw365 = readJsonSafe(israelSport.output365, []);
      const rawFlash = readJsonSafe(israelSport.outputFlash, []);
      const summary = summarizeResults(raw365, rawFlash, built.allResults);
      const details = prefixDetailRows(buildDetails(built.allResults, coreKey), israelSport);

      allDetails.problematic.push(...details.problematic);
      allDetails.matched.push(...details.matched);
      countries.push(...built.allResults.map(row => ({
        ...row,
        country: row.country || '-',
        sport: israelKey,
      })));

      sports.push({
        sport: israelKey,
        label: israelSport.label,
        ...summary,
        files,
        status: 'completed',
      });
    } catch (e) {
      sports.push({
        sport: israelKey,
        label: israelSport.label,
        total365: countGames(readJsonSafe(israelSport.output365, [])),
        totalFlash: countGames(readJsonSafe(israelSport.outputFlash, [])),
        matched: 0,
        only365: 0,
        onlyFlash: 0,
        timeDiff: 0,
        statusDiff: 0,
        nameDiff: 0,
        files,
        status: 'failed',
        error: e.message,
      });
    }
  }

  return {
    summary: sports.reduce((acc, row) => {
      acc.total365 += row.total365;
      acc.totalFlash += row.totalFlash;
      acc.matched += row.matched;
      acc.only365 += row.only365;
      acc.onlyFlash += row.onlyFlash;
      acc.timeDiff += row.timeDiff;
      acc.statusDiff += row.statusDiff;
      acc.nameDiff += row.nameDiff;
      return acc;
    }, { total365: 0, totalFlash: 0, matched: 0, only365: 0, onlyFlash: 0, timeDiff: 0, statusDiff: 0, nameDiff: 0 }),
    sports,
    details: allDetails,
    countries,
    files: {},
  };
}

async function buildIsraelSportResult(coreSportKey) {
  const israelKey = `israel_${coreSportKey}`;
  const israelSport = SPORTS[israelKey];
  return withSportTimezone(israelKey, async () => {
    delete require.cache[require.resolve('./lib/scan-timezone')];
    delete require.cache[require.resolve('./compare.js')];
    const { runCompareIsrael } = require('./compare.js');
    const allResults = enrichCompareResults(
      await runCompareIsrael(coreSportKey, { skipTelegram: true }),
      coreSportKey
    );
    const raw365 = readJsonSafe(israelSport.output365, []);
    const rawFlash = readJsonSafe(israelSport.outputFlash, []);
    const summary = summarizeResults(raw365, rawFlash, allResults);

    return {
      allResults,
      result: {
        summary,
        details: buildDetails(allResults, coreSportKey),
        countries: allResults,
        files: {
          json365: path.relative(ROOT, israelSport.output365),
          jsonFlash: path.relative(ROOT, israelSport.outputFlash),
          xlsx: path.relative(ROOT, israelSport.xlsx),
        },
      },
    };
  });
}

async function buildSportResult(sportKey, scan = null) {
  const sport = SPORTS[sportKey];
  const allResults = await getCompareResultsForSport(sportKey, scan);
  try {
    fs.writeFileSync(compareSnapshotPath(sportKey), JSON.stringify(allResults));
  } catch (_) {}
  const raw365 = readJsonSafe(sport.output365, []);
  const rawFlash = readJsonSafe(sport.outputFlash, []);
  const summary = summarizeResults(raw365, rawFlash, allResults);

  return {
    allResults,
    result: {
      summary,
      details: buildDetails(allResults, sportKey),
      countries: allResults,
      files: {
        json365: path.relative(ROOT, sport.output365),
        jsonFlash: path.relative(ROOT, sport.outputFlash),
        xlsx: path.relative(ROOT, sport.xlsx),
      },
    },
  };
}

async function writeScanXlsxForSport(scan, allResults) {
  if (!allResults || !scan?.sport || scan.sport === 'all') return;

  const startedAt = Date.now();
  try {
    delete require.cache[require.resolve('./compare.js')];
    const { writeSportXlsx, getLatamSportConfig, getIsraelSportConfig } = require('./compare.js');
    if (isUsaAllSportKey(scan.sport)) {
      for (const key of USA_SPORT_KEYS) {
        const sportResults = (allResults || []).filter(row => row.sport === key);
        if (sportResults.length) await writeSportXlsx(key, sportResults);
      }
    } else if (isLatamAllSportKey(scan.sport)) {
      for (const key of LATAM_CORE_SPORTS) {
        const latamKey = `latam_${key}`;
        const sportResults = (allResults || []).filter(row => row.sport === latamKey);
        if (sportResults.length) {
          await writeSportXlsx(key, sportResults, getLatamSportConfig(key));
        }
      }
    } else if (isIsraelAllSportKey(scan.sport)) {
      for (const key of ISRAEL_CORE_SPORTS) {
        const israelKey = `israel_${key}`;
        const sportResults = (allResults || []).filter(row => row.sport === israelKey);
        if (sportResults.length) {
          await writeSportXlsx(key, sportResults, getIsraelSportConfig(key));
        }
      }
    } else if (isLatamSportKey(scan.sport)) {
      await writeSportXlsx(getLatamCoreSport(scan.sport), allResults, getLatamSportConfig(getLatamCoreSport(scan.sport)));
    } else if (isIsraelSportKey(scan.sport)) {
      await writeSportXlsx(getIsraelCoreSport(scan.sport), allResults, getIsraelSportConfig(getIsraelCoreSport(scan.sport)));
    } else {
      await writeSportXlsx(scan.sport, allResults);
    }
    appendLog(scan, `XLSX write finished in ${Math.round((Date.now() - startedAt) / 1000)}s`);
  } catch (error) {
    appendLog(scan, `XLSX generation failed: ${error.message}`);
  }
}

function scanXlsxPaths(scan) {
  const sport = scan?.sport;
  if (!sport || sport === 'all') return [];
  if (isUsaAllSportKey(sport)) return USA_SPORT_KEYS.map(key => SPORTS[key]?.xlsx).filter(Boolean);
  if (isLatamAllSportKey(sport)) {
    return LATAM_CORE_SPORTS.map(key => SPORTS[`latam_${key}`]?.xlsx).filter(Boolean);
  }
  if (isIsraelAllSportKey(sport)) {
    return ISRAEL_CORE_SPORTS.map(key => SPORTS[`israel_${key}`]?.xlsx).filter(Boolean);
  }
  if (isLatamSportKey(sport)) return [SPORTS[sport]?.xlsx].filter(Boolean);
  if (isIsraelSportKey(sport)) return [SPORTS[sport]?.xlsx].filter(Boolean);
  return [SPORTS[sport]?.xlsx].filter(Boolean);
}

function scanXlsxReady(scan) {
  const paths = scanXlsxPaths(scan);
  return paths.length > 0 && paths.every(filePath => fs.existsSync(filePath));
}

async function finalizeScan(scan, decisions = {}, options = {}) {
  if (!scan || !scan.result) throw new Error('No scan is ready for Terms Fix.');

  // Bottlenecks: (1) re-compare via buildSportResult when term decisions changed,
  // (2) writeSportXlsx Excel build, (3) registerScanCompetitions + saveScanHistory.
  // XLSX is pre-built at scan end; skipped here when decisions did not change results.
  const startedAt = Date.now();

  saveTermDecisions(scan, decisions);

  const ignoredFlashSuggestions = [
    ...(Array.isArray(options.acknowledgedSuggestions) ? options.acknowledgedSuggestions.filter(item => item.side !== '365') : []),
    ...flashOnlyCompetitionAcknowledgements(scan, decisions),
  ];
  if (ignoredFlashSuggestions.length) {
    ignoreFlashOnlySuggestions(ignoredFlashSuggestions);
  }

  const dontIgnoreFlashAcknowledgements = flashOnlyCompetitionDontIgnoreAcknowledgements(scan, decisions);
  if (dontIgnoreFlashAcknowledgements.length) {
    acknowledgeFlashOnlySuggestions(dontIgnoreFlashAcknowledgements);
  }

  let allResults = loadCompareSnapshot(scan.sport, scan.date) || scan.result?.countries || null;

  const hasTermDecisions = Object.values(decisions || {}).some(value => value === 'same' || value === 'different');
  if (hasTermDecisions) {
    if (scan.sport === 'all') {
      const termsById = new Map((scan.terms || []).map(term => [String(term.id), term]));
      const sportsWithDecisions = [...new Set(
        Object.entries(decisions || {})
          .filter(([, decision]) => decision === 'same' || decision === 'different')
          .map(([id]) => {
            const sportKey = String(termsById.get(String(id))?.sport || '').trim();
            if (!sportKey || sportKey === 'all') return null;
            return getLatamCoreSport(sportKey) || getIsraelCoreSport(sportKey) || sportKey.replace(/_usa$/, '') || sportKey;
          })
          .filter(Boolean)
      )];
      scan.result = await buildAllSportsSummary(
        sportsWithDecisions.length
          ? { scan, forceRecompareSports: sportsWithDecisions }
          : { scan, forceRecompare: true }
      );
      allResults = scan.result?.countries || allResults;
    } else if (isUsaAllSportKey(scan.sport)) {
      scan.result = await buildUsaAllSummary();
      allResults = scan.result?.countries || allResults;
    } else if (isLatamAllSportKey(scan.sport)) {
      scan.result = await buildLatamAllSummary();
      allResults = scan.result?.countries || allResults;
    } else if (isIsraelAllSportKey(scan.sport)) {
      scan.result = await buildIsraelAllSummary();
      allResults = scan.result?.countries || allResults;
    } else if (isLatamSportKey(scan.sport)) {
      const built = await buildLatamSportResult(getLatamCoreSport(scan.sport));
      scan.result = built.result;
      attachScanTerms(scan,built.allResults, getLatamCoreSport(scan.sport));
      allResults = built.allResults;
    } else if (isIsraelSportKey(scan.sport)) {
      const built = await buildIsraelSportResult(getIsraelCoreSport(scan.sport));
      scan.result = built.result;
      attachScanTerms(scan,built.allResults, getIsraelCoreSport(scan.sport));
      allResults = built.allResults;
    } else {
      const built = await buildSportResult(scan.sport, scan);
      scan.result = built.result;
      attachScanTerms(scan,built.allResults, scan.sport);
      allResults = built.allResults;
    }
  }

  if (allResults && scan.sport !== 'all') {
    const needsXlsx = hasTermDecisions || !scanXlsxReady(scan);
    if (needsXlsx) {
      const xlsxStartedAt = Date.now();
      await writeScanXlsxForSport(scan, allResults);
      appendLog(scan, `Finalize XLSX in ${Math.round((Date.now() - xlsxStartedAt) / 1000)}s`);
    } else {
      appendLog(scan, 'XLSX already up to date (skipped rebuild).');
    }
  }

  const registryStartedAt = Date.now();
  registerScanCompetitions(scan);
  appendLog(scan, `Finalize registry in ${Date.now() - registryStartedAt}ms`);
  scan.unrecognizedCompetitions = [];
  scan.status = 'completed';
  scan.finalizedAt = new Date().toISOString();

  const history = saveScanHistory(scan);
  lastScan = scan;
  appendLog(scan, `Report finalized in ${Math.round((Date.now() - startedAt) / 1000)}s`);
  return { scan, history };
}

async function completeAsanaLinkedScan(taskGid, scanId = null) {
  if (!taskGid) throw new Error('Missing Asana task GID.');
  if (!asana.isConfigured()) throw new Error('Asana is not configured.');

  await asana.completeTask(taskGid);
  const completedAt = new Date().toISOString();

  const updateScanRecord = (record) => {
    if (!record || String(record.asanaTaskGid || '').trim() !== String(taskGid || '').trim()) return record;
    return { ...record, asanaCompletedAt: completedAt };
  };

  if (lastScan?.asanaTaskGid === taskGid) lastScan = updateScanRecord(lastScan);
  if (activeScan?.asanaTaskGid === taskGid) activeScan = updateScanRecord(activeScan);

  const history = loadHistory();
  const index = history.findIndex(item =>
    (scanId && item.id === scanId) || (!scanId && item.asanaTaskGid === taskGid)
  );
  if (index >= 0) {
    history[index] = updateScanRecord(history[index]);
    writeJson(HISTORY_FILE, history, { pretty: false });
    if (lastScan?.id === history[index].id) lastScan = history[index];
  }

  return {
    ok: true,
    completedAt,
    scan: index >= 0 ? history[index] : lastScan?.asanaTaskGid === taskGid ? lastScan : null,
  };
}

function formatLocalDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function tomorrowIso(sportKey = '') {
  return tomorrowIsoInTimezone(scanTimezoneForSport(sportKey));
}

function findScanForTermsGenerate(scanId) {
  const id = Number(scanId);
  if (!Number.isFinite(id)) return null;
  if (activeScan?.id === id) return activeScan;
  if (lastScan?.id === id) return lastScan;
  return loadHistory().find(item => item.id === id) || null;
}

async function withSportTimezone(sportKey, fn) {
  const previous = process.env.SCAN_TIMEZONE;
  process.env.SCAN_TIMEZONE = scanTimezoneForSport(sportKey);
  try {
    return await fn();
  } finally {
    if (previous === undefined) delete process.env.SCAN_TIMEZONE;
    else process.env.SCAN_TIMEZONE = previous;
  }
}

function validateDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) {
    throw new Error('Choose a valid scan date.');
  }
}

function appendLog(scan, line) {
  const text = String(line ?? '');
  if (!text) return;

  const parts = text.split(/\r?\n/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    scan.logs.push(trimmed);
  }

  if (scan.logs.length > 600) {
    scan.logs.splice(0, scan.logs.length - 600);
  }
}

function scriptRuntimeLimitMs(script = '') {
  const name = String(script || '').replace(/\\/g, '/');
  // Full multi-sport pipelines need far longer than a single scraper.
  if (/(^|\/)run-all\.js$/i.test(name) || /(^|\/)run-latam-all\.js$/i.test(name)) {
    return 45 * 60 * 1000;
  }
  if (/flashscore|365-/i.test(name)) return 10 * 60 * 1000;
  return 5 * 60 * 1000;
}

function lastScriptErrorFromLogs(scan) {
  const skipPatterns = [
    /still running/i,
    /^▶\s/,
    /^✅\s/,
    /^⏳\s/,
    /^WARN:\s*365Scores API attempt/i,
  ];

  for (let i = scan.logs.length - 1; i >= 0; i--) {
    const line = scan.logs[i];
    if (skipPatterns.some(pattern => pattern.test(line))) continue;
    if (/timed out — killing hung process/i.test(line)) {
      return line.replace(/^⚠️\s*/u, '').trim();
    }
    if (/^ERROR:\s*/i.test(line)) return line.replace(/^ERROR:\s*/i, '').trim();
    if (/saiu com c[oó]digo\s+\d+/i.test(line)) return line.trim();
    if (/Flashscore não mudou/i.test(line)) return line.trim();
    if (/365Scores API (returned|request failed|timed out|returned invalid JSON)/i.test(line)) {
      return line.trim();
    }
    if (/Invalid target date/i.test(line)) return line.trim();
    if (/request to .+ failed/i.test(line)) return line.trim();
    if (/\b(ETIMEDOUT|ECONNRESET|ECONNREFUSED|ENOTFOUND|fetch failed)\b/i.test(line)) {
      return line.trim();
    }
  }
  return null;
}

function runScript(script, label, scan, env = {}, args = []) {
  return new Promise((resolve, reject) => {
    appendLog(scan, `\n▶ ${label}: ${script}`);
    if (scan.cancelRequested) return reject(new Error('Scan cancelled.'));

    const child = spawn(process.execPath, [path.join(ROOT, script), ...args], {
      cwd: ROOT,
      env: { ...process.env, ...env, PYTHONUNBUFFERED: '1' },
      shell: false,
      windowsHide: true,
    });
    if (!scanChildren.has(scan.id)) scanChildren.set(scan.id, new Set());
    scanChildren.get(scan.id).add(child);

    const heartbeat = setInterval(() => {
      if (!scan.cancelRequested) {
        appendLog(scan, `⏳ ${label} still running...`);
      }
    }, 5000);

    let timedOut = false;
    const maxRuntimeMs = scriptRuntimeLimitMs(script);
    const runtimeTimer = setTimeout(() => {
      timedOut = true;
      appendLog(scan, `⚠️ ${label} timed out after ${Math.round(maxRuntimeMs / 60000)} min — killing hung process`);
      killProcessTree(child);
    }, maxRuntimeMs);

    child.stdout.on('data', data => appendLog(scan, data.toString()));
    child.stderr.on('data', data => appendLog(scan, data.toString()));
    child.on('error', error => {
      clearInterval(heartbeat);
      if (runtimeTimer) clearTimeout(runtimeTimer);
      reject(error);
    });
    child.on('close', code => {
      clearInterval(heartbeat);
      if (runtimeTimer) clearTimeout(runtimeTimer);
      scanChildren.get(scan.id)?.delete(child);
      if (scan.cancelRequested) return reject(new Error('Scan cancelled.'));
      if (code === 0) {
        appendLog(scan, `✅ ${label} finished`);
        resolve();
      } else if (timedOut) {
        reject(new Error(
          lastScriptErrorFromLogs(scan)
          || `${label} timed out after ${Math.round(maxRuntimeMs / 60000)} min`
        ));
      } else {
        reject(new Error(lastScriptErrorFromLogs(scan) || `${script} exited with code ${code}`));
      }
    });
  });
}

function runScriptsParallel(jobs, scan, env = {}) {
  return Promise.all(
    jobs.map(({ script, label, args = [] }) => runScript(script, label, scan, env, args))
  );
}

function killProcessTree(child) {
  if (!child?.pid) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    }).on('error', () => {});
    return;
  }
  child.kill('SIGTERM');
}

function cancelActiveScan() {
  if (!activeScan) {
    lastScan = null;
    return false;
  }

  const scan = activeScan;
  scan.cancelRequested = true;
  appendLog(scan, '\nScan cancelled by user.');

  for (const child of scanChildren.get(scan.id) || []) {
    killProcessTree(child);
  }

  scanChildren.delete(scan.id);
  activeScan = null;
  lastScan = null;
  return true;
}

function buildScanEnv(sportKey, date) {
  return {
    SCAN_DATE: date,
    TARGET_DATE: date,
    UI_SCAN_MODE: '1',
    SCAN_TIMEZONE: scanTimezoneForSport(sportKey),
  };
}

async function runScan(sportKey, date, scraperSource = 'flashscore', options = {}) {
  const sport = SCAN_OPTIONS[sportKey];
  const scan = {
    id: Date.now(),
    sport: sportKey,
    label: sport.label,
    date,
    scraperSource,
    operatorEmail: options.operatorEmail || null,
    asanaTaskGid: options.asanaTaskGid || null,
    status: 'running',
    startedAt: new Date().toISOString(),
    finishedAt: null,
    logs: [],
    result: null,
    error: null,
  };

  activeScan = scan;

  try {
    appendLog(scan, `Starting ${sport.label} scan for ${date}`);
    const env = buildScanEnv(sportKey, date);

    if (isUsaAllSportKey(sportKey)) {
      for (const key of USA_SPORT_KEYS) clearCompareSnapshot(key);
    } else if (isLatamAllSportKey(sportKey)) {
      for (const key of LATAM_CORE_SPORTS) clearCompareSnapshot(`latam_${key}`);
    } else if (isIsraelAllSportKey(sportKey)) {
      for (const key of ISRAEL_CORE_SPORTS) clearCompareSnapshot(`israel_${key}`);
    } else if (sportKey === 'all') {
      for (const key of CONTENT_CORE_SPORTS) clearCompareSnapshot(key);
    } else if (!getLatamCoreSport(sportKey) && !getIsraelCoreSport(sportKey)) {
      clearCompareSnapshot(sportKey);
    }

    if (sportKey === 'all') {
      await runScript('run-all.js', 'All sports', scan, env);
      scan.result = await buildAllSportsSummary({ scan });
      attachScanTerms(scan,scan.result.countries || [], 'all');
      scan.unrecognizedCompetitions = computeUnrecognizedCompetitions(scan);
      scan.status = 'terms_fix';
      appendLog(scan, '\nAll sports scan completed');
      return;
    }

    if (isUsaAllSportKey(sportKey)) {
      for (const key of USA_SPORT_KEYS) {
        const usaSport = SPORTS[key];
        appendLog(scan, `\n▶ ${usaSport.label}`);
        await runScriptsParallel([
          { script: usaSport.scraper365, label: `${usaSport.label} | 365` },
          { script: usaSport.scraperFlash, label: `${usaSport.label} | Flashscore` },
        ], scan, env);
      }

      appendLog(scan, '\n▶ Comparing all USA sports results');
      scan.result = await buildUsaAllSummary();
      attachScanTerms(scan, scan.result.countries || [], 'usa_all');
      scan.unrecognizedCompetitions = computeUnrecognizedCompetitions(scan);
      scan.status = 'terms_fix';
      appendLog(scan, '\nTerms Fix ready. Generating Excel files...');
      await writeScanXlsxForSport(scan, scan.result.countries || []);
      appendLog(scan, '\nAll USA sports scan completed');
      return;
    }

    if (isLatamAllSportKey(sportKey)) {
      for (const coreKey of LATAM_CORE_SPORTS) {
        const core = SPORTS[coreKey];
        appendLog(scan, `\n▶ ${SPORTS[`latam_${coreKey}`].label}`);
        await runScriptsParallel([
          { script: core.scraper365, label: `${core.label} | 365` },
          { script: core.scraperFlash, label: `${core.label} | Flashscore` },
        ], scan, env);
        appendLog(scan, `\n▶ Filtering LATAM countries (${core.label})`);
        await runScript('scrapers/filter-latam-sport.js', `LATAM filter | ${core.label}`, scan, env, [coreKey]);
      }

      appendLog(scan, '\n▶ Comparing all LATAM sports results');
      scan.result = await buildLatamAllSummary();
      attachScanTerms(scan, scan.result.countries || [], 'latam_all');
      scan.unrecognizedCompetitions = computeUnrecognizedCompetitions(scan);
      scan.status = 'terms_fix';
      appendLog(scan, '\nTerms Fix ready. Generating Excel files...');
      await writeScanXlsxForSport(scan, scan.result.countries || []);
      appendLog(scan, '\nAll LATAM sports scan completed');
      return;
    }

    if (isIsraelAllSportKey(sportKey)) {
      for (const coreKey of ISRAEL_CORE_SPORTS) {
        const core = SPORTS[coreKey];
        appendLog(scan, `\n▶ ${SPORTS[`israel_${coreKey}`].label}`);
        await runScriptsParallel([
          { script: core.scraper365, label: `${core.label} | 365` },
          { script: core.scraperFlash, label: `${core.label} | Flashscore` },
        ], scan, env);
        appendLog(scan, `\n▶ Filtering Israel competitions (${core.label})`);
        await runScript('scrapers/filter-israel-sport.js', `Israel filter | ${core.label}`, scan, env, [coreKey]);
      }

      appendLog(scan, '\n▶ Comparing all Israel sports results');
      scan.result = await buildIsraelAllSummary();
      attachScanTerms(scan, scan.result.countries || [], 'israel_all');
      scan.unrecognizedCompetitions = computeUnrecognizedCompetitions(scan);
      scan.status = 'terms_fix';
      appendLog(scan, '\nTerms Fix ready. Generating Excel files...');
      await writeScanXlsxForSport(scan, scan.result.countries || []);
      appendLog(scan, '\nAll Israel sports scan completed');
      return;
    }

    const latamCore = getLatamCoreSport(sportKey);
    if (latamCore) {
      const core = SPORTS[latamCore];
      await runScriptsParallel([
        { script: core.scraper365, label: `${sport.label} | 365` },
        { script: core.scraperFlash, label: `${sport.label} | Flashscore` },
      ], scan, env);

      appendLog(scan, '\n▶ Filtering LATAM countries');
      await runScript('scrapers/filter-latam-sport.js', `LATAM filter | ${sport.label}`, scan, env, [latamCore]);

      appendLog(scan, '\n▶ Comparing LATAM results');
      const built = await buildLatamSportResult(latamCore);

      scan.result = built.result;
      attachScanTerms(scan, built.allResults, latamCore);
      scan.unrecognizedCompetitions = computeUnrecognizedCompetitions(scan);
      scan.status = 'terms_fix';
      appendLog(scan, '\nTerms Fix ready. Generating Excel file...');
      await writeScanXlsxForSport(scan, built.allResults);
      appendLog(scan, '\nLATAM scan completed. Waiting for Terms Fix.');
      return;
    }

    const israelCore = getIsraelCoreSport(sportKey);
    if (israelCore) {
      const core = SPORTS[israelCore];
      await runScriptsParallel([
        { script: core.scraper365, label: `${sport.label} | 365` },
        { script: core.scraperFlash, label: `${sport.label} | Flashscore` },
      ], scan, env);

      appendLog(scan, '\n▶ Filtering Israel competitions');
      await runScript('scrapers/filter-israel-sport.js', `Israel filter | ${sport.label}`, scan, env, [israelCore]);

      appendLog(scan, '\n▶ Comparing Israel results');
      const built = await buildIsraelSportResult(israelCore);

      scan.result = built.result;
      attachScanTerms(scan, built.allResults, israelCore);
      scan.unrecognizedCompetitions = computeUnrecognizedCompetitions(scan);
      scan.status = 'terms_fix';
      appendLog(scan, '\nTerms Fix ready. Generating Excel file...');
      await writeScanXlsxForSport(scan, built.allResults);
      appendLog(scan, '\nIsrael scan completed. Waiting for Terms Fix.');
      return;
    }

    await runScriptsParallel([
      { script: sport.scraper365, label: `${sport.label} | 365` },
      { script: sport.scraperFlash, label: `${sport.label} | Flashscore` },
    ], scan, env);

    if (env.UI_SCAN_MODE === '1') {
      appendLog(scan, '\n▶ Competition memory skipped in UI scan (compare updates memory)');
    } else {
      appendLog(scan, '\n▶ Building competition memory');
      await runScript('shared_competitions.js', `Memória | ${sport.label}`, scan, env, [sportKey]).catch(e => {
        appendLog(scan, `Memory step skipped: ${e.message}`);
      });
    }

    appendLog(scan, '\n▶ Comparing results');
    appendLog(scan, 'Running comparison (this may take a minute)...');
    const compareStartedAt = Date.now();
    const built = await buildSportResult(sportKey, scan);
    appendLog(scan, `Comparison finished in ${Math.round((Date.now() - compareStartedAt) / 1000)}s`);

    scan.result = built.result;
    const termsStartedAt = Date.now();
    attachScanTerms(scan, built.allResults, sportKey);
    scan.unrecognizedCompetitions = computeUnrecognizedCompetitions(scan);
    appendLog(scan, `Terms prepared in ${Date.now() - termsStartedAt}ms`);

    // Mark Terms Fix ready before XLSX so the UI can open while Excel finishes.
    scan.status = 'terms_fix';
    appendLog(scan, '\nTerms Fix ready. Generating Excel file...');
    const xlsxStartedAt = Date.now();
    await writeScanXlsxForSport(scan, built.allResults);
    appendLog(scan, `Excel generated in ${Math.round((Date.now() - xlsxStartedAt) / 1000)}s`);
    appendLog(scan, '\nScan completed. Waiting for Terms Fix.');
  } catch (e) {
    if (!scan.cancelRequested) {
      scan.status = 'failed';
      scan.error = e.message;
      appendLog(scan, `\nERROR: ${e.message}`);
    }
  } finally {
    scan.finishedAt = new Date().toISOString();
    scanChildren.delete(scan.id);
    if (!scan.cancelRequested) {
      lastScan = scan;
      activeScan = null;
    }
  }
}

function listRules() {
  const raw = readJsonSafe(RULES_FILE, {});
  for (const sport of Object.keys(SPORTS)) {
    raw[sport] ||= {};
    raw[sport].ignore365Only ||= [];
    raw[sport].ignoreFlashOnly ||= [];
    raw[sport].acknowledgedFlashOnly ||= [];
    raw[sport].acknowledged365Only ||= [];
  }
  return raw;
}

// Adds an `aliases` hint (Flash <-> 365 equivalent names) to ignore rules before they are
// sent to the UI, so a rule stored with one side's competition name (e.g. Flash's
// "Catarinense 2") can also be recognized against the other side's name (365's
// "Catarinense - Serie B") when hiding already-rendered report rows client-side.
// Purely additive for the response — never written back to competition_rules.json.
function decorateRulesWithAliases(rules = {}) {
  const output = {};
  for (const [sport, sportRules] of Object.entries(rules || {})) {
    output[sport] = { ...sportRules };
    for (const bucket of ['ignoreFlashOnly', 'ignore365Only']) {
      const list = Array.isArray(sportRules?.[bucket]) ? sportRules[bucket] : [];
      output[sport][bucket] = list.map(rule => {
        if (!rule || rule.competition === '*') return rule;
        const aliases = expandCompetitionNamesForScope(sport, rule.competition)
          .filter(name => name && name !== rule.competition);
        return aliases.length ? { ...rule, aliases } : rule;
      });
    }
  }
  return output;
}

function ignoreFlashOnlySuggestions(items = []) {
  if (!Array.isArray(items) || !items.length) return listRules();

  const rules = listRules();
  for (const item of items) {
    const sport = item?.sport;
    if (!sport || !SPORTS[sport]) continue;

    const scope = String(item.scope || '').trim();
    const competition = String(item.competition || '').trim();
    if (!scope || !competition) continue;

    rules[sport].ignoreFlashOnly ||= [];
    rules[sport].acknowledgedFlashOnly ||= [];

    const exists = rules[sport].ignoreFlashOnly.some(rule =>
      String(rule.scope || '').trim().toLowerCase() === scope.toLowerCase() &&
      String(rule.competition || '').trim().toLowerCase() === competition.toLowerCase()
    );
    if (!exists) rules[sport].ignoreFlashOnly.push({ scope, competition });

    rules[sport].acknowledgedFlashOnly = rules[sport].acknowledgedFlashOnly.filter(rule =>
      String(rule.scope || '').trim().toLowerCase() !== scope.toLowerCase() ||
      String(rule.competition || '').trim().toLowerCase() !== competition.toLowerCase()
    );
  }

  writeJson(RULES_FILE, rules);
  invalidateCompareRulesCache();
  return rules;
}

function acknowledgeFlashOnlySuggestions(items = []) {
  if (!Array.isArray(items) || !items.length) return listRules();

  const rules = listRules();
  for (const item of items) {
    const sport = item?.sport;
    if (!sport || !SPORTS[sport]) continue;

    const scope = String(item.scope || '').trim();
    const competition = String(item.competition || '').trim();
    if (!scope || !competition) continue;

    rules[sport].acknowledgedFlashOnly ||= [];
    rules[sport].ignoreFlashOnly ||= [];

    const alreadyIgnored = rules[sport].ignoreFlashOnly.some(rule =>
      String(rule.scope || '').trim().toLowerCase() === scope.toLowerCase() &&
      String(rule.competition || '').trim().toLowerCase() === competition.toLowerCase()
    );
    if (alreadyIgnored) continue;

    const exists = rules[sport].acknowledgedFlashOnly.some(rule =>
      String(rule.scope || '').trim().toLowerCase() === scope.toLowerCase() &&
      String(rule.competition || '').trim().toLowerCase() === competition.toLowerCase()
    );
    if (!exists) rules[sport].acknowledgedFlashOnly.push({ scope, competition });
  }

  writeJson(RULES_FILE, rules);
  invalidateCompareRulesCache();
  return rules;
}

function acknowledge365OnlySuggestions(items = []) {
  if (!Array.isArray(items) || !items.length) return listRules();

  const rules = listRules();
  for (const item of items) {
    const sport = item?.sport;
    if (!sport || !SPORTS[sport]) continue;

    const scope = String(item.scope || '').trim();
    const competition = String(item.competition || '').trim();
    if (!scope || !competition) continue;

    rules[sport].acknowledged365Only ||= [];
    rules[sport].ignore365Only ||= [];

    const alreadyIgnored = rules[sport].ignore365Only.some(rule =>
      String(rule.scope || '').trim().toLowerCase() === scope.toLowerCase() &&
      String(rule.competition || '').trim().toLowerCase() === competition.toLowerCase()
    );
    if (alreadyIgnored) continue;

    const exists = rules[sport].acknowledged365Only.some(rule =>
      String(rule.scope || '').trim().toLowerCase() === scope.toLowerCase() &&
      String(rule.competition || '').trim().toLowerCase() === competition.toLowerCase()
    );
    if (!exists) rules[sport].acknowledged365Only.push({ scope, competition });
  }

  writeJson(RULES_FILE, rules);
  invalidateCompareRulesCache();
  return rules;
}

function normalizeRuleSide(side = '') {
  const value = String(side || '').trim().toLowerCase();
  if (value === '365' || value === 'flash') return value;
  if (/ausente\s+na\s+365|missing\s+in\s+365|missing\s+on\s+365/i.test(value)) return 'flash';
  if (/ausente\s+no\s+flash|missing\s+in\s+flash|missing\s+on\s+flash/i.test(value)) return '365';
  throw new Error('Side must be 365 or flash.');
}

function addRule({ sport, side, scope, competition }) {
  if (!SPORTS[sport]) throw new Error('Unknown sport.');
  const normalizedSide = normalizeRuleSide(side);
  if (!String(scope || '').trim()) throw new Error('Scope/country is required.');
  if (!String(competition || '').trim()) throw new Error('Competition is required.');

  const rules = listRules();
  const bucket = normalizedSide === '365' ? 'ignore365Only' : 'ignoreFlashOnly';
  const item = {
    scope: String(scope).trim(),
    competition: String(competition).trim(),
  };
  const scopeKey = resolveScopeKey(item.scope);

  const exists = rules[sport][bucket].some(rule =>
    resolveScopeKey(rule.scope) === scopeKey &&
    String(rule.competition || '').trim().toLowerCase() === item.competition.toLowerCase()
  );

  if (!exists) rules[sport][bucket].push(item);

  if (bucket === 'ignoreFlashOnly') {
    rules[sport].acknowledgedFlashOnly = (rules[sport].acknowledgedFlashOnly || []).filter(rule =>
      String(rule.scope || '').trim().toLowerCase() !== item.scope.toLowerCase() ||
      String(rule.competition || '').trim().toLowerCase() !== item.competition.toLowerCase()
    );
  }

  if (bucket === 'ignore365Only') {
    rules[sport].acknowledged365Only = (rules[sport].acknowledged365Only || []).filter(rule =>
      String(rule.scope || '').trim().toLowerCase() !== item.scope.toLowerCase() ||
      String(rule.competition || '').trim().toLowerCase() !== item.competition.toLowerCase()
    );
  }

  writeJson(RULES_FILE, rules);
  invalidateCompareRulesCache();
  return rules;
}

function deleteRule({ sport, side, index, scope, competition }) {
  if (!SPORTS[sport]) throw new Error('Unknown sport.');
  const normalizedSide = normalizeRuleSide(side);
  const rules = listRules();
  const bucket = normalizedSide === '365' ? 'ignore365Only' : 'ignoreFlashOnly';
  let idx = Number(index);

  if (!Number.isInteger(idx) || idx < 0 || idx >= rules[sport][bucket].length) {
    const scopeKey = resolveScopeKey(String(scope || '').trim());
    const competitionKey = String(competition || '').trim().toLowerCase();
    idx = rules[sport][bucket].findIndex(rule =>
      resolveScopeKey(rule.scope) === scopeKey &&
      String(rule.competition || '').trim().toLowerCase() === competitionKey
    );
  }

  if (!Number.isInteger(idx) || idx < 0 || idx >= rules[sport][bucket].length) {
    throw new Error('Invalid rule index.');
  }
  rules[sport][bucket].splice(idx, 1);
  writeJson(RULES_FILE, rules);
  invalidateCompareRulesCache();
  return rules;
}

function updateRule({ sport, side, newSide, index, scope, competition }) {
  if (!SPORTS[sport]) throw new Error('Unknown sport.');
  const normalizedSide = normalizeRuleSide(side);
  const targetSide = normalizeRuleSide(newSide || side);
  if (!String(scope || '').trim()) throw new Error('Scope/country is required.');
  if (!String(competition || '').trim()) throw new Error('Competition is required.');

  const rules = listRules();
  const bucket = normalizedSide === '365' ? 'ignore365Only' : 'ignoreFlashOnly';
  const targetBucket = targetSide === '365' ? 'ignore365Only' : 'ignoreFlashOnly';
  const idx = Number(index);
  if (!Number.isInteger(idx) || idx < 0 || idx >= rules[sport][bucket].length) {
    throw new Error('Invalid rule index.');
  }

  const item = {
    scope: String(scope).trim(),
    competition: String(competition).trim(),
  };

  if (targetBucket === bucket) {
    rules[sport][bucket][idx] = item;
  } else {
    rules[sport][bucket].splice(idx, 1);
    const exists = rules[sport][targetBucket].some(rule =>
      String(rule.scope || '').trim().toLowerCase() === item.scope.toLowerCase() &&
      String(rule.competition || '').trim().toLowerCase() === item.competition.toLowerCase()
    );
    if (!exists) rules[sport][targetBucket].push(item);
  }

  writeJson(RULES_FILE, rules);
  invalidateCompareRulesCache();
  return rules;
}

function getDownloadFile(scan, fileKey) {
  if (!scan?.sport || !SPORTS[scan.sport]) throw new Error('No completed scan is available.');
  const sport = SPORTS[scan.sport];
  const files = {
    json365: sport.output365,
    jsonFlash: sport.outputFlash,
    xlsx: sport.xlsx,
  };
  const file = files[fileKey];
  if (!file) throw new Error('Unknown file type.');
  if (!fs.existsSync(file)) throw new Error('Output file does not exist yet.');
  return file;
}

function sendDownload(res, file) {
  const filename = path.basename(file);
  const ext = path.extname(file).toLowerCase();
  const contentType = ext === '.xlsx'
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'application/json; charset=utf-8';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
  fs.createReadStream(file).pipe(res);
}

function serveBrandFile(req, res, url) {
  if (!url.pathname.startsWith('/brand/')) return false;

  const relative = decodeURIComponent(url.pathname.slice('/brand/'.length));
  if (!relative || relative.includes('..') || relative.includes('\\')) {
    res.writeHead(400);
    res.end('Bad request');
    return true;
  }

  const fullPath = path.join(ROOT, 'brand', relative);
  const brandDir = path.join(ROOT, 'brand') + path.sep;
  if (!fullPath.startsWith(brandDir) || !fs.existsSync(fullPath)) {
    res.writeHead(404);
    res.end('Not found');
    return true;
  }

  const ext = path.extname(relative).toLowerCase();
  const type = ext === '.png' ? 'image/png'
    : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
    : ext === '.svg' ? 'image/svg+xml'
    : ext === '.webp' ? 'image/webp'
    : 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': relative.startsWith('regions/') || relative.startsWith('tabs/') || relative.startsWith('logo') ? 'no-cache' : 'public, max-age=3600',
  });
  fs.createReadStream(fullPath).pipe(res);
  return true;
}

function normalizeFlagSize(size = 40) {
  const n = Number(size) || 40;
  if (n <= 20) return 20;
  if (n <= 40) return 40;
  return 80;
}

function serveCountryFlag(req, res, url) {
  if (!url.pathname.startsWith('/api/flag/')) return false;

  const code = String(url.pathname.slice('/api/flag/'.length) || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
  if (!code) {
    res.writeHead(400);
    res.end('Bad flag code');
    return true;
  }

  const size = normalizeFlagSize(Number(url.searchParams.get('s')) || 40);
  const pngUrl = `https://flagcdn.com/w${size}/${code}.png`;
  const svgUrl = `https://flagcdn.com/${code}.svg`;

  const pipeFlag = (upstreamRes, contentType) => {
    if (upstreamRes.statusCode !== 200) return false;
    res.writeHead(200, {
      'Content-Type': contentType || upstreamRes.headers['content-type'] || 'image/png',
      'Cache-Control': 'public, max-age=86400',
    });
    upstreamRes.pipe(res);
    return true;
  };

  https.get(pngUrl, upstreamRes => {
    if (pipeFlag(upstreamRes, 'image/png')) return;

    https.get(svgUrl, svgRes => {
      if (pipeFlag(svgRes, 'image/svg+xml')) return;
      res.writeHead(404);
      res.end('Flag not found');
    }).on('error', () => {
      res.writeHead(502);
      res.end('Flag upstream error');
    });
  }).on('error', () => {
    res.writeHead(502);
    res.end('Flag upstream error');
  });

  return true;
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (serveBrandFile(req, res, url)) return true;
  if (serveCountryFlag(req, res, url)) return true;

  const brandAsset = BRAND_ASSETS[url.pathname];
  if (brandAsset) {
    if (!fs.existsSync(brandAsset.file)) {
      res.writeHead(404);
      res.end('Not found');
      return true;
    }

    res.writeHead(200, {
      'Content-Type': brandAsset.type,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });
    fs.createReadStream(brandAsset.file).pipe(res);
    return true;
  }

  const routes = {
    '/': 'ui.html',
    '/ui.css': 'ui.css',
    '/ui-usa-sports.css': 'ui-usa-sports.css',
    '/ui-latam.css': 'ui-latam.css',
    '/ui-israel.css': 'ui-israel.css',
    '/ui-theme-light.css': 'ui-theme-light.css',
    '/ui-weekly.css': 'ui-weekly.css',
    '/ui.js': 'ui.js',
    '/ui-weekly.js': 'ui-weekly.js',
    '/lib/country-flags.js': 'lib/country-flags.js',
    '/lib/football-popularity.js': 'lib/football-popularity.js',
    '/config/football_popularity_priority.json': 'config/football_popularity_priority.json',
    '/vendor/flatpickr/flatpickr.min.css': 'vendor/flatpickr/flatpickr.min.css',
    '/vendor/flatpickr/flatpickr.min.js': 'vendor/flatpickr/flatpickr.min.js',
    '/vendor/flatpickr/l10n/pt.js': 'vendor/flatpickr/l10n/pt.js',
  };

  const file = routes[url.pathname];
  if (!file) return false;

  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    res.writeHead(404);
    res.end('Not found');
    return true;
  }

  const ext = path.extname(file);
  const type = ext === '.html' ? 'text/html; charset=utf-8'
    : ext === '.css' ? 'text/css; charset=utf-8'
    : ext === '.json' ? 'application/json; charset=utf-8'
    : 'application/javascript; charset=utf-8';

  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  });
  fs.createReadStream(fullPath).pipe(res);
  return true;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (serveStatic(req, res)) return;

    if (req.method === 'GET' && url.pathname === '/api/sports') {
      return sendJson(res, 200, {
        sports: Object.values(SCAN_OPTIONS).map(({ key, label }) => ({ key, label })),
        defaultDate: tomorrowIso(),
        defaultDates: {
          content: tomorrowIso('football'),
          usa: tomorrowIso('usa_all'),
          latam: tomorrowIso('latam_all'),
          israel: tomorrowIso('israel_all'),
        },
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/asana/status') {
      const validateProject = url.searchParams.get('validate') === '1';
      return sendJson(res, 200, await asana.getStatus({ validateProject }));
    }

    if (req.method === 'GET' && url.pathname === '/api/asana/dashboard') {
      try {
        const dueOn = String(url.searchParams.get('dueOn') || todayIsoInTimezone(DEFAULT_SCAN_TIMEZONE));
        const email = String(url.searchParams.get('email') || '').trim();
        const fresh = url.searchParams.get('fresh') === '1';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dueOn)) {
          return sendJson(res, 400, { error: 'Invalid dueOn date.' });
        }
        const payload = await asana.getDashboard({
          dueOn,
          email: email || undefined,
          fresh,
        });
        return sendJson(res, 200, payload);
      } catch (error) {
        return sendJson(res, 502, { error: error.message, configured: asana.isConfigured() });
      }
    }

    if (req.method === 'GET' && url.pathname === '/api/asana/tasks') {
      try {
        const dueOn = String(url.searchParams.get('dueOn') || todayIsoInTimezone(DEFAULT_SCAN_TIMEZONE));
        const email = String(url.searchParams.get('email') || '').trim();
        const fresh = url.searchParams.get('fresh') === '1';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dueOn)) {
          return sendJson(res, 400, { error: 'Invalid dueOn date.' });
        }
        const payload = await asana.getProjectTasks({
          dueOn,
          email: email || undefined,
          fresh,
        });
        return sendJson(res, 200, payload);
      } catch (error) {
        return sendJson(res, 502, { error: error.message, configured: asana.isConfigured() });
      }
    }

    const asanaCompleteMatch = url.pathname.match(/^\/api\/asana\/tasks\/([^/]+)\/complete$/);
    if (req.method === 'POST' && asanaCompleteMatch) {
      try {
        const taskGid = decodeURIComponent(asanaCompleteMatch[1]);
        const body = await readBody(req);
        const scanId = body?.scanId ? Number(body.scanId) : null;
        const payload = await completeAsanaLinkedScan(taskGid, scanId);
        return sendJson(res, 200, payload);
      } catch (error) {
        return sendJson(res, 502, { error: error.message, configured: asana.isConfigured() });
      }
    }

    if (req.method === 'GET' && url.pathname === '/api/365-competitions') {
      catalogStore.load();
      return sendJson(res, 200, { catalogs: catalogStore.listCatalogs() });
    }

    if (req.method === 'GET' && url.pathname === '/api/football-365-competitions') {
      catalogStore.load();
      return sendJson(res, 200, catalogStore.listCatalogs().football || readJsonSafe(FOOTBALL_365_COMPETITIONS_FILE, []));
    }

    if (req.method === 'GET' && url.pathname === '/api/scan') {
      return sendJson(res, 200, {
        active: activeScan ? sanitizeScanTerms(activeScan) : null,
        last: lastScan ? sanitizeScanTerms(lastScan) : null,
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/history') {
      return sendJson(res, 200, { history: loadHistory() });
    }

    if (req.method === 'GET' && url.pathname === '/api/weekly-analysis') {
      const days = Number(url.searchParams.get('days') || 7);
      const from = String(url.searchParams.get('from') || '').trim();
      const to = String(url.searchParams.get('to') || '').trim();
      const team = String(url.searchParams.get('team') || '').trim();
      const sport = String(url.searchParams.get('sport') || '').trim();
      const issue = String(url.searchParams.get('issue') || '').trim();
      const mode = String(url.searchParams.get('mode') || '').trim();
      const year = String(url.searchParams.get('year') || '').trim();
      const month = String(url.searchParams.get('month') || '').trim();
      return sendJson(res, 200, buildWeeklyAnalysis({ days, from, to, team, sport, issue, mode, year, month }));
    }

    if (req.method === 'GET' && url.pathname === '/api/weekly-analysis/issues') {
      try {
        const days = Number(url.searchParams.get('days') || 7);
        const from = String(url.searchParams.get('from') || '').trim();
        const to = String(url.searchParams.get('to') || '').trim();
        const team = String(url.searchParams.get('team') || '').trim();
        const sport = String(url.searchParams.get('sport') || '').trim();
        const issue = String(url.searchParams.get('issue') || '').trim();
        const mode = String(url.searchParams.get('mode') || '').trim();
        const year = String(url.searchParams.get('year') || '').trim();
        const month = String(url.searchParams.get('month') || '').trim();
        const country = String(url.searchParams.get('country') || '').trim();
        const competition = String(url.searchParams.get('competition') || '').trim();
        return sendJson(res, 200, buildWeeklyAnalysisIssues({
          days,
          from,
          to,
          team,
          sport,
          issue,
          mode,
          year,
          month,
          country,
          competition,
        }));
      } catch (error) {
        return sendJson(res, 400, { error: error.message || String(error) });
      }
    }

    if (req.method === 'PUT' && url.pathname === '/api/history') {
      const body = await readBody(req);
      return sendJson(res, 200, { history: renameHistoryRecord(body.id, body.historyName) });
    }

    if (req.method === 'DELETE' && url.pathname === '/api/history') {
      const body = await readBody(req);
      return sendJson(res, 200, { history: deleteHistoryRecord(body.id) });
    }

    if (req.method === 'POST' && url.pathname === '/api/terms/generate') {
      const body = await readBody(req);
      const scanId = Number(body.scanId);
      const scan = findScanForTermsGenerate(scanId);
      if (!scan) return sendJson(res, 404, { error: 'Terms Fix scan was not found.' });
      if (scan.status !== 'terms_fix' && scan.status !== 'completed') {
        return sendJson(res, 409, { error: 'Scan is not ready for Terms Fix.' });
      }
      const finalized = await finalizeScan(scan, body.decisions || {}, {
        acknowledgedSuggestions: body.acknowledgedSuggestions || [],
      });
      return sendJson(res, 200, {
        scan: finalized.scan,
        history: finalized.history,
        rules: decorateRulesWithAliases(listRules()),
      });
    }

    if (req.method === 'POST' && url.pathname === '/api/scan') {
      if (activeScan) return sendJson(res, 409, { error: 'A scan is already running.' });
      const body = await readBody(req);
      const sport = String(body.sport || '');
      const date = String(body.date || tomorrowIso(sport));
      const scraperSource = 'flashscore';
      if (!SCAN_OPTIONS[sport]) return sendJson(res, 400, { error: 'Choose a valid sport.' });
      validateDate(date);
      const operatorEmail = String(body.operatorEmail || '').trim() || null;
      const asanaTaskGid = String(body.asanaTaskGid || '').trim() || null;
      runScan(sport, date, scraperSource, { operatorEmail, asanaTaskGid });
      return sendJson(res, 202, { ok: true });
    }

    if (req.method === 'DELETE' && url.pathname === '/api/scan') {
      const cancelled = cancelActiveScan();
      return sendJson(res, 200, { ok: true, cancelled, active: null, last: null });
    }

    if (req.method === 'GET' && url.pathname === '/api/rules') {
      return sendJson(res, 200, decorateRulesWithAliases(listRules()));
    }

    if (req.method === 'POST' && url.pathname === '/api/competition-registry/recognize') {
      const body = await readBody(req);
      const registry = recognizeCompetition(body);
      removeUnrecognizedCompetitionFromScan(activeScan, body);
      removeUnrecognizedCompetitionFromScan(lastScan, body);
      return sendJson(res, 200, registry);
    }

    if (req.method === 'GET' && url.pathname === '/api/download') {
      const scanId = Number(url.searchParams.get('scanId'));
      const historyScan = loadHistory().find(item => item.id === scanId);
      const file = getDownloadFile(historyScan || lastScan, url.searchParams.get('file'));
      return sendDownload(res, file);
    }

    if (req.method === 'POST' && url.pathname === '/api/rules') {
      const body = await readBody(req);
      return sendJson(res, 200, decorateRulesWithAliases(addRule(body)));
    }

    if (req.method === 'PUT' && url.pathname === '/api/rules') {
      const body = await readBody(req);
      return sendJson(res, 200, decorateRulesWithAliases(updateRule(body)));
    }

    if (req.method === 'DELETE' && url.pathname === '/api/rules') {
      const body = await readBody(req);
      return sendJson(res, 200, decorateRulesWithAliases(deleteRule(body)));
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (e) {
    const message = (e && e.message) || String(e || '').trim() || 'Request failed';
    sendJson(res, 400, { error: message });
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPorta ${PORT} ja esta em uso por outro servidor.`);
    console.error('Pare o processo antigo e tente de novo:');
    console.error(`  Get-NetTCPConnection -LocalPort ${PORT} | Select-Object OwningProcess`);
    console.error('  Stop-Process -Id <PID> -Force');
    console.error('  npm run dev\n');
    process.exit(1);
  }
  throw err;
});

module.exports = {
  buildTermSuggestions,
  normalizeCompTerm,
  flashOnlyCompetitionGroups,
  shouldReplaceWeeklySnapshot,
  expandCompetitionNamesForScope,
  decorateRulesWithAliases,
  weeklyRowIsIgnored,
  listRules,
  possibleUnmatchedGameCandidate,
  termsAreEquivalent,
  unmatchedGameCandidates,
  pairNameSimilarity,
};

if (require.main === module) {
  server.listen(PORT, () => {
    const sportKeys = Object.keys(SPORTS).join(', ');
    console.log(`UI running at http://localhost:${PORT}`);
    console.log(`Sports: ${sportKeys} | Modes: all, usa_all, latam_all, israel_all, usa_*, latam_*, israel_*`);

    warmHistoryCache();

    if (asana.isConfigured()) {
      const today = todayIsoInTimezone(DEFAULT_SCAN_TIMEZONE);
      asana.warmCache([
        addDaysIso(today, -3),
        addDaysIso(today, -2),
        addDaysIso(today, -1),
        today,
        addDaysIso(today, 1),
        addDaysIso(today, 2),
        addDaysIso(today, 3),
      ]).catch(() => {});
    }

    startReminderPolling();
  });
}
