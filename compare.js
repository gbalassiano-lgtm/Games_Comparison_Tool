require('dotenv').config();
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const fetch = require('node-fetch');
const FormData = require('form-data');
const { stripTeamYouthMarkers, canonicalizeCompYouthMarkers, canonicalizeRomanNumerals, fixturesCategoryCompatible } = require('./lib/youth-markers');
const { timeDiffMinutes, isTimezoneBoundaryPair, resolveScanTargetDate, isStaleFinishedGameStatus, isDeferredGameStatus, gameBelongsToScanTarget } = require('./lib/scan-timezone');
const { normalizeTeamNameCore, flexibleNameSimilarity } = require('./lib/flexible-names');
const { isNonFootballFlashMatch } = require('./lib/football-flash-filter');
const { resolveScopeKey } = require('./lib/country-flags');
const {
  isFootballSportKey,
  loadPriorityListSync,
  reportRowPopularityRank,
  competitionPopularityRank,
} = require('./lib/football-popularity');

const SPORT_CONFIGS = {
  football: {
    label: 'Futebol',
    file365: path.join(__dirname, 'output', 'football', '365_tomorrow_by_country.json'),
    fileFlash: path.join(__dirname, 'output', 'football', 'flashscore_tomorrow_all_countries.json'),
    xlsxOut: path.join(__dirname, 'output', 'football', 'comparacao_amanha_futebol.xlsx'),
  },
  basketball: {
    label: 'Basquete',
    file365: path.join(__dirname, 'output', 'basketball', '365_tomorrow_basketball_by_country.json'),
    fileFlash: path.join(__dirname, 'output', 'basketball', 'flashscore_tomorrow_basketball_all_countries.json'),
    xlsxOut: path.join(__dirname, 'output', 'basketball', 'comparacao_amanha_basquete.xlsx'),
  },
  basketball_usa: {
    label: 'Basquete EUA',
    file365: path.join(__dirname, 'output', 'basketball_usa', '365_tomorrow_basketball_usa_by_country.json'),
    fileFlash: path.join(__dirname, 'output', 'basketball_usa', 'flashscore_tomorrow_basketball_usa.json'),
    xlsxOut: path.join(__dirname, 'output', 'basketball_usa', 'comparacao_amanha_basquete_usa.xlsx'),
  },
  american_football_usa: {
    label: 'Futebol Americano EUA',
    file365: path.join(__dirname, 'output', 'american_football_usa', '365_tomorrow_american_football_usa_by_country.json'),
    fileFlash: path.join(__dirname, 'output', 'american_football_usa', 'flashscore_tomorrow_american_football_usa.json'),
    xlsxOut: path.join(__dirname, 'output', 'american_football_usa', 'comparacao_amanha_futebol_americano_usa.xlsx'),
  },
  baseball_usa: {
    label: 'Beisebol EUA',
    file365: path.join(__dirname, 'output', 'baseball_usa', '365_tomorrow_baseball_usa_by_country.json'),
    fileFlash: path.join(__dirname, 'output', 'baseball_usa', 'flashscore_tomorrow_baseball_usa.json'),
    xlsxOut: path.join(__dirname, 'output', 'baseball_usa', 'comparacao_amanha_beisebol_usa.xlsx'),
  },
  volleyball: {
    label: 'Vôlei',
    file365: path.join(__dirname, 'output', 'volleyball', '365_tomorrow_volleyball_by_country.json'),
    fileFlash: path.join(__dirname, 'output', 'volleyball', 'flashscore_tomorrow_volleyball_all_countries.json'),
    xlsxOut: path.join(__dirname, 'output', 'volleyball', 'comparacao_amanha_volei.xlsx'),
  },
  hockey: {
    label: 'Hockey',
    file365: path.join(__dirname, 'output', 'hockey', '365_tomorrow_hockey_by_country.json'),
    fileFlash: path.join(__dirname, 'output', 'hockey', 'flashscore_tomorrow_hockey_all_countries.json'),
    xlsxOut: path.join(__dirname, 'output', 'hockey', 'comparacao_amanha_hockey.xlsx'),
  },
  tennis: {
    label: 'Tênis',
    file365: path.join(__dirname, 'output', 'tennis', '365_tomorrow_tennis_by_country.json'),
    fileFlash: path.join(__dirname, 'output', 'tennis', 'flashscore_tomorrow_tennis_all_countries.json'),
    xlsxOut: path.join(__dirname, 'output', 'tennis', 'comparacao_amanha_tenis.xlsx'),
  },
};

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const COMPETITION_RULES_FILE = path.join(__dirname, 'config', 'competition_rules.json');
const SHARED_COMPETITIONS_FILE = path.join(__dirname, 'config', 'shared_competitions.json');
const { resolveTermAlias, clearTermAliasesCache, loadTermAliases } = require('./lib/term-aliases');

const SIM_TEAM = 0.56;
const DIFF_TIME = 30;
const MIN_MATCHES_TO_LEARN = 1;

// ──────────────────────────────────────────────────────────────────────────────
// Normalização
// ──────────────────────────────────────────────────────────────────────────────

function norm(text = '') {
  return canonicalizeRomanNumerals(String(text)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\b(w|women|woman)\b/g, '')
    .replace(/\b(fc|cf|sc|ac|ec|se|es|af|rc|sd|ud|rcd|ca|cd|fk|sk|bk|if|hk|nk|ik)\b/g, '')
    .replace(/[:.!?_\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

function normCompetitionBase(text = '') {
  return canonicalizeRomanNumerals(String(text)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\b(fc|cf|sc|ac|ec|se|es|af|rc|sd|ud|rcd|ca|cd|fk|sk|bk|if|hk|nk|ik)\b/g, '')
    .replace(/[:.!?_\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

const NICKNAMES = {
  'forest': 'nottingham',
  'nottingham': 'nottingham',
  'villa': 'aston villa',
  'tottenham spurs': 'tottenham',
  'barca': 'barcelona',
  'atletico': 'atletico',
  'celta': 'celta vigo',
  'rc celta': 'celta vigo',
  'dim': 'independiente medellin',
  'ind medellin': 'independiente medellin',
  'independiente medellin': 'independiente medellin',
  'junior': 'junior barranquilla',
  'junior barranquilla': 'junior barranquilla',
  'atletico nacional': 'atletico nacional',
  'nacional': 'atletico nacional',
  'la galaxy': 'los angeles galaxy',
  'los angeles galaxy': 'los angeles galaxy',
  'whitecaps': 'vancouver whitecaps',
  'nycfc': 'new york city',
  'new york city': 'new york city',
  'nyrb': 'new york red bulls',
  'red bulls': 'new york red bulls',
  'din': 'dinamo',
  'dyn': 'dinamo',
  'dinamo': 'dinamo',
  'dynamo': 'dinamo',
  'vaengir': 'vaengir',
  'vaengirs': 'vaengir',
  'vaengir jupiter': 'vaengir',
  'hawks': 'atlanta hawks',
  'atlanta hawks': 'atlanta hawks',
  'celtics': 'boston celtics',
  'boston celtics': 'boston celtics',
  'nets': 'brooklyn nets',
  'brooklyn nets': 'brooklyn nets',
  'hornets': 'charlotte hornets',
  'charlotte hornets': 'charlotte hornets',
  'bulls': 'chicago bulls',
  'chicago bulls': 'chicago bulls',
  'cavaliers': 'cleveland cavaliers',
  'cavs': 'cleveland cavaliers',
  'cleveland cavaliers': 'cleveland cavaliers',
  'mavericks': 'dallas mavericks',
  'mavs': 'dallas mavericks',
  'dallas mavericks': 'dallas mavericks',
  'nuggets': 'denver nuggets',
  'denver nuggets': 'denver nuggets',
  'pistons': 'detroit pistons',
  'detroit pistons': 'detroit pistons',
  'warriors': 'golden state warriors',
  'golden state warriors': 'golden state warriors',
  'rockets': 'houston rockets',
  'houston rockets': 'houston rockets',
  'pacers': 'indiana pacers',
  'indiana pacers': 'indiana pacers',
  'clippers': 'los angeles clippers',
  'la clippers': 'los angeles clippers',
  'los angeles clippers': 'los angeles clippers',
  'lakers': 'los angeles lakers',
  'la lakers': 'los angeles lakers',
  'los angeles lakers': 'los angeles lakers',
  'grizzlies': 'memphis grizzlies',
  'memphis grizzlies': 'memphis grizzlies',
  'heat': 'miami heat',
  'miami heat': 'miami heat',
  'bucks': 'milwaukee bucks',
  'milwaukee bucks': 'milwaukee bucks',
  'timberwolves': 'minnesota timberwolves',
  'wolves': 'minnesota timberwolves',
  'minnesota timberwolves': 'minnesota timberwolves',
  'pelicans': 'new orleans pelicans',
  'new orleans pelicans': 'new orleans pelicans',
  'knicks': 'new york knicks',
  'new york knicks': 'new york knicks',
  'thunder': 'oklahoma city thunder',
  'okc': 'oklahoma city thunder',
  'oklahoma city thunder': 'oklahoma city thunder',
  'magic': 'orlando magic',
  'orlando magic': 'orlando magic',
  '76ers': 'philadelphia 76ers',
  'sixers': 'philadelphia 76ers',
  'philadelphia 76ers': 'philadelphia 76ers',
  'suns': 'phoenix suns',
  'phoenix suns': 'phoenix suns',
  'trail blazers': 'portland trail blazers',
  'blazers': 'portland trail blazers',
  'portland trail blazers': 'portland trail blazers',
  'kings': 'sacramento kings',
  'sacramento kings': 'sacramento kings',
  'san antonio spurs': 'san antonio spurs',
  'raptors': 'toronto raptors',
  'toronto raptors': 'toronto raptors',
  'jazz': 'utah jazz',
  'utah jazz': 'utah jazz',
  'wizards': 'washington wizards',
  'washington wizards': 'washington wizards',
  'skyhawks': 'college park skyhawks',
  'college park skyhawks': 'college park skyhawks',
  'westchester': 'westchester knicks',
  'westchester knicks': 'westchester knicks',
  'a berlin': 'alba berlin',
  'alba berlin': 'alba berlin',
  'alba': 'alba berlin',
  'rostock seawolves': 'rostock',
  'rostock': 'rostock',
  'efb ishockey': 'esbjerg',
  'esbjerg': 'esbjerg',
  'rungsted cobras': 'rungsted',
  'rungsted': 'rungsted',
  'olimpico': 'ciclista olimpico',
  'ciclista olimpico': 'ciclista olimpico',
  'obras': 'obras sanitarias',
  'obras sanitarias': 'obras sanitarias',
  'ndsu': 'north dakota state',
  'north dakota state': 'north dakota state',
  'north dakota st': 'north dakota state',
  'usc': 'southern california',
  'usc trojans': 'southern california',
  'usf': 'south florida',
  'uic': 'illinois chicago',
  'vcu': 'virginia commonwealth',
  'vcu rams': 'virginia commonwealth',
  'cal': 'california',
  'umbc': 'maryland baltimore county',
  'ut rio grande valley': 'texas rio grande valley',
  'md east shore': 'maryland eastern shore',
  'maryland eastern shore': 'maryland eastern shore',
  'olympiacos': 'olympiakos',
  'olympiakos': 'olympiakos',
  'baskonia': 'baskonia',
  'baskonia vitoria': 'baskonia',
  'vd mazatlan': 'venados mazatlan',
  'venados de mazatlan': 'venados mazatlan',
  'venados mazatlan': 'venados mazatlan',
  'the town fc': 'san jose earthquakes 2',
  'the town': 'san jose earthquakes 2',
  'san jose earthquakes 2': 'san jose earthquakes 2',
  'jeonbuk motors': 'jeonbuk 2',
  'jeonbuk motor': 'jeonbuk 2',
  'jeonbuk 2': 'jeonbuk 2',
  'gotham': 'gotham',
  'mechal': 'defence force',
  'defence force': 'defence force',
  'zhenis': 'zhenis',
  'jenis': 'zhenis',
  'busan kyotong': 'busan kyotong',
  'busan transportation': 'busan kyotong',
  'gyeongju khnp': 'gyeongju khnp',
  'gyeongju h n': 'gyeongju khnp',
  'kups akatemia': 'kuopion palloseura 2',
  'kuopion palloseura 2': 'kuopion palloseura 2',
  'dingnan ganlian': 'dingnan united',
  'dingnan united': 'dingnan united',
  'vps': 'vaasa',
  'vaasa ps': 'vaasa',
  'vaasa': 'vaasa',
  'adama kenema': 'adama',
  'adama city': 'adama',
  'adama': 'adama',
};

function resolveNickname(name) {
  return NICKNAMES[name] || name;
}

function normTeam(text = '') {
  const base = normalizeTeamNameCore(stripTeamYouthMarkers(norm(text)));
  const value = base
    .replace(/\b(saint|st)\s+/g, 'saint ')
    .replace(/\b(michigan|ohio|penn|iowa|kansas|florida|georgia|texas|alabama)\s+st\b/gi, '$1 state')
    .replace(/\bjaguars\b/g, '')
    .replace(/\bbulldogs\b/g, '')
    .replace(/\bdin\b/g, 'dinamo')
    .replace(/\bdyn\b/g, 'dinamo')
    .replace(/\s+/g, ' ')
    .trim();

  return resolveNickname(value) || value;
}


function resolveContextualNickname(text = '', sportKey = '', competition = '') {
  const raw = normTeam(resolveTermAlias(text, 'name', sportKey));
  const comp = norm(competition || '');

  if (!raw) return '';

  if (raw === 'spurs') {
    if (isBasketballSport(sportKey) || comp.includes('nba')) return 'san antonio spurs';
    return 'tottenham';
  }

  if (raw === 'heat' && (isBasketballSport(sportKey) || comp.includes('nba'))) {
    return 'miami heat';
  }

  if (raw === 'usc trojans') return 'southern california';

  return resolveNickname(raw);
}

function canonicalTeamTokens(text = '', sportKey = '', competition = '') {
  return resolveContextualNickname(text, sportKey, competition)
    .split(' ')
    .map(t => t.trim())
    .filter(Boolean);
}

function bigrams(str) {
  const s = str.replace(/\s/g, '');
  const r = [];
  for (let i = 0; i < s.length - 1; i++) r.push(s[i] + s[i + 1]);
  return r;
}

function diceSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const ba = bigrams(a);
  const bb = bigrams(b);
  if (!ba.length || !bb.length) return 0;

  const setB = new Map();
  for (const bg of bb) setB.set(bg, (setB.get(bg) || 0) + 1);

  let matches = 0;
  for (const bg of ba) {
    const c = setB.get(bg) || 0;
    if (c > 0) {
      matches++;
      setB.set(bg, c - 1);
    }
  }

  return (2 * matches) / (ba.length + bb.length);
}

function tokenSetSimilarity(aTokens = [], bTokens = []) {
  if (!aTokens.length || !bTokens.length) return 0;

  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);

  let intersection = 0;
  for (const token of aSet) {
    if (bSet.has(token)) intersection++;
  }

  return intersection / Math.max(aSet.size, bSet.size);
}

function teamNameSim(a = '', b = '', sportKey = '', compA = '', compB = '') {
  const flex = flexibleNameSimilarity(a, b);
  const na = resolveContextualNickname(a, sportKey, compA);
  const nb = resolveContextualNickname(b, sportKey, compB);

  if (!na || !nb) return flex;
  if (na === nb) return 1;

  const dice = diceSimilarity(na, nb);
  const aTokens = canonicalTeamTokens(a, sportKey, compA);
  const bTokens = canonicalTeamTokens(b, sportKey, compB);
  const tokenScore = tokenSetSimilarity(aTokens, bTokens);

  const minTokens = Math.min(aTokens.length, bTokens.length);
  const hasSubset =
    minTokens > 0 &&
    tokenScore === (minTokens / Math.max(aTokens.length, bTokens.length));

  const contained =
    (na.length >= 4 && nb.includes(na)) ||
    (nb.length >= 4 && na.includes(nb));

  let score = Math.max(dice, tokenScore * 0.96);
  if (contained) score = Math.max(score, 0.95);
  if (hasSubset && minTokens >= 1) score = Math.max(score, 0.93);
  if (flex > 0) score = Math.max(score, flex);

  return score;
}

const COUNTRY_ALIASES = {
  // 365 often uses "America"; Flashscore uses "NORTH & CENTRAL AMERICA" / "AMERICA"
  'america': 'america',
  'north central america': 'america',
  'north and central america': 'america',
  'north america': 'america',
  'central america': 'america',
  'america do norte': 'america',
  'america do norte e central': 'america',
  'america central': 'america',
  'norte e centro america': 'america',
  'concacaf': 'america',
  'paises baixos': 'holanda',
  'netherlands': 'holanda',
  'holland': 'holanda',
  'uk': 'inglaterra',
  'great britain': 'inglaterra',
  'czech republic': 'republica tcheca',
  'czechia': 'republica tcheca',
  'coreia': 'coreia do sul',
  'south korea': 'coreia do sul',
  'world': 'internacional',
  'mundo': 'internacional',
  'international': 'internacional',
  'internacional': 'internacional',
};

function isBasketballSport(sportKey = '') {
  return sportKey === 'basketball' || sportKey === 'basketball_usa';
}

function normCountry(text = '') {
  const n = norm(text)
    .replace(/[:.!?]+/g, '')
    .replace(/&/g, ' ')
    .replace(/\band\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return COUNTRY_ALIASES[n] || n;
}

function getGroupName(obj = {}) {
  return (
    obj.country ||
    obj.tour ||
    obj.circuit ||
    obj.category ||
    obj.group ||
    obj.section ||
    'Sem grupo'
  );
}

const COMP_ALIASES = {
  'ncaab d i': 'ncaa',
  'ncaab d i playoffs': 'ncaa',
  'ncaab d i tournament': 'ncaa',
  'ncaab d i': 'ncaa',
  'ncaab': 'ncaa',
  'ncaa playoffs': 'ncaa',
  'ncaaw': 'ncaa feminino',
  'ncaa feminina playoffs': 'ncaa feminino',
  'nit': 'ncaa',
  'nba g league': 'nba g league',
  'nba g league': 'nba g league',
  'liga nacional': 'liga argentina basquete',
  'liga a': 'liga argentina basquete',
  'liga nacional de basquetbol': 'liga argentina basquete',
  'georgian': 'david kipiani',
  'david kipiani': 'david kipiani',
  'k3 league': 'k league 3',
  'k league 3': 'k league 3',
  'centrobasket women': 'centrobasket women',
  "centrobasket women's": 'centrobasket women',
  'centrobasket womens': 'centrobasket women',
};


const COMP_BASE_ALIASES = {
  'vhl playoffs': 'vhl',
  'vhl playoff': 'vhl',
  'copa libertadores sub 20': 'libertadores sub 20',
  'libertadores sub 20 playoffs': 'libertadores sub 20',
  'concacaf campeonato sub 17 feminino': 'concacaf sub 17 feminino',
  'campeonato da concacaf sub 17 feminino': 'concacaf sub 17 feminino',
  'campeonato concacaf sub 17 feminino': 'concacaf sub 17 feminino',
  'concacaf campeonato sub 17': 'concacaf sub 17',
  'campeonato da concacaf sub 17': 'concacaf sub 17',
};

function isFibaStyleCompetitionBase(n = '') {
  return /\b(eurobasket|fiba|centrobasket|afrobasket|americup|asiacup|asia cup)\b/.test(n || '');
}

function stripCompetitionStage(text = '') {
  let n = normCompetitionBase(text || '')
    // Flash often uses spaced forms: "Play Offs", "Play Out", "Semi Finals".
    .replace(/\b(play\s*offs?|playoffs?|play\s*outs?|play\s*out|playoff)\b/g, ' ')
    // Placement brackets: "9th-16th places", "5th 7th places".
    .replace(/\b\d+(?:st|nd|rd|th)?(?:\s*-\s*|\s+)\d+(?:st|nd|rd|th)?\s+places?\b/g, ' ')
    .replace(/\b\d+(?:st|nd|rd|th)?\s+places?\b/g, ' ')
    .replace(/\b(classification|placement|classificacao)\s*(rounds?|phases?|stages?)?\b/g, ' ')
    .replace(/\b(qualifying|qualification|qualificacao|qualifica\w*|segunda fase|second phase|fase 2|fase final|final phase|relegation|promotion|promocao|rebaixamento)\b/g, ' ')
    .replace(/\b(semifinals?|semi\s*finals?|quarterfinals?|quarter\s*finals?|finals?|group stage|fase de grupos|grupos?)\b/g, ' ')
    .replace(/\b(da|de|do|del|la|el|the)\b/g, ' ')
    .replace(/\b(copa|cup|campeonato|championship|torneio|tournament)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // FIBA-style tournaments append "Group A/B" as a stage of one competition.
  // Do not strip "Group A" from club leagues like "Kakkonen Group A".
  if (isFibaStyleCompetitionBase(n)) {
    n = n
      .replace(/\b(groups?|grupos?)\s+[a-h]\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return n;
}

function normComp(text = '', sportKey = '') {
  const resolved = resolveTermAlias(String(text || '').trim(), 'competition', sportKey);
  const n = canonicalizeCompYouthMarkers(stripCompetitionStage(resolved))
    .replace(/['’`]/g, '')
    .replace(/[:.!?\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const aliased = normCompetitionBase(n);
  return COMP_BASE_ALIASES[COMP_ALIASES[aliased] || aliased] || COMP_ALIASES[aliased] || aliased;
}

function shouldIgnoreCompetition(sportKey = '', compName = '', source = '') {
  const c = norm(compName || '');

  if (sportKey === 'football') {
    return c.startsWith('kings league');
  }

  if (sportKey === 'tennis' && source === 'flash') {
    return c.includes('itf');
  }

  return false;
}

// ──────────────────────────────────────────────────────────────────────────────
// Tênis
// ──────────────────────────────────────────────────────────────────────────────

function extractTennisScopeFrom365Country(country = '') {
  const n = norm(country).replace(/\s+/g, ' ').trim();

  if (['atp', 'atp simples', 'atp singles', 'atp s'].includes(n)) return 'ATP - Simples';
  if (['wta', 'wta simples', 'wta singles', 'wta s'].includes(n)) return 'WTA - Simples';
  if (['atp duplas', 'atp doubles', 'atp d', 'atp dupla', 'atp double'].includes(n)) return 'ATP - Duplas';
  if (['wta duplas', 'wta doubles', 'wta d', 'wta dupla', 'wta double'].includes(n)) return 'WTA - Duplas';

  if (['challenger', 'challenger simples', 'challenger singles', 'challenger s'].includes(n)) return 'Challenger - Simples';
  if (['challenger duplas', 'challenger doubles', 'challenger d', 'challenger dupla', 'challenger double'].includes(n)) {
    return 'Challenger - Duplas';
  }

  if (n.includes('wta 125') || n.includes('challenger feminino')) {
    return n.includes('duplas') || n.includes('doubles')
      ? 'Challenger Feminino - Duplas'
      : 'Challenger Feminino - Simples';
  }

  if (n.includes('itf masculino') || n.includes('itf men') || n.includes('itf male')) {
    return n.includes('duplas') || n.includes('doubles')
      ? 'ITF Masculino - Duplas'
      : 'ITF Masculino - Simples';
  }

  if (n.includes('itf feminino') || n.includes('itf women') || n.includes('itf female')) {
    return n.includes('duplas') || n.includes('doubles')
      ? 'ITF Feminino - Duplas'
      : 'ITF Feminino - Simples';
  }

  return country || 'Sem grupo';
}

function extractTennisScopeFromFlashCompetition(comp = '') {
  const n = normComp(comp);
  const isDoubles = /\b(duplas|dupla|doubles|double| d )\b/.test(` ${n} `);
  const isSingles = /\b(simples|singles|single| s )\b/.test(` ${n} `);

  if (n.includes('challenger feminino') || n.includes('challenger women') || n.includes('wta 125')) {
    return isDoubles ? 'Challenger Feminino - Duplas' : 'Challenger Feminino - Simples';
  }
  if (n.includes('challenger')) return isDoubles ? 'Challenger - Duplas' : 'Challenger - Simples';
  if (n.includes('atp')) return isDoubles ? 'ATP - Duplas' : 'ATP - Simples';
  if (n.includes('wta')) return isDoubles ? 'WTA - Duplas' : 'WTA - Simples';
  if (n.includes('itf masculino') || n.includes('itf men') || n.includes('itf male')) return isDoubles ? 'ITF Masculino - Duplas' : 'ITF Masculino - Simples';
  if (n.includes('itf feminino') || n.includes('itf women') || n.includes('itf female')) return isDoubles ? 'ITF Feminino - Duplas' : 'ITF Feminino - Simples';
  if (n.includes('itf') && isSingles) return 'ITF Masculino - Simples';

  return null;
}

function normalizeTennisScope(text = '') {
  const n = norm(text).replace(/\s+/g, ' ').trim();
  const compact = n.replace(/\s*-\s*/g, ' ').trim();

  const map = {
    'atp': 'atp-simples',
    'atp s': 'atp-simples',
    'atp singles': 'atp-simples',
    'atp simples': 'atp-simples',
    'atp d': 'atp-duplas',
    'atp doubles': 'atp-duplas',
    'atp duplas': 'atp-duplas',
    'wta': 'wta-simples',
    'wta s': 'wta-simples',
    'wta singles': 'wta-simples',
    'wta simples': 'wta-simples',
    'wta d': 'wta-duplas',
    'wta doubles': 'wta-duplas',
    'wta duplas': 'wta-duplas',
    'wta 125k': 'challenger-feminino-simples',
    'wta 125': 'challenger-feminino-simples',
    'challenger feminino': 'challenger-feminino-simples',
    'challenger feminino singles': 'challenger-feminino-simples',
    'challenger feminino simples': 'challenger-feminino-simples',
    'challenger feminino doubles': 'challenger-feminino-duplas',
    'challenger feminino duplas': 'challenger-feminino-duplas',
    'challenger women': 'challenger-feminino-simples',
    'challenger women singles': 'challenger-feminino-simples',
    'challenger women simples': 'challenger-feminino-simples',
    'challenger women doubles': 'challenger-feminino-duplas',
    'challenger women duplas': 'challenger-feminino-duplas',
    'challenger': 'challenger-simples',
    'challenger s': 'challenger-simples',
    'challenger singles': 'challenger-simples',
    'challenger simples': 'challenger-simples',
    'challenger d': 'challenger-duplas',
    'challenger doubles': 'challenger-duplas',
    'challenger duplas': 'challenger-duplas',
    'itf masculino simples': 'itf-masculino-simples',
    'itf masculino duplas': 'itf-masculino-duplas',
    'itf feminino simples': 'itf-feminino-simples',
    'itf feminino duplas': 'itf-feminino-duplas',
    'itf men singles': 'itf-masculino-simples',
    'itf men doubles': 'itf-masculino-duplas',
    'itf women singles': 'itf-feminino-simples',
    'itf women doubles': 'itf-feminino-duplas',
    'tf women doubles': 'itf-feminino-duplas',
    'tf women singles': 'itf-feminino-simples',
    // Flash exhibition buckets ↔ 365Scores International (UTS, invitationals, …)
    'international': 'international',
    'exhibition': 'international',
    'exhibition men': 'international',
    'exhibition women': 'international',
    'exhibition man': 'international',
    'exhibition woman': 'international',
  };

  return map[compact] || map[n] || n;
}

function getTennisDisplayScope(scopeKey = '') {
  const map = {
    'atp-simples': 'ATP - Singles',
    'atp-duplas': 'ATP - Doubles',
    'wta-simples': 'WTA - Singles',
    'wta-duplas': 'WTA - Doubles',
    'challenger-feminino-simples': 'Challenger Women - Singles',
    'challenger-feminino-duplas': 'Challenger Women - Doubles',
    'challenger-simples': 'Challenger - Singles',
    'challenger-duplas': 'Challenger - Doubles',
    'itf-masculino-simples': 'ITF Men - Singles',
    'itf-masculino-duplas': 'ITF Men - Doubles',
    'itf-feminino-simples': 'ITF Women - Singles',
    'itf-feminino-duplas': 'ITF Women - Doubles',
    'international': 'International',
  };

  return map[scopeKey] || scopeKey;
}

function cleanTennisEventBase(text = '') {
  return String(text || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(atp|wta|challenger)\s*[-:]?\s*(d|s|duplas?|doubles?|simples|singles)?\b/gi, ' ')
    .replace(/\bitf\s+(masculino|feminino|men|women)\s*[-:]?\s*(duplas?|doubles?|simples|singles)?\b/gi, ' ')
    .replace(/\b(qualifying|qualification|qualifica(?:cao|ção)|qualifica\w*|quali)\b/gi, ' ')
    .replace(/\b(duplas|doubles|simples|singles)\b/gi, ' ')
    .replace(/\b(masculino|feminino|masculina|feminina|men|women|male|female)\b/gi, ' ')
    .replace(/\s+-\s+/g, ' ')
    .replace(/\b\d{1,2}\b\s*$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function extractTennisEventName(comp = '') {
  let raw = String(comp || '').trim();

  if (raw.includes(':')) {
    raw = raw.split(':').slice(1).join(':').trim();
  }

  if (raw.includes(',')) {
    raw = raw.split(',')[0].trim();
  }

  raw = cleanTennisEventBase(raw);

  const key = norm(raw)
    .replace(/\b(qualifying|qualification|qualifica(?:cao|ção)|qualifica\w*)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const aliases = {
    'napolis': 'Naples',
    'napoli': 'Naples',
    'napoles': 'Naples',
    'naples': 'Naples',
    'morelia': 'Morelia',
    'yokkaichi': 'Yokkaichi',
    'sao paulo': 'Sao Paulo',
    'sao paolo': 'Sao Paulo',
  };

  return aliases[key] || raw || String(comp || '').trim();
}

function getTennisSummaryCompKey(comp = '') {
  return norm(
    extractTennisEventName(comp)
      .replace(/\b[mf]\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function getScopeName(game, sportKey, source) {
  if (sportKey !== 'tennis') {
    return game.country || 'Sem grupo';
  }

  if (source === '365') {
    return extractTennisScopeFrom365Country(game.country || '');
  }

  const fromCompetition = extractTennisScopeFromFlashCompetition(game.competition || '');
  if (fromCompetition) return fromCompetition;

  const fromCountry = extractTennisScopeFromFlashCompetition(game.country || '');
  if (fromCountry) return fromCountry;

  return game.country || 'Sem grupo';
}

function getScopeKey(scopeName, sportKey) {
  if (sportKey === 'tennis') return normalizeTennisScope(scopeName);
  return normCountry(scopeName);
}

function getCompetitionSummaryKey(compName, sportLabel, sportKey = '') {
  if (sportLabel === 'Tênis') return getTennisSummaryCompKey(compName || '');
  const resolvedSportKey = sportKey || '';
  return normComp(compName || '', resolvedSportKey);
}

function getCompetitionDisplayName(compName, sportLabel) {
  return sportLabel === 'Tênis'
    ? extractTennisEventName(compName || '')
    : (compName || '');
}

function groupByScope(games, sportKey, source) {
  const map = {};

  for (const g of games) {
    const scopeName = getScopeName(g, sportKey, source);
    const key = getScopeKey(scopeName, sportKey);

    if (!map[key]) {
      map[key] = {
        countryName: sportKey === 'tennis' ? getTennisDisplayScope(key) : scopeName,
        games: [],
      };
    }

    map[key].games.push(g);
  }

  return map;
}

function build365SummaryMapFromGames(games365, sportKey) {
  const map = {};

  for (const g of games365) {
    const scopeName = getScopeName(g, sportKey, '365');
    const scopeKey = getScopeKey(scopeName, sportKey);

    if (!map[scopeKey]) map[scopeKey] = [];

    const sportLabel = sportKey === 'tennis' ? 'Tênis' : '';
    const summaryKey = getCompetitionSummaryKey(g.competition, sportLabel, sportKey);
    const compKey = `${scopeKey}|||${summaryKey}`;
    const compLabel = getCompetitionDisplayName(g.competition, sportLabel);

    let comp = map[scopeKey].find(c => c._key === compKey);
    if (!comp) {
      comp = {
        _key: compKey,
        name: compLabel,
        matches: [],
        originalCompetition: g.competition,
      };
      map[scopeKey].push(comp);
    }

    comp.matches.push({
      home: g.home,
      away: g.away,
      time: g.time,
      status: g.status,
      originalCompetition: g.competition,
    });
  }

  return map;
}

// ──────────────────────────────────────────────────────────────────────────────
// Matching
// ──────────────────────────────────────────────────────────────────────────────

function isTennisMatch(sportKey) {
  return sportKey === 'tennis';
}

function isTennisDoublesGame(game = {}) {
  const text = norm(`${game.country || ''} ${game.competition || ''}`);
  return text.includes('duplas') || text.includes('doubles');
}

function normalizeTennisPlayer(name = '') {
  const clean = norm(name)
    .replace(/-/g, ' ')
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = clean.split(' ').filter(Boolean);
  const words = tokens.filter(t => t.length > 1);
  const explicitInitials = tokens
    .filter(t => t.length === 1)
    .map(t => (t[0] || '').toLowerCase())
    .filter(Boolean);
  const allInitials = [...new Set([
    ...explicitInitials,
    ...words.map(w => (w[0] || '').toLowerCase()).filter(Boolean),
  ])];

  return {
    raw: clean,
    tokens,
    words,
    explicitInitials,
    allInitials,
    canonical: clean,
  };
}

function tennisWordsOverlap(aWords = [], bWords = []) {
  const maxLen = Math.min(aWords.length, bWords.length);

  for (let len = maxLen; len >= 1; len--) {
    const aStart = aWords.slice(0, len).join(' ');
    const aEnd = aWords.slice(-len).join(' ');
    const bStart = bWords.slice(0, len).join(' ');
    const bEnd = bWords.slice(-len).join(' ');

    if (aEnd && (aEnd === bStart || aEnd === bEnd)) return len;
    if (aStart && (aStart === bEnd || aStart === bStart)) return len;
  }

  return 0;
}

function tennisContainedPhrase(aWords = [], bWords = []) {
  const aText = aWords.join(' ');
  const bText = bWords.join(' ');
  if (!aText || !bText) return 0;

  const minLen = Math.min(aWords.length, bWords.length);
  if (minLen < 2) return 0;

  if (aText.includes(bText) || bText.includes(aText)) return minLen;
  return 0;
}

function tennisInitialsCompatible(a, b) {
  const aExplicit = a.explicitInitials || [];
  const bExplicit = b.explicitInitials || [];
  const aAll = new Set(a.allInitials || []);
  const bAll = new Set(b.allInitials || []);

  const aFitsB = aExplicit.length > 0 && aExplicit.every(ch => bAll.has(ch));
  const bFitsA = bExplicit.length > 0 && bExplicit.every(ch => aAll.has(ch));

  if (aFitsB || bFitsA) return true;

  if (!aExplicit.length && !bExplicit.length) {
    const aFirst = (a.words?.[0] || '')[0] || '';
    const bFirst = (b.words?.[0] || '')[0] || '';
    if (aFirst && bFirst && aFirst === bFirst) return true;
  }

  return false;
}

function tennisPlayerSim(nameA = '', nameB = '') {
  const a = normalizeTennisPlayer(nameA);
  const b = normalizeTennisPlayer(nameB);

  if (!a.words.length || !b.words.length) return 0;
  if (a.canonical === b.canonical) return 1;

  const overlap = tennisWordsOverlap(a.words, b.words);
  const contained = tennisContainedPhrase(a.words, b.words);
  const initialsOk = tennisInitialsCompatible(a, b);
  const sharedWord = a.words.find(word => word.length >= 3 && b.words.includes(word));

  if (overlap >= 3) return initialsOk ? 1 : 0.96;
  if (overlap === 2) return initialsOk ? 0.99 : 0.91;
  if (contained >= 2) return initialsOk ? 0.97 : 0.90;
  if (overlap === 1 && initialsOk) return 0.95;
  if (sharedWord && initialsOk) return 0.95;
  if (sharedWord) return 0.82;

  const tailA = a.words.slice(-2).join(' ');
  const tailB = b.words.slice(-2).join(' ');
  if (tailA && tailB) {
    const tailScore = diceSimilarity(tailA, tailB);
    if (tailScore >= 0.9 && initialsOk) return 0.94;
  }

  const wordTextA = a.words.join(' ');
  const wordTextB = b.words.join(' ');
  let score = diceSimilarity(wordTextA, wordTextB) * 0.82;
  if (initialsOk) score += 0.14;

  const lastA = a.words[a.words.length - 1] || '';
  const lastB = b.words[b.words.length - 1] || '';
  if (lastA && lastB) {
    const lastScore = diceSimilarity(lastA, lastB);
    score = Math.max(score, lastScore * 0.78 + (initialsOk ? 0.14 : 0));
  }

  return Math.min(1, score);
}

function splitTennisPair(text = '') {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  if (clean.includes(' / ')) return clean.split(' / ').map(s => s.trim()).filter(Boolean);
  if (clean.includes('/')) return clean.split('/').map(s => s.trim()).filter(Boolean);
  if (clean.includes(' & ')) return clean.split(' & ').map(s => s.trim()).filter(Boolean);

  return [clean];
}

function tennisPairSim(teamA = '', teamB = '') {
  const a = splitTennisPair(teamA);
  const b = splitTennisPair(teamB);

  if (a.length === 2 && b.length === 2) {
    const sameOrder = (tennisPlayerSim(a[0], b[0]) + tennisPlayerSim(a[1], b[1])) / 2;
    const flipped = (tennisPlayerSim(a[0], b[1]) + tennisPlayerSim(a[1], b[0])) / 2;
    return Math.max(sameOrder, flipped);
  }

  if (a.length === 1 && b.length === 1) {
    return tennisPlayerSim(a[0], b[0]);
  }

  return diceSimilarity(norm(teamA), norm(teamB));
}


function teamSim(h1, a1, h2, a2, sportKey = '', comp1 = '', comp2 = '') {
  const homeHome = teamNameSim(h1, h2, sportKey, comp1, comp2);
  const awayAway = teamNameSim(a1, a2, sportKey, comp1, comp2);
  const homeAway = teamNameSim(h1, a2, sportKey, comp1, comp2);
  const awayHome = teamNameSim(a1, h2, sportKey, comp1, comp2);

  const sameOrder = (homeHome + awayAway) / 2;
  const flipped = (homeAway + awayHome) / 2;
  const minPerTeam = sameOrder >= flipped
    ? Math.min(homeHome, awayAway)
    : Math.min(homeAway, awayHome);

  if (minPerTeam < 0.45) return 0;

  return Math.max(sameOrder, flipped);
}

function smartTeamSim(g365, gFlash, sportKey) {
  if (
    !fixturesCategoryCompatible(
      [g365.home, g365.away, g365.competition],
      [gFlash.home, gFlash.away, gFlash.competition]
    )
  ) {
    return 0;
  }

  if (!isTennisMatch(sportKey)) {
    return teamSim(g365.home, g365.away, gFlash.home, gFlash.away, sportKey, g365.competition, gFlash.competition);
  }

  const isDoubles = isTennisDoublesGame(g365) || isTennisDoublesGame(gFlash);

  if (isDoubles) {
    return Math.max(
      (tennisPairSim(g365.home, gFlash.home) + tennisPairSim(g365.away, gFlash.away)) / 2,
      (tennisPairSim(g365.home, gFlash.away) + tennisPairSim(g365.away, gFlash.home)) / 2
    );
  }

  return Math.max(
    (tennisPlayerSim(g365.home, gFlash.home) + tennisPlayerSim(g365.away, gFlash.away)) / 2,
    (tennisPlayerSim(g365.home, gFlash.away) + tennisPlayerSim(g365.away, gFlash.home)) / 2
  );
}

const { isNormalizedCompPrefixMatch } = require('./lib/competition-prefix');

function compSim(c1, c2, sportKey = '') {
  let n1 = normComp(c1, sportKey);
  let n2 = normComp(c2, sportKey);
  if (/\bk\s*3\b|\bk3\b/.test(n1) && n1.includes('league')) n1 = 'k league 3';
  if (/\bk\s*3\b|\bk3\b/.test(n2) && n2.includes('league')) n2 = 'k league 3';
  if (!n1 || !n2) return 0;
  if (n1 === n2) return 1;
  if (isNormalizedCompPrefixMatch(n1, n2)) return 0.98;
  if (n1.includes(n2) || n2.includes(n1)) return 0.94;
  return diceSimilarity(n1, n2);
}

function parseMinutes(time) {
  if (!time) return null;
  const m = String(time).match(/(\d{1,2}):(\d{2})/);
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
}

function timeDiff(t1, t2) {
  return timeDiffMinutes(t1, t2);
}

function getTimeScore(t1, t2, sportKey) {
  if (isTimezoneBoundaryPair(t1, t2)) return 0.96;

  const diff = timeDiff(t1, t2);

  if (diff === null) return 0.35;
  if (diff === 0) return 1;
  if (diff <= 5) return 0.96;
  if (diff <= 10) return 0.90;
  if (diff <= 15) return 0.84;
  if (diff <= 30) return 0.72;

  return 0;
}

function isRegionalComp(n) {
  const c = norm(n || '');
  return c.includes('tercera rfef') ||
    c.includes('tercera division') ||
    c.includes('segunda rfef') ||
    c.includes('regional preferente') ||
    c.includes('tercera federacion');
}


function isExactTeamsMatch(g365, gFlash, sportKey) {
  const nh1 = resolveContextualNickname(g365.home, sportKey, g365.competition);
  const na1 = resolveContextualNickname(g365.away, sportKey, g365.competition);
  const nh2 = resolveContextualNickname(gFlash.home, sportKey, gFlash.competition);
  const na2 = resolveContextualNickname(gFlash.away, sportKey, gFlash.competition);

  if ((nh1 === nh2 && na1 === na2) || (nh1 === na2 && na1 === nh2)) return true;

  const sameOrder =
    flexibleNameSimilarity(g365.home, gFlash.home) >= 0.88 &&
    flexibleNameSimilarity(g365.away, gFlash.away) >= 0.88;
  const flipped =
    flexibleNameSimilarity(g365.home, gFlash.away) >= 0.88 &&
    flexibleNameSimilarity(g365.away, gFlash.home) >= 0.88;

  return sameOrder || flipped;
}

function minimumTeamThreshold(g365, gFlash, sportKey, cs, td) {
  if (sportKey === 'tennis') {
    if (td === 0) return 0.28;
    if (td !== null && td <= 30) return 0.30;
    return 0.40;
  }

  let threshold = SIM_TEAM;

  if (td === 0) threshold = 0.46;
  else if (td !== null && td <= 5) threshold = 0.50;
  else if (td !== null && td <= 15) threshold = 0.54;
  else threshold = 0.56;

  if (cs >= 0.85) threshold -= 0.03;
  if (isRegionalComp(g365.competition) || isRegionalComp(gFlash.competition)) threshold -= 0.02;
  if (isBasketballSport(sportKey) && normComp(g365.competition).includes('nba')) threshold -= 0.05;

  return Math.max(0.38, threshold);
}

function calculateMatchScore(g365, gFlash, sportKey) {
  // Cheap checks first — International scopes can score thousands of candidates.
  // Exact-team friendlies may still match across large TZ gaps (exactTeams bypasses
  // allowedTimeDiff below); only reject distant pairs that are clearly different teams.
  const td = timeDiff(g365.time, gFlash.time);
  const exactTeamsEarly =
    td !== null && td > 180 && sportKey !== 'tennis'
      ? isExactTeamsMatch(g365, gFlash, sportKey)
      : null;
  if (exactTeamsEarly === false) return null;

  const tennisCompKey365 = sportKey === 'tennis' ? getCompetitionSummaryKey(g365.competition, 'Tênis') : '';
  const tennisCompKeyFlash = sportKey === 'tennis' ? getCompetitionSummaryKey(gFlash.competition, 'Tênis') : '';
  const sameTennisEvent = sportKey === 'tennis' && tennisCompKey365 && tennisCompKey365 === tennisCompKeyFlash;
  const knownEquiv = false;
  const cs = sameTennisEvent ? 1 : compSim(g365.competition, gFlash.competition, sportKey);
  const timeScore = getTimeScore(g365.time, gFlash.time, sportKey);
  const ts = smartTeamSim(g365, gFlash, sportKey);

  let exactTeams;
  if (exactTeamsEarly !== null) {
    exactTeams = exactTeamsEarly;
  } else {
    // Skip another expensive isExactTeamsMatch when team similarity already settles it
    // and we don't need the exact-team time-window bypass.
    const timeNeedsExact =
      sportKey !== 'tennis' &&
      td !== null &&
      td > DIFF_TIME &&
      !(ts >= 0.88 && cs >= 0.95);
    if (!timeNeedsExact && ts >= 0.97) exactTeams = true;
    else if (!timeNeedsExact && ts < 0.72) exactTeams = false;
    else exactTeams = isExactTeamsMatch(g365, gFlash, sportKey);
  }

  const allowedTimeDiff = sportKey === 'tennis'
    ? 30
    : (exactTeams || (ts >= 0.88 && cs >= 0.95) ? 180 : DIFF_TIME);
  const regional = isRegionalComp(g365.competition) || isRegionalComp(gFlash.competition);

  if (!exactTeams && td !== null && td > allowedTimeDiff && !(sportKey === 'tennis' && ts >= 0.78)) {
    return null;
  }

  if (!exactTeams) {
    const threshold = minimumTeamThreshold(g365, gFlash, sportKey, cs, td);
    if (ts < threshold) return null;
  }

  let score;

  if (regional) {
    score = ts * 0.84 + timeScore * 0.14 + cs * 0.02;
  } else {
    score = ts * 0.82 + timeScore * 0.16 + cs * 0.02;
  }

  if (sameTennisEvent) score += 0.08;
  if (knownEquiv) score += 0.06;
  if (sportKey === 'tennis' && td !== null && td <= 30) score += 0.03;
  if (exactTeams) score += 0.10;
  if (td === 0) score += 0.06;
  if (cs >= 0.92) score += 0.01;

  return {
    score,
    ts,
    cs,
    td,
    timeScore,
    exactTeams,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Leitura
// ──────────────────────────────────────────────────────────────────────────────

function resolveCompareSportKey(sportKey = '') {
  const key = String(sportKey || '').trim();
  if (key.startsWith('latam_')) return key.slice(6);
  if (key.startsWith('israel_')) return key.slice(7);
  return key;
}

function resolveCompareTargetDate() {
  try {
    return resolveScanTargetDate();
  } catch (_) {
    return '';
  }
}

function matchBelongsToCompareTarget(match = {}, targetDate = '') {
  if (!targetDate) return true;
  const dateKey = String(match.dateKey || '').trim();
  if (!dateKey) return true;
  return gameBelongsToScanTarget(dateKey, targetDate);
}

function load365(filePath, sportKey = '') {
  const targetDate = resolveCompareTargetDate();
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const games = [];

  for (const group of raw) {
    const groupName = getGroupName(group);

    for (const comp of group.competitions || []) {
      const competitionName = comp.name || comp.competition || 'Sem competição';
      if (shouldIgnoreCompetition(sportKey, competitionName, '365')) continue;

      for (const m of comp.matches || []) {
        if (!m.home || !m.away) continue;
        if (!matchBelongsToCompareTarget(m, targetDate)) continue;
        // Keep postponed/cancelled visible as only365 / statusDiff; drop ended/live.
        if (isStaleFinishedGameStatus(m.status) && !isDeferredGameStatus(m.status)) continue;

        games.push({
          country: groupName,
          competition: competitionName,
          home: m.home,
          away: m.away,
          time: m.time || null,
          status: m.status || 'scheduled',
        });
      }
    }
  }

  return games;
}

function loadFlash(filePath, sportKey = '') {
  const targetDate = resolveCompareTargetDate();
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const games = [];

  for (const group of raw) {
    if (group.home && group.away) {
      if (!matchBelongsToCompareTarget(group, targetDate)) continue;
      if (isStaleFinishedGameStatus(group.status) && !isDeferredGameStatus(group.status)) continue;
      games.push({
        country: getGroupName(group),
        competition: group.competition || group.tournament || group.league || 'Sem competição',
        home: group.home,
        away: group.away,
        time: group.time || null,
        status: group.status || 'scheduled',
      });
      continue;
    }

    const groupName = getGroupName(group);
    for (const comp of group.competitions || []) {
      const competitionName = comp.name || comp.competition || comp.tournament || comp.league || 'Sem competição';
      for (const m of comp.matches || []) {
        if (!m.home || !m.away) continue;
        if (!matchBelongsToCompareTarget(m, targetDate)) continue;
        if (isStaleFinishedGameStatus(m.status) && !isDeferredGameStatus(m.status)) continue;
        games.push({
          country: groupName,
          competition: competitionName,
          home: m.home,
          away: m.away,
          time: m.time || null,
          status: m.status || 'scheduled',
        });
      }
    }
  }

  return games.filter(m => {
    if (shouldIgnoreCompetition(sportKey, m.competition, 'flash')) return false;
    if (sportKey === 'football' && isNonFootballFlashMatch(m)) return false;
    return true;
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Comparação
// ──────────────────────────────────────────────────────────────────────────────

function subMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 3 && b.includes(a)) return true;
  if (b.length >= 3 && a.includes(b)) return true;

  const wa = a.split(' ').filter(w => w.length >= 4);
  const wb = b.split(' ').filter(w => w.length >= 4);
  return wa.length > 0 && wb.length > 0 && wa[0] === wb[0];
}


function normalizeStatusKey(status = '') {
  const s = norm(status || 'scheduled') || 'scheduled';
  if (!s) return 'scheduled';

  if ([
    'scheduled',
    'programacao',
    'programacao ao vivo',
    'programmed',
    'agendado',
    'agenda',
    'fixture',
  ].includes(s)) {
    return 'scheduled';
  }

  return s;
}

function is365StaleLiveStatus(status = '') {
  const s = normalizeStatusKey(status);
  if (s === 'scheduled') return false;
  if (/^set\s*\d/.test(s)) return true;
  return ['ended', 'live', 'finished', 'ft', 'halftime', 'half time'].includes(s);
}

function teamPairLookupKeys(home = '', away = '') {
  const h = normTeam(home);
  const a = normTeam(away);
  if (!h || !a) return [];
  return [`${h}|${a}`, `${a}|${h}`];
}

const TEAM_TOKEN_STOPWORDS = new Set([
  'fc', 'cf', 'sc', 'ac', 'fk', 'sk', 'nk', 'afc', 'cfc', 'ssc', 'asd',
  'united', 'city', 'club', 'real', 'sporting', 'athletic', 'atletico',
  'deportivo', 'racing', 'olympic', 'olympique', 'youth', 'women', 'womens',
  'the', 'and', 'de', 'da', 'do', 'la', 'el', 'team', 'calcio', 'football',
]);

function significantNameTokens(name = '') {
  const tokens = new Set();
  for (const token of normTeam(name).split(/\s+/)) {
    if (token.length >= 3 && !TEAM_TOKEN_STOPWORDS.has(token) && !/^\d+$/.test(token)) {
      tokens.add(token);
    }
  }
  return tokens;
}

function significantTeamTokens(home = '', away = '') {
  const tokens = new Set();
  for (const name of [home, away]) {
    for (const token of significantNameTokens(name)) tokens.add(token);
  }
  return tokens;
}

function teamsShareSignificantToken(gameA = {}, gameB = {}) {
  const a = significantTeamTokens(gameA.home, gameA.away);
  if (!a.size) return false;
  const b = significantTeamTokens(gameB.home, gameB.away);
  for (const token of a) {
    if (b.has(token)) return true;
  }
  return false;
}

function teamsShareBothSides(gameA = {}, gameB = {}) {
  const aHome = significantNameTokens(gameA.home);
  const aAway = significantNameTokens(gameA.away);
  const bHome = significantNameTokens(gameB.home);
  const bAway = significantNameTokens(gameB.away);
  if (!aHome.size || !aAway.size || !bHome.size || !bAway.size) return false;

  const overlap = (left, right) => {
    for (const token of left) {
      if (right.has(token)) return true;
    }
    return false;
  };

  return (
    (overlap(aHome, bHome) && overlap(aAway, bAway)) ||
    (overlap(aHome, bAway) && overlap(aAway, bHome))
  );
}

function buildFlashMatchIndex(gamesFlash, sportKey) {
  const byMinute = new Map();
  const byCompKey = new Map();
  const byTeamPair = new Map();
  const byToken = new Map();
  const noTime = [];

  for (let j = 0; j < gamesFlash.length; j++) {
    const g = gamesFlash[j];
    const minutes = parseMinutes(g.time);
    if (minutes === null) {
      noTime.push(j);
    } else if (!byMinute.has(minutes)) {
      byMinute.set(minutes, [j]);
    } else {
      byMinute.get(minutes).push(j);
    }

    const sportLabel = sportKey === 'tennis' ? 'Tênis' : '';
    const compKey = getCompetitionSummaryKey(g.competition || '', sportLabel, sportKey);
    if (compKey) {
      if (!byCompKey.has(compKey)) byCompKey.set(compKey, [j]);
      else byCompKey.get(compKey).push(j);
    }

    for (const key of teamPairLookupKeys(g.home, g.away)) {
      if (!byTeamPair.has(key)) byTeamPair.set(key, [j]);
      else byTeamPair.get(key).push(j);
    }

    for (const token of significantTeamTokens(g.home, g.away)) {
      if (!byToken.has(token)) byToken.set(token, [j]);
      else byToken.get(token).push(j);
    }
  }

  return { byMinute, byCompKey, byTeamPair, byToken, noTime, total: gamesFlash.length };
}

function collectFlashCandidates(g365, gamesFlash, index, matchedFlash, sportKey) {
  const chosen = new Set();
  const addIndex = j => {
    if (j >= 0 && j < index.total && !matchedFlash.has(j)) chosen.add(j);
  };

  const sportLabel = sportKey === 'tennis' ? 'Tênis' : '';
  const g365CompKey = getCompetitionSummaryKey(g365.competition || '', sportLabel, sportKey);
  const g365Minutes = parseMinutes(g365.time);

  // High-precision hits first (covers exact normalized names even with large time gaps).
  for (const key of teamPairLookupKeys(g365.home, g365.away)) {
    for (const j of index.byTeamPair.get(key) || []) addIndex(j);
  }

  // Cross-competition / renamed reserves: require token hits on both sides (or flipped).
  // Cheap via inverted token index — avoids full cartesian on International.
  const tokenHits = new Set();
  for (const token of significantTeamTokens(g365.home, g365.away)) {
    for (const j of index.byToken.get(token) || []) tokenHits.add(j);
  }
  for (const j of tokenHits) {
    if (teamsShareBothSides(g365, gamesFlash[j])) addIndex(j);
  }

  if (g365CompKey) {
    const sameComp = index.byCompKey.get(g365CompKey) || [];
    // Huge same-comp buckets (Club Friendly under International) must not score the
    // entire cartesian product. Near kickoffs (±DIFF_TIME) stay; farther rows are
    // kept only when team names share a significant token (covers TZ-shifted friendlies).
    const largeSameComp = sportKey !== 'tennis' && sameComp.length > 40;
    const tightWindow = sportKey === 'tennis' ? 30 : DIFF_TIME;

    for (const j of sameComp) {
      if (largeSameComp && g365Minutes !== null) {
        const flashMinutes = parseMinutes(gamesFlash[j].time);
        if (flashMinutes !== null) {
          const delta = Math.abs(flashMinutes - g365Minutes);
          if (delta > tightWindow && !teamsShareSignificantToken(g365, gamesFlash[j])) {
            continue;
          }
        }
      }
      addIndex(j);
    }
  }

  if (g365Minutes !== null) {
    for (let m = g365Minutes - DIFF_TIME; m <= g365Minutes + DIFF_TIME; m++) {
      for (const j of index.byMinute.get(m) || []) addIndex(j);
    }
  } else {
    for (const j of index.noTime) addIndex(j);
  }

  // Do NOT always inject every Flash game without a time — on International/friendlies
  // that turns each 365 row into a near-full cartesian product. Same-comp no-time
  // games are already included via byCompKey; team-pair hits cover renamed kickoffs.

  // Full Flash fallback only on small scopes. Large buckets (esp. International)
  // must not degrade to O(n×m) scoring.
  const FULL_FALLBACK_MAX = 60;
  if (!chosen.size && index.total > 0 && index.total <= FULL_FALLBACK_MAX) {
    for (let j = 0; j < index.total; j++) addIndex(j);
  }

  const candidates = [...chosen];
  if (sportKey !== 'tennis') return candidates;

  const preferred = [];
  const fallback = [];
  for (const j of candidates) {
    const gFCompKey = getCompetitionSummaryKey(gamesFlash[j].competition || '', 'Tênis');
    if (g365CompKey && gFCompKey && g365CompKey === gFCompKey) preferred.push(j);
    else fallback.push(j);
  }

  return preferred.length ? [...preferred, ...fallback] : fallback;
}

function compareCountry(countryName, games365, gamesFlash, sportKey) {
  const matched365 = new Set();
  const matchedFlash = new Set();
  const divergencias_horario = [];
  const divergencias_status = [];
  const divergencias_nome = [];
  const matched_pairs = [];
  const flashIndex = buildFlashMatchIndex(gamesFlash, sportKey);

  for (let i = 0; i < games365.length; i++) {
    const g365 = games365[i];
    let bestScore = -1;
    let bestJ = -1;
    let bestMeta = null;

    const candidateIndexes = collectFlashCandidates(g365, gamesFlash, flashIndex, matchedFlash, sportKey);

    // Same-time candidates first so near-perfect early-exit triggers sooner on large scopes.
    if (candidateIndexes.length > 12) {
      candidateIndexes.sort((left, right) => {
        const diffLeft = timeDiff(g365.time, gamesFlash[left].time);
        const diffRight = timeDiff(g365.time, gamesFlash[right].time);
        const absLeft = diffLeft === null ? 9999 : Math.abs(diffLeft);
        const absRight = diffRight === null ? 9999 : Math.abs(diffRight);
        return absLeft - absRight;
      });
    }

    for (const j of candidateIndexes) {
      const gF = gamesFlash[j];
      const meta = calculateMatchScore(g365, gF, sportKey);
      if (!meta) continue;

      if (meta.score > bestScore) {
        bestScore = meta.score;
        bestJ = j;
        bestMeta = meta;
        // Near-perfect hit — remaining candidates cannot improve matching quality enough
        // to be worth the expensive team-similarity work on large scopes.
        if (meta.exactTeams && meta.td === 0 && meta.cs >= 0.92) break;
      }
    }

    if (bestJ === -1) continue;

    matched365.add(i);
    matchedFlash.add(bestJ);
    const gFlashMatched = gamesFlash[bestJ];
    const diff = bestMeta?.td ?? timeDiff(g365.time, gFlashMatched.time);

    matched_pairs.push({
      competition365: g365.competition,
      competitionFlash: gFlashMatched.competition,
      compKey365: getCompetitionSummaryKey(g365.competition, sportKey === 'tennis' ? 'Tênis' : '', sportKey),
      compKeyFlash: getCompetitionSummaryKey(gFlashMatched.competition, sportKey === 'tennis' ? 'Tênis' : '', sportKey),
      home365: g365.home,
      away365: g365.away,
      homeFlash: gFlashMatched.home,
      awayFlash: gFlashMatched.away,
      time365: g365.time,
      timeFlash: gFlashMatched.time,
      status365: g365.status,
      statusFlash: gFlashMatched.status,
      score: bestMeta?.score || 0,
      teamSimilarity: bestMeta?.ts || 0,
      competitionSimilarity: bestMeta?.cs || 0,
      timeDiff: diff,
    });

    const timeA = String(g365.time || '').trim();
    const timeB = String(gFlashMatched.time || '').trim();
    const shouldFlagTimeDiff = !isTimezoneBoundaryPair(timeA, timeB) && (
      sportKey === 'tennis'
        ? (diff !== null ? diff > 30 : timeA !== timeB)
        : timeA !== timeB
    );

    if (shouldFlagTimeDiff) {
      divergencias_horario.push({
        competicao_365: g365.competition,
        competicao_flash: gFlashMatched.competition,
        home: g365.home,
        away: g365.away,
        home_365: g365.home,
        away_365: g365.away,
        home_flash: gFlashMatched.home,
        away_flash: gFlashMatched.away,
        horario_365: g365.time,
        horario_flash: gFlashMatched.time,
      });
    }

    if (normalizeStatusKey(g365.status) !== normalizeStatusKey(gFlashMatched.status)) {
      divergencias_status.push({
        competicao_365: g365.competition,
        competicao_flash: gFlashMatched.competition,
        home: g365.home,
        away: g365.away,
        home_365: g365.home,
        away_365: g365.away,
        home_flash: gFlashMatched.home,
        away_flash: gFlashMatched.away,
        status_365: g365.status,
        status_flash: gFlashMatched.status,
        horario: g365.time || gFlashMatched.time,
      });
    }

    const tsMatch = smartTeamSim(g365, gFlashMatched, sportKey);

    if (sportKey === 'tennis' && isTennisDoublesGame(g365)) {
      const pairScores = [
        tennisPairSim(g365.home, gFlashMatched.home),
        tennisPairSim(g365.away, gFlashMatched.away),
        tennisPairSim(g365.home, gFlashMatched.away),
        tennisPairSim(g365.away, gFlashMatched.home),
      ];

      const doublesNameOk = Math.max(...pairScores) >= 0.42 || tsMatch >= 0.50;

      if (!doublesNameOk) {
        divergencias_nome.push({
          competicao: g365.competition,
          home_365: g365.home,
          away_365: g365.away,
          home_flash: gFlashMatched.home,
          away_flash: gFlashMatched.away,
          horario: g365.time || gFlashMatched.time,
          similaridade: `${(tsMatch * 100).toFixed(0)}%`,
        });
      }
    } else if (tsMatch < (isBasketballSport(sportKey) ? 0.52 : 0.58)) {
      const nh1 = resolveContextualNickname(g365.home, sportKey, g365.competition);
      const na1 = resolveContextualNickname(g365.away, sportKey, g365.competition);
      const nh2 = resolveContextualNickname(gFlashMatched.home, sportKey, gFlashMatched.competition);
      const na2 = resolveContextualNickname(gFlashMatched.away, sportKey, gFlashMatched.competition);

      const homeOk = subMatch(nh1, nh2) || subMatch(nh1, na2);
      const awayOk = subMatch(na1, na2) || subMatch(na1, nh2);

      if (!homeOk || !awayOk) {
        divergencias_nome.push({
          competicao: g365.competition,
          home_365: g365.home,
          away_365: g365.away,
          home_flash: gFlashMatched.home,
          away_flash: gFlashMatched.away,
          horario: g365.time || gFlashMatched.time,
          similaridade: `${(tsMatch * 100).toFixed(0)}%`,
        });
      }
    }
  }

  const so_no_flash = gamesFlash
    .filter((_, j) => !matchedFlash.has(j))
    .filter(g => !shouldIgnoreCompetitionByRule(sportKey, countryName, 'flash', g.competition))
    .map(g => ({
      competicao: g.competition,
      home: g.home,
      away: g.away,
      horario: g.time,
      status: g.status,
    }));

  const so_no_365 = games365
    .filter((_, i) => !matched365.has(i))
    .filter(g => !shouldIgnoreCompetitionByRule(sportKey, countryName, '365', g.competition))
    .map(g => ({
      competicao: g.competition,
      home: g.home,
      away: g.away,
      horario: g.time,
      status: g.status,
    }));

  return {
    divergencias_horario: divergencias_horario.filter(g => !shouldIgnoreCompareIssue(sportKey, countryName, g)),
    divergencias_status: divergencias_status.filter(g => !shouldIgnoreCompareIssue(sportKey, countryName, g)),
    divergencias_nome: divergencias_nome.filter(g => !shouldIgnoreCompareIssue(sportKey, countryName, g)),
    so_no_flash,
    so_no_365,
    matched_pairs,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Estilo XLSX
// ──────────────────────────────────────────────────────────────────────────────


const COLORS = {
  header: 'FF1F3864',
  headerFont: 'FFFFFFFF',
  soNoFlash: 'FFFFF2CC',
  soNo365: 'FFD9EAF7',
  soNo365Dark: 'FF5B9BD5',
  divHorario: 'FFC9B08F',
  divStatus: 'FFF4CCCC',
  altRow: 'FFF2F2F2',
  country: 'FFD9E1F2',
  successLight: 'FFD9F2D9',
  successDark: 'FF548235',
  danger: 'FFC0504D',
};

function styleHeader(row, color = COLORS.header) {
  row.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    cell.font = { bold: true, color: { argb: COLORS.headerFont }, name: 'Arial', size: 10 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  row.height = 22;
}

function styleDataRow(row, bgColor, rowIdx) {
  const bg = bgColor || (rowIdx % 2 === 0 ? COLORS.altRow : 'FFFFFFFF');

  row.eachCell({ includeEmpty: true }, cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.font = { name: 'Arial', size: 10 };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'hair' },
      bottom: { style: 'hair' },
      left: { style: 'hair' },
      right: { style: 'hair' },
    };
  });

  row.height = 18;
}

function styleCountryRow(row, ws, rowIdx, cols) {
  ws.mergeCells(`A${rowIdx}:${cols}${rowIdx}`);
  ws.getCell(`A${rowIdx}`).value = `▶ ${row.getCell(1).value}`;

  row.eachCell({ includeEmpty: true }, cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.country } };
    cell.font = { bold: true, name: 'Arial', size: 10 };
    cell.alignment = { vertical: 'middle' };
  });

  row.height = 20;
}


function buildCompetitionBridge(matchedPairs = [], sportLabel = '') {
  const edgeCounts = {};
  const label365 = {};
  const labelFlash = {};

  for (const pair of matchedPairs || []) {
    if (!pair) continue;

    const raw365 = String(pair.compKey365 || '').trim();
    const rawFlash = String(pair.compKeyFlash || '').trim();
    const key365 = raw365 || '__SEM_COMP_365__';
    const keyFlash = rawFlash || '__SEM_COMP_FLASH__';

    const edgeKey = `${key365}|||${keyFlash}`;
    edgeCounts[edgeKey] = (edgeCounts[edgeKey] || 0) + 1;

    if (pair.competition365 && !label365[key365]) {
      label365[key365] = getCompetitionDisplayName(pair.competition365, sportLabel) || pair.competition365;
    }

    if (pair.competitionFlash && !labelFlash[keyFlash]) {
      labelFlash[keyFlash] = getCompetitionDisplayName(pair.competitionFlash, sportLabel) || pair.competitionFlash;
    }
  }

  const bestFlashFor365 = {};
  const best365ForFlash = {};

  for (const [edgeKey, count] of Object.entries(edgeCounts)) {
    const [key365, keyFlash] = edgeKey.split('|||');

    if (!bestFlashFor365[key365] || count > bestFlashFor365[key365].count) {
      bestFlashFor365[key365] = { keyFlash, count };
    }

    if (!best365ForFlash[keyFlash] || count > best365ForFlash[keyFlash].count) {
      best365ForFlash[keyFlash] = { key365, count };
    }
  }

  const accepted365 = {};
  const acceptedFlash = {};

  for (const [key365, best] of Object.entries(bestFlashFor365)) {
    const reverse = best365ForFlash[best.keyFlash];
    if (reverse && reverse.key365 === key365) {
      accepted365[key365] = best.keyFlash;
      acceptedFlash[best.keyFlash] = key365;
    }
  }

  return {
    accepted365,
    acceptedFlash,
    label365,
    labelFlash,
  };
}

function getSummaryCompRef(side, compName, sportLabel, bridge) {
  const rawKey = String(getCompetitionSummaryKey(compName || '', sportLabel) || '').trim();
  const safeKey = rawKey || (side === '365' ? '__SEM_COMP_365__' : '__SEM_COMP_FLASH__');
  const display = getCompetitionDisplayName(compName || '', sportLabel) || 'Sem competição';

  if (side === '365') {
    const flashKey = bridge?.accepted365?.[safeKey];
    if (flashKey) {
      return {
        key: `bridge|||${safeKey}|||${flashKey}`,
        label: bridge?.label365?.[safeKey] || bridge?.labelFlash?.[flashKey] || display,
      };
    }
  }

  if (side === 'flash') {
    const key365 = bridge?.acceptedFlash?.[safeKey];
    if (key365) {
      return {
        key: `bridge|||${key365}|||${safeKey}`,
        label: bridge?.label365?.[key365] || bridge?.labelFlash?.[safeKey] || display,
      };
    }
  }

  return {
    key: `${side}|||${safeKey}`,
    label: display,
  };
}

function getSummaryPairRef(comp365Name, compFlashName, sportLabel, bridge) {
  const raw365 = String(getCompetitionSummaryKey(comp365Name || '', sportLabel) || '').trim();
  const rawFlash = String(getCompetitionSummaryKey(compFlashName || '', sportLabel) || '').trim();
  const key365 = raw365 || '__SEM_COMP_365__';
  const keyFlash = rawFlash || '__SEM_COMP_FLASH__';

  if (
    (bridge?.accepted365?.[key365] && bridge.accepted365[key365] === keyFlash) ||
    (bridge?.acceptedFlash?.[keyFlash] && bridge.acceptedFlash[keyFlash] === key365)
  ) {
    return {
      key: `bridge|||${key365}|||${keyFlash}`,
      label:
        bridge?.label365?.[key365] ||
        getCompetitionDisplayName(comp365Name || '', sportLabel) ||
        bridge?.labelFlash?.[keyFlash] ||
        getCompetitionDisplayName(compFlashName || '', sportLabel) ||
        'Sem competição',
    };
  }

  if (comp365Name) return getSummaryCompRef('365', comp365Name, sportLabel, bridge);
  return getSummaryCompRef('flash', compFlashName, sportLabel, bridge);
}

function isBridgeRefKey(key = '') {
  return String(key || '').startsWith('bridge|||');
}

function isCompetitionMatchedInCurrentScan(side, compName, sportLabel, bridge) {
  const ref = getSummaryCompRef(side, compName || '', sportLabel, bridge);
  return isBridgeRefKey(ref.key);
}

function filterOnlyByCurrentMatchedLeagues(items = [], side, sportLabel, bridge) {
  return (items || []).filter(item =>
    isCompetitionMatchedInCurrentScan(side, item.competicao || '', sportLabel, bridge)
  );
}

function getCurrentBridge(result = {}, sportLabel = '') {
  return buildCompetitionBridge(Array.isArray(result?.matched_pairs) ? result.matched_pairs : [], sportLabel);
}

function getSportKeyFromLabel(sportLabel = '') {
  const n = norm(sportLabel);
  if (n === 'futebol') return 'football';
  if (n === 'basquete') return 'basketball';
  if (n === 'basquete eua' || n === 'basketball usa') return 'basketball_usa';
  if (n === 'futebol americano eua' || n === 'american football usa') return 'american_football_usa';
  if (n === 'beisebol eua' || n === 'baseball usa') return 'baseball_usa';
  if (n === 'volei') return 'volleyball';
  if (n === 'hockey') return 'hockey';
  if (n === 'tenis') return 'tennis';
  return '';
}

function loadJsonSafe(filePath, fallback = {}) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.warn(`⚠️ Não foi possível ler ${filePath}: ${e.message}`);
    return fallback;
  }
}

const SHARED_COMPETITIONS_CACHE = {};
const SHARED_COMPETITIONS_INDEX = {};

function normalizeSharedCompetitionRecord(entry = {}, sportKey = '') {
  const scope = String(entry.scope || entry.country || entry.circuit || entry.group || '').trim();
  const competition365 = String(entry.competition365 || entry.comp365 || '').trim();
  const competitionFlash = String(entry.competitionFlash || entry.compFlash || '').trim();

  if (!competition365 || !competitionFlash) return null;

  return {
    scope: sportKey === 'tennis' ? getScopeKey(scope, 'tennis') : normCountry(scope),
    competition365,
    competitionFlash,
    key365: String(getCompetitionSummaryKey(competition365, sportKey === 'tennis' ? 'Tênis' : '') || '').trim(),
    keyFlash: String(getCompetitionSummaryKey(competitionFlash, sportKey === 'tennis' ? 'Tênis' : '') || '').trim(),
  };
}

function buildSharedCompetitionsIndex(pairs = []) {
  const by365 = new Map();
  const byFlash = new Map();
  const byEither = new Map();

  const push = (map, key, pair) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(pair);
  };

  for (const pair of pairs) {
    push(by365, pair.key365, pair);
    push(byFlash, pair.keyFlash, pair);
    push(byEither, pair.key365, pair);
    if (pair.keyFlash !== pair.key365) push(byEither, pair.keyFlash, pair);
  }

  return { by365, byFlash, byEither };
}

function getSharedCompetitions(sportKey = '') {
  if (!sportKey) return [];
  if (SHARED_COMPETITIONS_CACHE[sportKey]) return SHARED_COMPETITIONS_CACHE[sportKey];

  const raw = loadJsonSafe(SHARED_COMPETITIONS_FILE, {});
  const section = Array.isArray(raw[sportKey]) ? raw[sportKey] : [];
  const normalized = [];

  for (const entry of section) {
    const parsed = normalizeSharedCompetitionRecord(entry, sportKey);
    if (parsed?.key365 && parsed?.keyFlash) normalized.push(parsed);
  }

  SHARED_COMPETITIONS_CACHE[sportKey] = normalized;
  SHARED_COMPETITIONS_INDEX[sportKey] = buildSharedCompetitionsIndex(normalized);
  return normalized;
}

function getSharedCompetitionsIndex(sportKey = '') {
  if (!sportKey) return buildSharedCompetitionsIndex([]);
  if (!SHARED_COMPETITIONS_INDEX[sportKey]) getSharedCompetitions(sportKey);
  return SHARED_COMPETITIONS_INDEX[sportKey] || buildSharedCompetitionsIndex([]);
}

function isCompKnownShared(sportKey, compName, side = 'flash', scope = '') {
  const key = String(getCompetitionSummaryKey(compName || '', sportKey === 'tennis' ? 'Tênis' : '') || '').trim();
  if (!key) return false;

  const scopeKey = sportKey === 'tennis' ? getScopeKey(scope || '', 'tennis') : normCountry(scope || '');
  const index = getSharedCompetitionsIndex(sportKey);
  const bucket = side === '365'
    ? (index.by365.get(key) || [])
    : side === 'flash'
      ? (index.byFlash.get(key) || [])
      : (index.byEither.get(key) || []);
  const pairs = bucket.length ? bucket : (index.byEither.get(key) || []);

  for (const pair of pairs) {
    const scopeMatch = !pair.scope || !scopeKey || pair.scope === scopeKey;
    if (!scopeMatch) continue;

    if (side === '365' && pair.key365 === key) return true;
    if (side === 'flash' && pair.keyFlash === key) return true;
    if (pair.key365 === key || pair.keyFlash === key) return true;
  }

  return false;
}

function termFixSuppressionKey(sportKey = '', scope = '', competition = '', side = 'flash') {
  return [
    resolveCompareSportKey(sportKey),
    side || 'flash',
    sportKey === 'tennis' ? getScopeKey(scope || '', 'tennis') : normCountry(scope || ''),
    String(getCompetitionSummaryKey(competition || '', resolveCompareSportKey(sportKey) === 'tennis' ? 'Tênis' : '') || '').trim(),
  ].join('|||');
}

function isCompetitionTermFixSuppressed(sportKey, scope, compName, side, result) {
  const coreKey = resolveCompareSportKey(sportKey);
  const sportLabel = coreKey === 'tennis' ? 'Tênis' : '';
  const bridge = getCurrentBridge(result, sportLabel);

  if (isCompetitionMatchedInCurrentScan(side, compName, sportLabel, bridge)) return true;
  if (isCompKnownShared(coreKey, compName, side, scope)) return true;

  return false;
}

function buildTermFixSuppressedKeys(allResults, defaultSportKey = '') {
  const entries = [];
  const seen = new Set();

  for (const { country, sport, result } of allResults || []) {
    const sportKey = sport || defaultSportKey;
    const scope = country || '';

    const maybeAdd = (competition, side) => {
      const cleanComp = String(competition || '').trim();
      if (!cleanComp) return;
      if (!isCompetitionTermFixSuppressed(sportKey, scope, cleanComp, side, result)) return;

      const key = termFixSuppressionKey(sportKey, scope, cleanComp, side);
      if (seen.has(key)) return;
      seen.add(key);
      entries.push({ sport: sportKey, scope, competition: cleanComp, side });
    };

    for (const pair of result?.matched_pairs || []) {
      maybeAdd(pair.competitionFlash, 'flash');
      maybeAdd(pair.competition365, '365');
    }

    for (const game of result?.so_no_flash || []) {
      maybeAdd(game.competicao || game.competition, 'flash');
    }

    for (const game of result?.so_no_365 || []) {
      maybeAdd(game.competicao || game.competition, '365');
    }
  }

  return entries;
}

function areKnownEquivalentComps(sportKey, comp365, compFlash, scope = '') {
  const pairs = getSharedCompetitions(sportKey);
  const k365 = String(getCompetitionSummaryKey(comp365 || '', sportKey === 'tennis' ? 'Tênis' : '') || '').trim();
  const kFlash = String(getCompetitionSummaryKey(compFlash || '', sportKey === 'tennis' ? 'Tênis' : '') || '').trim();
  if (!k365 || !kFlash) return false;

  const scopeKey = sportKey === 'tennis' ? getScopeKey(scope || '', 'tennis') : normCountry(scope || '');

  for (const pair of pairs) {
    const scopeMatch = !pair.scope || !scopeKey || pair.scope === scopeKey;
    if (!scopeMatch) continue;
    if (pair.key365 === k365 && pair.keyFlash === kFlash) return true;
  }

  return false;
}

function learnSharedCompetitions(sportKey, allResults) {
  const existing = loadJsonSafe(SHARED_COMPETITIONS_FILE, {});
  const current = Array.isArray(existing[sportKey]) ? existing[sportKey] : [];

  const knownPairs = new Set();
  for (const entry of current) {
    const scopeKey = sportKey === 'tennis'
      ? getScopeKey(entry.scope || entry.country || entry.circuit || '', 'tennis')
      : normCountry(entry.scope || entry.country || entry.circuit || '');
    const k365 = String(getCompetitionSummaryKey(entry.competition365 || entry.comp365 || '', sportKey === 'tennis' ? 'Tênis' : '') || '').trim();
    const kFlash = String(getCompetitionSummaryKey(entry.competitionFlash || entry.compFlash || '', sportKey === 'tennis' ? 'Tênis' : '') || '').trim();

    if (k365 && kFlash) knownPairs.add(`${scopeKey}|||${k365}|||${kFlash}`);
  }

  const pairCounts = {};

  for (const { country, result } of allResults || []) {
    if (!Array.isArray(result?.matched_pairs)) continue;

    for (const pair of result.matched_pairs) {
      const comp365 = pair?.competition365 || '';
      const compFlash = pair?.competitionFlash || '';
      if (!comp365 || !compFlash) continue;

      const scopeKey = sportKey === 'tennis' ? getScopeKey(country || '', 'tennis') : normCountry(country || '');
      const k365 = String(getCompetitionSummaryKey(comp365, sportKey === 'tennis' ? 'Tênis' : '') || '').trim();
      const kFlash = String(getCompetitionSummaryKey(compFlash, sportKey === 'tennis' ? 'Tênis' : '') || '').trim();

      if (!k365 || !kFlash || k365 === kFlash) continue;

      const pairKey = `${scopeKey}|||${k365}|||${kFlash}`;
      if (knownPairs.has(pairKey)) continue;

      if (!pairCounts[pairKey]) {
        pairCounts[pairKey] = {
          count: 0,
          scope: country || '',
          competition365: comp365,
          competitionFlash: compFlash,
        };
      }

      pairCounts[pairKey].count++;
    }
  }

  const newPairs = [];
  for (const data of Object.values(pairCounts)) {
    if (data.count >= MIN_MATCHES_TO_LEARN) {
      newPairs.push({
        scope: data.scope,
        competition365: data.competition365,
        competitionFlash: data.competitionFlash,
      });
    }
  }

  if (!newPairs.length) return;

  existing[sportKey] = [...current, ...newPairs];
  delete SHARED_COMPETITIONS_CACHE[sportKey];

  try {
    fs.writeFileSync(SHARED_COMPETITIONS_FILE, JSON.stringify(existing, null, 2), 'utf-8');
    console.log(`  ✅ shared_competitions.json atualizado: +${newPairs.length} par(es) novo(s) em ${sportKey}`);
  } catch (e) {
    console.warn(`  ⚠️ Não foi possível salvar shared_competitions.json: ${e.message}`);
  }
}

const COMPETITION_RULES_CACHE = {};

function normalizeRuleScopeKey(scope = '', sportKey = '') {
  const cleaned = String(scope || '').replace(/[()]/g, ' ').trim();
  if (sportKey === 'tennis') return getScopeKey(cleaned, 'tennis');
  return resolveScopeKey(cleaned);
}

function normalizeCompetitionRuleRecord(entry = {}, side = 'flash', sportKey = '') {
  const scope = String(entry.scope || entry.country || entry.circuit || entry.group || '').trim();
  const comp = String(
    entry.competition ||
    (side === 'flash' ? entry.competitionFlash : entry.competition365) ||
    entry.competitionFlash ||
    entry.competition365 ||
    ''
  ).trim();

  if (!scope || !comp) return null;

  const scopeKey = normalizeRuleScopeKey(scope, sportKey);
  const wildcardCompetition = ['*', 'all', 'all competitions', 'todas', 'todas as competições'].includes(norm(comp));
  const compKey = wildcardCompetition
    ? '*'
    : String(getCompetitionSummaryKey(comp, sportKey === 'tennis' ? 'Tênis' : '') || '').trim();
  if (!compKey) return null;

  return {
    scopeKey,
    compKey,
    key: `${scopeKey}|||${compKey}` ,
  };
}

function getCompetitionRules(sportKey = '') {
  if (!sportKey) return { ignoreFlashOnly: new Set(), ignore365Only: new Set() };
  if (COMPETITION_RULES_CACHE[sportKey]) return COMPETITION_RULES_CACHE[sportKey];

  const raw = loadJsonSafe(COMPETITION_RULES_FILE, {});
  const section = raw?.[sportKey] || {};
  const ignoreFlashOnly = new Set();
  const ignore365Only = new Set();

  for (const item of Array.isArray(section.ignoreFlashOnly) ? section.ignoreFlashOnly : []) {
    const normalized = normalizeCompetitionRuleRecord(item, 'flash', sportKey);
    if (normalized) ignoreFlashOnly.add(normalized.key);
  }

  for (const item of Array.isArray(section.ignore365Only) ? section.ignore365Only : []) {
    const normalized = normalizeCompetitionRuleRecord(item, '365', sportKey);
    if (normalized) ignore365Only.add(normalized.key);
  }

  COMPETITION_RULES_CACHE[sportKey] = { ignoreFlashOnly, ignore365Only };
  return COMPETITION_RULES_CACHE[sportKey];
}

function clearCompetitionRulesCache() {
  for (const key of Object.keys(COMPETITION_RULES_CACHE)) {
    delete COMPETITION_RULES_CACHE[key];
  }
  clearTermAliasesCache();
}

function competitionRuleKeyMatches(ruleCompKey = '', compKey = '') {
  if (!ruleCompKey || !compKey) return false;
  if (ruleCompKey === '*') return true;
  if (ruleCompKey === compKey) return true;
  return compKey.startsWith(`${ruleCompKey} `);
}

function hasMatchingCompetitionRule(ruleSet, scopeKey = '', compKey = '') {
  for (const ruleKey of ruleSet || []) {
    const [ruleScopeKey, ruleCompKey] = String(ruleKey).split('|||');
    const scopeMatches = ruleScopeKey === '*' || ruleScopeKey === scopeKey;
    if (scopeMatches && competitionRuleKeyMatches(ruleCompKey, compKey)) return true;
  }
  return false;
}

function expandCompetitionNamesForIgnore(sportKey = '', competitionName = '') {
  const seed = String(competitionName || '').trim();
  if (!seed) return [];

  const names = new Set([seed]);
  const seedKey = String(getCompetitionSummaryKey(seed, sportKey === 'tennis' ? 'Tênis' : '', sportKey) || '').trim();
  if (!seedKey) return [...names];

  try {
    for (const pair of getSharedCompetitions(resolveCompareSportKey(sportKey))) {
      const key365 = String(pair.key365 || '').trim();
      const keyFlash = String(pair.keyFlash || '').trim();
      if (seedKey !== key365 && seedKey !== keyFlash) continue;
      if (pair.competition365) names.add(String(pair.competition365).trim());
      if (pair.competitionFlash) names.add(String(pair.competitionFlash).trim());
    }
  } catch (_) {
    // Shared memory is optional for ignore matching.
  }

  // Term aliases also link Flash/365 competition labels (e.g. Catarinense 2 ↔ Serie B).
  try {
    const aliases = loadTermAliases();
    for (const alias of aliases || []) {
      if (alias?.type && alias.type !== 'competition') continue;
      const value365 = String(alias.value365 || '').trim();
      const valueFlash = String(alias.valueFlash || '').trim();
      const key365 = value365
        ? String(getCompetitionSummaryKey(value365, sportKey === 'tennis' ? 'Tênis' : '', sportKey) || '').trim()
        : '';
      const keyFlash = valueFlash
        ? String(getCompetitionSummaryKey(valueFlash, sportKey === 'tennis' ? 'Tênis' : '', sportKey) || '').trim()
        : '';
      if (seedKey !== key365 && seedKey !== keyFlash) continue;
      if (value365) names.add(value365);
      if (valueFlash) names.add(valueFlash);
    }
  } catch (_) {
    // Aliases optional.
  }

  return [...names].filter(Boolean);
}

function shouldIgnoreCompetitionByRule(sportKey = '', scopeName = '', side = 'flash', competitionName = '') {
  if (!sportKey || !scopeName || !competitionName) return false;

  const rules = getCompetitionRules(sportKey);
  const scopeKey = sportKey === 'tennis'
    ? getScopeKey(scopeName, 'tennis')
    : resolveScopeKey(scopeName);
  if (!scopeKey) return false;

  const sideRules = side === '365' ? rules.ignore365Only : rules.ignoreFlashOnly;
  const otherRules = side === '365' ? rules.ignoreFlashOnly : rules.ignore365Only;
  const names = expandCompetitionNamesForIgnore(sportKey, competitionName);

  for (const name of names) {
    const compKey = String(getCompetitionSummaryKey(name, sportKey === 'tennis' ? 'Tênis' : '', sportKey) || '').trim();
    if (!compKey) continue;
    // Match the requested side first, then the other side via shared/alias names so
    // ignoring "Catarinense 2" also hides "Catarinense - Serie B" (and the reverse).
    if (hasMatchingCompetitionRule(sideRules, scopeKey, compKey)) return true;
    if (hasMatchingCompetitionRule(otherRules, scopeKey, compKey)) return true;
  }

  return false;
}

function shouldIgnoreCompareIssue(sportKey = '', countryName = '', payload = {}) {
  const competitions = [
    payload.competicao,
    payload.competicao_365,
    payload.competicao_flash,
    payload.competition,
    payload.competition365,
    payload.competitionFlash,
  ].map(value => String(value || '').trim()).filter(Boolean);

  return competitions.some(competition =>
    shouldIgnoreCompetitionByRule(sportKey, countryName, 'flash', competition) ||
    shouldIgnoreCompetitionByRule(sportKey, countryName, '365', competition)
  );
}

function xlsxGamePopularityRank(game = {}, country = '', sportKey = '') {
  return reportRowPopularityRank({
    sport: sportKey,
    country,
    competition: game.competicao || game.competition || '',
    competition365: game.competicao_365 || game.competition365 || game.competicao || '',
    competitionFlash: game.competicao_flash || game.competitionFlash || game.competicao || '',
  }, sportKey);
}

function sortXlsxGamesByPopularity(games, country, sportKey) {
  if (!isFootballSportKey(sportKey) || !Array.isArray(games) || games.length < 2) return games || [];
  return [...games].sort((a, b) => {
    const rankDiff = xlsxGamePopularityRank(a, country, sportKey) - xlsxGamePopularityRank(b, country, sportKey);
    if (rankDiff !== 0) return rankDiff;
    return String(a.horario || a.time || '').localeCompare(String(b.horario || b.time || ''));
  });
}

function countryPopularityRankForXlsx(item = {}, sportKey = '') {
  if (!isFootballSportKey(sportKey)) return Number.POSITIVE_INFINITY;
  const country = item.country || '';
  const result = item.result || {};
  const pools = [
    ...(result.so_no_flash || []),
    ...(result.so_no_365 || []),
    ...(result.divergencias_horario || []),
    ...(result.divergencias_status || []),
    ...(result.divergencias_nome || []),
  ];
  if (!pools.length) return Number.POSITIVE_INFINITY;
  let best = Number.POSITIVE_INFINITY;
  for (const game of pools) {
    const rank = xlsxGamePopularityRank(game, country, sportKey);
    if (rank < best) best = rank;
  }
  return best;
}

function prioritizeFootballResultsForReport(allResults = [], sportKey = '') {
  if (!isFootballSportKey(sportKey)) return allResults || [];
  loadPriorityListSync();

  return [...(allResults || [])]
    .map(item => {
      const result = item?.result || {};
      return {
        ...item,
        result: {
          ...result,
          so_no_flash: sortXlsxGamesByPopularity(result.so_no_flash || [], item.country, sportKey),
          so_no_365: sortXlsxGamesByPopularity(result.so_no_365 || [], item.country, sportKey),
          divergencias_horario: sortXlsxGamesByPopularity(result.divergencias_horario || [], item.country, sportKey),
          divergencias_status: sortXlsxGamesByPopularity(result.divergencias_status || [], item.country, sportKey),
          divergencias_nome: sortXlsxGamesByPopularity(result.divergencias_nome || [], item.country, sportKey),
        },
      };
    })
    .sort((a, b) => {
      const rankDiff = countryPopularityRankForXlsx(a, sportKey) - countryPopularityRankForXlsx(b, sportKey);
      if (rankDiff !== 0) return rankDiff;
      return String(a.country || '').localeCompare(String(b.country || ''));
    });
}

// ──────────────────────────────────────────────────────────────────────────────
// XLSX
// ──────────────────────────────────────────────────────────────────────────────


async function buildXlsx(allResults, xlsxOut, sportLabel, data365ByCountry, byFlash) {
  const sportKey = getSportKeyFromLabel(sportLabel);
  const orderedResults = prioritizeFootballResultsForReport(allResults, sportKey);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Compare365';
  wb.created = new Date();

  const scopeLabel = sportLabel === 'Tênis' ? 'Circuito' : 'País';
  const summaryScopeLabel = sportLabel === 'Tênis' ? 'Circuito / Competição' : 'País / Competição';

  {
    const ws = wb.addWorksheet('Legenda', { tabColor: { argb: 'FF1F3864' } });
    ws.columns = [
      { header: 'Cor', key: 'cor', width: 22 },
      { header: 'Uso', key: 'uso', width: 38 },
      { header: 'Descrição', key: 'desc', width: 80 },
    ];
    styleHeader(ws.getRow(1));

    const legendRows = [
      { cor: 'Verde escuro', uso: 'Resumo - país/circuito perfeito', desc: 'Tudo bateu: quantidades por competição iguais e sem divergência de horário, status ou nome.', fill: COLORS.successDark, font: 'FFFFFFFF' },
      { cor: 'Verde claro', uso: 'Resumo - competição perfeita', desc: 'Mesma competição com mesma quantidade de jogos entre 365 e Flash.', fill: COLORS.successLight, font: 'FF1A6B1A' },
      { cor: 'Amarelo', uso: 'Só no Flashscore', desc: 'Jogos ou competições encontrados apenas no Flashscore.', fill: COLORS.soNoFlash, font: 'FF7F6000' },
      { cor: 'Azul', uso: 'Só na 365', desc: 'Jogos ou competições encontrados apenas na 365Scores.', fill: COLORS.soNo365, font: 'FF1F4E78' },
      { cor: 'Marrom', uso: 'Divergência de horário', desc: 'Mesmo jogo casado, mas horário diferente entre as fontes.', fill: COLORS.divHorario, font: 'FF1F1F1F' },
      { cor: 'Rosa', uso: 'Divergência de status', desc: 'Mesmo jogo casado, mas status diferente entre as fontes.', fill: COLORS.divStatus, font: 'FF1F1F1F' },
      { cor: 'Vermelho', uso: 'Resumo - diferença', desc: 'Diferença de quantidade de jogos na competição ou divergência relevante no país/circuito.', fill: COLORS.danger, font: 'FFFFFFFF' },
    ];

    let ri = 2;
    for (const item of legendRows) {
      const row = ws.addRow({ cor: item.cor, uso: item.uso, desc: item.desc });
      styleDataRow(row, item.fill, ri);
      row.eachCell({ includeEmpty: true }, cell => {
        cell.font = { name: 'Arial', size: 10, color: { argb: item.font || 'FF000000' } };
      });
      ri++;
    }

    ws.autoFilter = { from: 'A1', to: 'C1' };
  }

  {
    const ws = wb.addWorksheet('Só no Flashscore', { tabColor: { argb: 'FFFFAA00' } });
    ws.columns = [
      { header: scopeLabel, key: 'country', width: 24 },
      { header: 'Competição', key: 'comp', width: 38 },
      { header: 'Casa Flash', key: 'home', width: 32 },
      { header: 'Fora Flash', key: 'away', width: 32 },
      { header: 'Horário', key: 'horario', width: 12 },
      { header: 'Status', key: 'status', width: 16 },
    ];

    styleHeader(ws.getRow(1));
    let ri = 2;

    for (const { country, result } of orderedResults) {
      const bridge = getCurrentBridge(result, sportLabel);
      const onlyFlashRows = filterOnlyByCurrentMatchedLeagues(result.so_no_flash || [], 'flash', sportLabel, bridge);
      if (!onlyFlashRows.length) continue;

      const cr = ws.addRow({});
      cr.getCell(1).value = country;
      styleCountryRow(cr, ws, ri, 'F');
      ri++;

      for (const g of onlyFlashRows) {
        const r = ws.addRow({
          country: '',
          comp: g.competicao,
          home: g.home,
          away: g.away,
          horario: g.horario || '—',
          status: g.status,
        });
        styleDataRow(r, COLORS.soNoFlash, ri++);
      }
    }

    ws.autoFilter = { from: 'A1', to: 'F1' };
  }

  {
    const ws = wb.addWorksheet('Divergência Horário e Status', { tabColor: { argb: 'FF5B9BD5' } });
    ws.columns = [
      { header: scopeLabel, key: 'country', width: 22 },
      { header: 'Tipo', key: 'tipo', width: 16 },
      { header: 'Competição 365', key: 'comp365', width: 34 },
      { header: 'Competição Flash', key: 'compFlash', width: 34 },
      { header: 'Casa', key: 'home', width: 28 },
      { header: 'Fora', key: 'away', width: 28 },
      { header: '365', key: 'v365', width: 16 },
      { header: 'Flash', key: 'vFlash', width: 16 },
      { header: 'Horário Ref.', key: 'horario', width: 12 },
    ];

    styleHeader(ws.getRow(1));
    let ri = 2;

    for (const { country, result } of orderedResults) {
      const hasAny = (result.divergencias_horario?.length || 0) + (result.divergencias_status?.length || 0);
      if (!hasAny) continue;

      const cr = ws.addRow({});
      cr.getCell(1).value = country;
      styleCountryRow(cr, ws, ri, 'I');
      ri++;

      for (const g of result.divergencias_horario || []) {
        const r = ws.addRow({
          country: '',
          tipo: 'Horário',
          comp365: g.competicao_365,
          compFlash: g.competicao_flash,
          home: g.home,
          away: g.away,
          v365: g.horario_365 || '—',
          vFlash: g.horario_flash || '—',
          horario: g.horario_365 || g.horario_flash || '—',
        });
        styleDataRow(r, COLORS.divHorario, ri++);
      }

      for (const g of result.divergencias_status || []) {
        const r = ws.addRow({
          country: '',
          tipo: 'Status',
          comp365: g.competicao_365,
          compFlash: g.competicao_flash,
          home: g.home,
          away: g.away,
          v365: g.status_365 || '—',
          vFlash: g.status_flash || '—',
          horario: g.horario || '—',
        });
        styleDataRow(r, COLORS.divStatus, ri++);
      }
    }

    ws.autoFilter = { from: 'A1', to: 'I1' };
  }

  {
    const ws = wb.addWorksheet('Divergência de Nome', { tabColor: { argb: 'FF00B050' } });
    ws.columns = [
      { header: scopeLabel, key: 'country', width: 22 },
      { header: 'Competição', key: 'comp', width: 34 },
      { header: 'Casa 365', key: 'home365', width: 28 },
      { header: 'Fora 365', key: 'away365', width: 28 },
      { header: 'Casa Flash', key: 'homeFlash', width: 28 },
      { header: 'Fora Flash', key: 'awayFlash', width: 28 },
      { header: 'Horário', key: 'horario', width: 10 },
      { header: 'Similaridade', key: 'sim', width: 14 },
    ];

    styleHeader(ws.getRow(1));
    let ri = 2;

    for (const { country, result } of orderedResults) {
      if (!result.divergencias_nome?.length) continue;

      const cr = ws.addRow({});
      cr.getCell(1).value = country;
      styleCountryRow(cr, ws, ri, 'H');
      ri++;

      for (const g of result.divergencias_nome) {
        const r = ws.addRow({
          country: '',
          comp: g.competicao,
          home365: g.home_365,
          away365: g.away_365,
          homeFlash: g.home_flash,
          awayFlash: g.away_flash,
          horario: g.horario || '—',
          sim: g.similaridade,
        });
        styleDataRow(r, 'FFE2EFDA', ri++);
      }
    }

    ws.autoFilter = { from: 'A1', to: 'H1' };
  }

  {
    const ws = wb.addWorksheet('Resumo', { tabColor: { argb: 'FF7030A0' } });
    ws.columns = [
      { header: summaryScopeLabel, key: 'label', width: 34 },
      { header: 'Jogos 365', key: 'j365', width: 12 },
      { header: 'Jogos Flash', key: 'jFlash', width: 12 },
      { header: 'Só 365', key: 'so365', width: 12 },
      { header: 'Só Flash', key: 'soFlash', width: 12 },
      { header: 'Div. Horário', key: 'divHor', width: 14 },
      { header: 'Div. Status', key: 'divStatus', width: 14 },
      { header: 'Div. Nome', key: 'divNome', width: 12 },
      { header: 'Total Div.', key: 'total', width: 12 },
    ];

    styleHeader(ws.getRow(1));

    let ri = 2;
    let tSo365 = 0;
    let tSoFlash = 0;
    let tDivHor = 0;
    let tDivStatus = 0;
    let tDivNome = 0;
    let tJ365 = 0;
    let tJFlash = 0;

    for (const item of (orderedResults || [])) {
      if (!item || !item.result) continue;

      const country = item.country || 'Sem grupo';
      const result = item.result || {};

      const bridge = getCurrentBridge(result, sportLabel);
      const only365Rows = filterOnlyByCurrentMatchedLeagues(result.so_no_365 || [], '365', sportLabel, bridge);
      const onlyFlashRows = filterOnlyByCurrentMatchedLeagues(result.so_no_flash || [], 'flash', sportLabel, bridge);
      const s365 = only365Rows.length;
      const sF = onlyFlashRows.length;
      const dH = Array.isArray(result.divergencias_horario) ? result.divergencias_horario.length : 0;
      const dS = Array.isArray(result.divergencias_status) ? result.divergencias_status.length : 0;
      const dN = Array.isArray(result.divergencias_nome) ? result.divergencias_nome.length : 0;

      const countryKey = sportLabel === 'Tênis'
        ? getScopeKey(country, 'tennis')
        : normCountry(country);

      const comps365 = Array.isArray(data365ByCountry[countryKey]) ? data365ByCountry[countryKey] : [];
      const flashGames = Array.isArray(byFlash[countryKey]?.games) ? byFlash[countryKey].games : [];
      const matchedPairs = Array.isArray(result.matched_pairs) ? result.matched_pairs.filter(Boolean) : [];

      const compStats = {};
      const compOrder = [];

      function ensureCompStat(key, label) {
        const safeLabel = (label || 'Sem competição').trim() || 'Sem competição';
        const normalizedKey = String(key || '').trim();
        const safeKey = normalizedKey || `sem_competicao|||${norm(safeLabel)}|||${compOrder.length}`;

        if (!compStats[safeKey]) {
          compStats[safeKey] = {
            key: safeKey,
            label: safeLabel,
            j365: 0,
            jFlash: 0,
            so365: 0,
            soFlash: 0,
            divHor: 0,
            divStatus: 0,
            divNome: 0,
          };
          compOrder.push(safeKey);
        } else if (safeLabel && !compStats[safeKey].label) {
          compStats[safeKey].label = safeLabel;
        }
        return compStats[safeKey];
      }

      for (const comp of comps365) {
        const compOriginal = comp.matches?.[0]?.originalCompetition || comp.originalCompetition || comp.name;
        if (shouldIgnoreCompetitionByRule(sportKey, country, '365', compOriginal)) continue;
        const ref = getSummaryCompRef('365', compOriginal, sportLabel, bridge);
        if (!isBridgeRefKey(ref.key)) continue;
        const stat = ensureCompStat(ref.key, ref.label || comp.name);
        stat.j365 += comp.matches?.length || 0;
      }

      for (const g of flashGames) {
        if (shouldIgnoreCompetitionByRule(sportKey, country, 'flash', g.competition || '')) continue;
        const ref = getSummaryCompRef('flash', g.competition || '', sportLabel, bridge);
        if (!isBridgeRefKey(ref.key)) continue;
        const stat = ensureCompStat(ref.key, ref.label);
        stat.jFlash += 1;
      }

      for (const g of only365Rows) {
        const ref = getSummaryCompRef('365', g.competicao || '', sportLabel, bridge);
        if (!isBridgeRefKey(ref.key)) continue;
        const stat = ensureCompStat(ref.key, ref.label);
        stat.so365 += 1;
      }

      for (const g of onlyFlashRows) {
        const ref = getSummaryCompRef('flash', g.competicao || '', sportLabel, bridge);
        if (!isBridgeRefKey(ref.key)) continue;
        const stat = ensureCompStat(ref.key, ref.label);
        stat.soFlash += 1;
      }

      for (const g of result.divergencias_horario || []) {
        const ref = getSummaryPairRef(g.competicao_365 || '', g.competicao_flash || '', sportLabel, bridge);
        const stat = ensureCompStat(ref.key, ref.label);
        stat.divHor += 1;
      }

      for (const g of result.divergencias_status || []) {
        const ref = getSummaryPairRef(g.competicao_365 || '', g.competicao_flash || '', sportLabel, bridge);
        const stat = ensureCompStat(ref.key, ref.label);
        stat.divStatus += 1;
      }

      for (const g of result.divergencias_nome || []) {
        const ref = getSummaryCompRef('365', g.competicao || '', sportLabel, bridge);
        if (!isBridgeRefKey(ref.key)) continue;
        const stat = ensureCompStat(ref.key, ref.label);
        stat.divNome += 1;
      }

      const countryGames365 = comps365.reduce((s, c) => {
        const compOriginal = c.matches?.[0]?.originalCompetition || c.originalCompetition || c.name;
        if (shouldIgnoreCompetitionByRule(sportKey, country, '365', compOriginal)) return s;
        if (!isCompetitionMatchedInCurrentScan('365', compOriginal, sportLabel, bridge)) return s;
        return s + (c.matches?.length || 0);
      }, 0);
      const countryGamesFlash = flashGames.filter(g => {
        if (shouldIgnoreCompetitionByRule(sportKey, country, 'flash', g.competition || '')) return false;
        return isCompetitionMatchedInCurrentScan('flash', g.competition || '', sportLabel, bridge);
      }).length;

      if (!compOrder.length) {
        continue;
      }

      tSo365 += s365;
      tSoFlash += sF;
      tDivHor += dH;
      tDivStatus += dS;
      tDivNome += dN;
      tJ365 += countryGames365;
      tJFlash += countryGamesFlash;

      const allCompetitionsMatch = compOrder.every(key => {
        const stat = compStats[key];
        return stat.j365 === stat.jFlash &&
          stat.so365 === 0 &&
          stat.soFlash === 0 &&
          stat.divHor === 0 &&
          stat.divStatus === 0 &&
          stat.divNome === 0;
      });

      const countryOnly365 = s365 > 0 && countryGamesFlash === 0 && dH === 0 && dS === 0 && dN === 0;
      const countryFill = allCompetitionsMatch ? COLORS.successDark : (countryOnly365 ? COLORS.soNo365Dark : COLORS.danger);
      const countryFont = allCompetitionsMatch || countryOnly365 ? 'FFFFFFFF' : 'FFFFFFFF';

      const cr = ws.addRow({
        label: country,
        j365: countryGames365,
        jFlash: countryGamesFlash,
        so365: s365,
        soFlash: sF,
        divHor: dH,
        divStatus: dS,
        divNome: dN,
        total: s365 + sF + dH + dS + dN,
      });

      cr.eachCell({ includeEmpty: true }, cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: countryFill },
        };
        cell.font = {
          bold: true,
          name: 'Arial',
          size: 10,
          color: { argb: countryFont },
        };
        cell.alignment = { vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      cr.height = 20;
      ri++;

      for (const compKey of (isFootballSportKey(sportKey)
        ? [...compOrder].sort((a, b) => {
          const rankA = competitionPopularityRank(compStats[a]?.label || '', country, sportKey);
          const rankB = competitionPopularityRank(compStats[b]?.label || '', country, sportKey);
          if (rankA !== rankB) return rankA - rankB;
          return String(compStats[a]?.label || a).localeCompare(String(compStats[b]?.label || b));
        })
        : compOrder)) {
        const stat = compStats[compKey];
        const compLabel = stat.label || compKey || 'Sem competição';
        const totalDivComp = stat.so365 + stat.soFlash + stat.divHor + stat.divStatus + stat.divNome;

        let rowBg = 'FFFFFFFF';
        let fontColor = 'FF444444';

        if (stat.j365 === stat.jFlash && totalDivComp === 0 && stat.j365 > 0) {
          rowBg = COLORS.successLight;
          fontColor = 'FF1A6B1A';
        } else if (stat.j365 > 0 && stat.jFlash === 0) {
          rowBg = COLORS.soNo365;
          fontColor = 'FF1F4E78';
        } else if (stat.jFlash > 0 && stat.j365 === 0) {
          rowBg = COLORS.soNoFlash;
          fontColor = 'FF7F6000';
        } else if (totalDivComp > 0 || stat.j365 !== stat.jFlash) {
          rowBg = COLORS.danger;
          fontColor = 'FFFFFFFF';
        }

        const r = ws.addRow({
          label: `    ${compLabel}`,
          j365: stat.j365 || '',
          jFlash: stat.jFlash || '',
          so365: stat.so365 || '',
          soFlash: stat.soFlash || '',
          divHor: stat.divHor || '',
          divStatus: stat.divStatus || '',
          divNome: stat.divNome || '',
          total: totalDivComp || '',
        });

        styleDataRow(r, rowBg, ri);
        ws.getCell(`A${ri}`).font = {
          italic: true,
          name: 'Arial',
          size: 9,
          color: { argb: fontColor },
        };
        ri++;
      }
    }

    const tot = ws.addRow({
      label: 'TOTAL',
      j365: tJ365,
      jFlash: tJFlash,
      so365: tSo365,
      soFlash: tSoFlash,
      divHor: tDivHor,
      divStatus: tDivStatus,
      divNome: tDivNome,
      total: tSo365 + tSoFlash + tDivHor + tDivStatus + tDivNome,
    });

    styleHeader(tot, 'FF1F3864');
  }

  if (sportLabel === 'Basquete' || sportLabel === 'Basquete EUA' || sportLabel === 'Hockey') {
    const euaResult = (allResults || []).find(r =>
      r &&
      r.country &&
      (
        normCountry(r.country) === 'eua' ||
        normCountry(r.country) === 'estados unidos' ||
        normCountry(r.country) === 'usa'
      )
    );

    if (euaResult && euaResult.result) {
      const ws = wb.addWorksheet('⭐ EUA', { tabColor: { argb: 'FF002868' } });
      ws.columns = [
        { header: 'Tipo', key: 'tipo', width: 18 },
        { header: 'Competição', key: 'comp', width: 36 },
        { header: 'Casa', key: 'home', width: 30 },
        { header: 'Fora', key: 'away', width: 30 },
        { header: 'Horário', key: 'horario', width: 18 },
        { header: 'Status/Obs', key: 'obs', width: 22 },
      ];

      styleHeader(ws.getRow(1));
      let ri = 2;
      const res = euaResult.result || {};

      for (const g of res.so_no_365 || []) {
        const r = ws.addRow({
          tipo: '🔵 Só 365',
          comp: g.competicao,
          home: g.home,
          away: g.away,
          horario: g.horario || '—',
          obs: g.status,
        });
        styleDataRow(r, COLORS.soNo365, ri++);
      }

      for (const g of res.so_no_flash || []) {
        const r = ws.addRow({
          tipo: '🟡 Só Flash',
          comp: g.competicao,
          home: g.home,
          away: g.away,
          horario: g.horario || '—',
          obs: g.status,
        });
        styleDataRow(r, COLORS.soNoFlash, ri++);
      }

      for (const g of res.divergencias_horario || []) {
        const r = ws.addRow({
          tipo: '🔵 Div. Horário',
          comp: g.competicao_365,
          home: g.home,
          away: g.away,
          horario: `${g.horario_365 || '—'} / ${g.horario_flash || '—'}`,
          obs: '',
        });
        styleDataRow(r, COLORS.divHorario, ri++);
      }

      for (const g of res.divergencias_status || []) {
        const r = ws.addRow({
          tipo: '🟣 Div. Status',
          comp: g.competicao_365,
          home: g.home,
          away: g.away,
          horario: g.horario || '—',
          obs: `${g.status_365 || '—'} / ${g.status_flash || '—'}`,
        });
        styleDataRow(r, COLORS.divStatus, ri++);
      }

      ws.autoFilter = { from: 'A1', to: 'F1' };
    }
  }

  await wb.xlsx.writeFile(xlsxOut);
  console.log(`\n📊 xlsx salvo: ${xlsxOut}`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Telegram
// ──────────────────────────────────────────────────────────────────────────────

async function sendToTelegram(allResults, xlsxOut, sportLabel) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('⚠️ Telegram não configurado — pulando.');
    return;
  }

  const tSo365 = allResults.reduce((s, r) => {
    const bridge = getCurrentBridge(r.result || {}, sportLabel);
    return s + filterOnlyByCurrentMatchedLeagues(r.result?.so_no_365 || [], '365', sportLabel, bridge).length;
  }, 0);
  const tDivHor = allResults.reduce((s, r) => s + (r.result.divergencias_horario?.length || 0), 0);
  const tDivStatus = allResults.reduce((s, r) => s + (r.result.divergencias_status?.length || 0), 0);
  const tDivNome = allResults.reduce((s, r) => {
    const bridge = getCurrentBridge(r.result || {}, sportLabel);
    return s + (r.result.divergencias_nome || []).filter(g =>
      isCompetitionMatchedInCurrentScan('365', g.competicao || '', sportLabel, bridge)
    ).length;
  }, 0);

  const SPORT_EMOJIS = {
    'Futebol': '⚽',
    'Basquete': '🏀',
    'Hockey': '🏒',
    'Vôlei': '🏐',
    'Tênis': '🎾',
  };

  const emoji = SPORT_EMOJIS[sportLabel] || '🏅';

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const d = `${String(tomorrow.getDate()).padStart(2, '0')}/${String(tomorrow.getMonth() + 1).padStart(2, '0')}/${tomorrow.getFullYear()}`;

  const caption =
    `${emoji} *Daily ${sportLabel} está pronto! — ${d}*\n\n` +
    `🔵 Só na 365: *${tSo365}*\n` +
    `🌸 Status: *${tDivStatus}*\n` +
    `🟤 Horário: *${tDivHor}*\n` +
    `🟢 Nome: *${tDivNome}*`;

  const form = new FormData();
  form.append('chat_id', CHAT_ID);
  form.append('caption', caption);
  form.append('parse_mode', 'Markdown');
  form.append('document', fs.createReadStream(xlsxOut), {
    filename: path.basename(xlsxOut),
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(20000),
  });

  if (res.ok) console.log('✅ Telegram: enviado com sucesso');
  else console.error('❌ Telegram erro:', await res.text());
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────

async function runCompare(sportKey, configOverride = null, options = {}) {
  const config = configOverride || SPORT_CONFIGS[sportKey];
  if (!config) {
    throw new Error(`Esporte desconhecido: ${sportKey}. Use: ${Object.keys(SPORT_CONFIGS).join(', ')}`);
  }

  const skipTelegram = options.skipTelegram ?? process.env.UI_SCAN_MODE === '1';
  const skipXlsx = options.skipXlsx ?? process.env.UI_SCAN_MODE === '1';

  console.log(`\n🏅 Comparando: ${config.label}`);

  if (!fs.existsSync(config.file365)) throw new Error(`Não encontrado: ${config.file365}`);
  if (!fs.existsSync(config.fileFlash)) throw new Error(`Não encontrado: ${config.fileFlash}`);

  const games365 = load365(config.file365, sportKey);
  const gamesFlash = loadFlash(config.fileFlash, sportKey);

  console.log(`  365Scores: ${games365.length} jogos`);
  console.log(`  Flashscore: ${gamesFlash.length} jogos`);

  const by365 = groupByScope(games365, sportKey, '365');
  const byFlash = groupByScope(gamesFlash, sportKey, 'flash');
  const allKeys = new Set([...Object.keys(by365), ...Object.keys(byFlash)]);

  console.log(`\n🌍 ${sportKey === 'tennis' ? 'Circuitos' : 'Países'}: ${allKeys.size}`);

  const allResults = [];

  for (const key of allKeys) {
    const countryName =
      by365[key]?.countryName ||
      byFlash[key]?.countryName?.replace(/[:.]+$/, '').trim() ||
      key;

    // Keep ignored competitions in the matching pool. ignoreFlashOnly / ignore365Only
    // only suppress post-match "só Flash" / "só 365" reporting — removing them here
    // broke cross-name matches (e.g. Argentina Primera B Metropolitana ↔ Primera B).
    const g365 = by365[key]?.games || [];
    const gFlash = byFlash[key]?.games || [];

    console.log(`  ▶ ${countryName} — 365: ${g365.length} | Flash: ${gFlash.length}`);

    const startedAt = Date.now();
    const result = compareCountry(countryName, g365, gFlash, sportKey);
    const elapsedMs = Date.now() - startedAt;

    console.log(
      `    Só 365: ${result.so_no_365.length} | Só Flash: ${result.so_no_flash.length} | Div.Horário: ${result.divergencias_horario.length} | Div.Status: ${result.divergencias_status.length} | Div.Nome: ${result.divergencias_nome.length}`
    );
    if (elapsedMs >= 400) {
      console.log(`    ⏱ ${countryName}: ${(elapsedMs / 1000).toFixed(1)}s`);
    }

    allResults.push({ country: countryName, result });
  }

  const data365ByCountry = build365SummaryMapFromGames(games365, sportKey);

  if (!skipXlsx) {
    console.log('\n📊 Gerando xlsx...');
    await buildXlsx(allResults, config.xlsxOut, config.label, data365ByCountry, byFlash);
  } else {
    console.log('\n📊 XLSX ignorado (modo UI).');
  }

  if (!skipTelegram) {
    console.log('\n📤 Enviando para o Telegram...');
    await sendToTelegram(allResults, config.xlsxOut, config.label);
  } else {
    console.log('\n📤 Telegram ignorado (modo UI).');
  }

  console.log(`\n✅ ${config.label} concluído!`);
  return allResults;
}

async function writeSportXlsx(sportKey, allResults, configOverride = null) {
  const config = configOverride || SPORT_CONFIGS[sportKey];
  if (!config) {
    throw new Error(`Esporte desconhecido: ${sportKey}`);
  }

  const games365 = load365(config.file365, sportKey);
  const gamesFlash = loadFlash(config.fileFlash, sportKey);
  const data365ByCountry = build365SummaryMapFromGames(games365, sportKey);
  const byFlash = groupByScope(gamesFlash, sportKey, 'flash');

  console.log('\n📊 Gerando xlsx...');
  await buildXlsx(allResults, config.xlsxOut, config.label, data365ByCountry, byFlash);
  return config.xlsxOut;
}

function getLatamSportConfig(sportKey) {
  const base = SPORT_CONFIGS[sportKey];
  if (!base) throw new Error(`Esporte desconhecido para LATAM: ${sportKey}`);
  const dir = path.join(__dirname, 'output', 'latam', sportKey);
  return {
    label: `LATAM ${base.label}`,
    file365: path.join(dir, path.basename(base.file365)),
    fileFlash: path.join(dir, path.basename(base.fileFlash)),
    xlsxOut: path.join(dir, `latam_${path.basename(base.xlsxOut)}`),
  };
}

async function runCompareLatam(sportKey, options = {}) {
  return runCompare(sportKey, getLatamSportConfig(sportKey), options);
}

function getIsraelSportConfig(sportKey) {
  const base = SPORT_CONFIGS[sportKey];
  if (!base) throw new Error(`Esporte desconhecido para Israel: ${sportKey}`);
  const dir = path.join(__dirname, 'output', 'israel', sportKey);
  return {
    label: `Israel ${base.label}`,
    file365: path.join(dir, path.basename(base.file365)),
    fileFlash: path.join(dir, path.basename(base.fileFlash)),
    xlsxOut: path.join(dir, `israel_${path.basename(base.xlsxOut)}`),
  };
}

async function runCompareIsrael(sportKey, options = {}) {
  return runCompare(sportKey, getIsraelSportConfig(sportKey), options);
}

if (require.main === module) {
  const arg = (process.argv[2] || 'all').toLowerCase();

  const run = async () => {
    if (arg === 'all') {
      const sports = Object.keys(SPORT_CONFIGS);

      for (const sport of sports) {
        try {
          await runCompare(sport);
        } catch (e) {
          console.error(`\n❌ Erro em ${sport}: ${e.message}`);
        }
      }

      console.log('\n✅ Comparação de todos os esportes finalizada!');
      return;
    }

    await runCompare(arg);
  };

  run().catch(e => {
    console.error(e.message);
    process.exit(1);
  });
}

module.exports = {
  runCompare,
  writeSportXlsx,
  getLatamSportConfig,
  runCompareLatam,
  getIsraelSportConfig,
  runCompareIsrael,
  clearCompetitionRulesCache,
  expandCompetitionNamesForIgnore,
  shouldIgnoreCompetitionByRule,
  getCurrentBridge,
  isCompetitionMatchedInCurrentScan,
  isCompKnownShared,
  isCompetitionTermFixSuppressed,
  buildTermFixSuppressedKeys,
  termFixSuppressionKey,
  resolveCompareSportKey,
  normCountry,
  normalizeTennisScope,
  getScopeKey,
  groupByScope,
  compareCountry,
  LATAM_CORE_SPORTS: ['football', 'basketball'],
  ISRAEL_CORE_SPORTS: ['football', 'basketball'],
};