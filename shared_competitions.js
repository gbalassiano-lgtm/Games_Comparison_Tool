/**
 * build-competition-memory.js
 *
 * Lê os JSONs atuais de 365 e Flash para cada esporte,
 * detecta quais competições existem nos DOIS lados (por país/scope),
 * e salva o resultado em config/shared_competitions.json.
 *
 * Uso:
 *   node build-competition-memory.js          → todos os esportes
 *   node build-competition-memory.js football → só futebol
 *   node build-competition-memory.js --reset  → limpa e reconstrói tudo
 */

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────
// Config de esportes (mesmos paths do compare.js)
// ─────────────────────────────────────────────────────────────────

const SPORT_CONFIGS = {
  football: {
    label   : 'Futebol',
    file365 : path.join(__dirname, 'output', 'football', '365_tomorrow_by_country.json'),
    fileFlash: path.join(__dirname, 'output', 'football', 'flashscore_tomorrow_all_countries.json'),
  },
  basketball: {
    label   : 'Basquete',
    file365 : path.join(__dirname, 'output', 'basketball', '365_tomorrow_basketball_by_country.json'),
    fileFlash: path.join(__dirname, 'output', 'basketball', 'flashscore_tomorrow_basketball_all_countries.json'),
  },
  basketball_usa: {
    label   : 'Basquete EUA',
    file365 : path.join(__dirname, 'output', 'basketball_usa', '365_tomorrow_basketball_usa_by_country.json'),
    fileFlash: path.join(__dirname, 'output', 'basketball_usa', 'flashscore_tomorrow_basketball_usa.json'),
  },
  american_football_usa: {
    label   : 'Futebol Americano EUA',
    file365 : path.join(__dirname, 'output', 'american_football_usa', '365_tomorrow_american_football_usa_by_country.json'),
    fileFlash: path.join(__dirname, 'output', 'american_football_usa', 'flashscore_tomorrow_american_football_usa.json'),
  },
  baseball_usa: {
    label   : 'Beisebol EUA',
    file365 : path.join(__dirname, 'output', 'baseball_usa', '365_tomorrow_baseball_usa_by_country.json'),
    fileFlash: path.join(__dirname, 'output', 'baseball_usa', 'flashscore_tomorrow_baseball_usa.json'),
  },
  volleyball: {
    label   : 'Vôlei',
    file365 : path.join(__dirname, 'output', 'volleyball', '365_tomorrow_volleyball_by_country.json'),
    fileFlash: path.join(__dirname, 'output', 'volleyball', 'flashscore_tomorrow_volleyball_all_countries.json'),
  },
  hockey: {
    label   : 'Hockey',
    file365 : path.join(__dirname, 'output', 'hockey', '365_tomorrow_hockey_by_country.json'),
    fileFlash: path.join(__dirname, 'output', 'hockey', 'flashscore_tomorrow_hockey_all_countries.json'),
  },
  tennis: {
    label   : 'Tênis',
    file365 : path.join(__dirname, 'output', 'tennis', '365_tomorrow_tennis_by_country.json'),
    fileFlash: path.join(__dirname, 'output', 'tennis', 'flashscore_tomorrow_tennis_all_countries.json'),
  },
};

const SHARED_FILE = path.join(__dirname, 'config', 'shared_competitions.json');

function logStep(message = '') {
  const text = String(message).trimEnd();
  if (!text) return;
  process.stdout.write(`${text}\n`);
}

// ─────────────────────────────────────────────────────────────────
// Normalização (replicada do compare.js para ser standalone)
// ─────────────────────────────────────────────────────────────────

function norm(text = '') {
  return String(text)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[:.!?_\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const COUNTRY_ALIASES = {
  'paises baixos' : 'holanda',
  'netherlands'   : 'holanda',
  'holland'       : 'holanda',
  'uk'            : 'inglaterra',
  'great britain' : 'inglaterra',
  'czech republic': 'republica tcheca',
  'czechia'       : 'republica tcheca',
  'coreia'        : 'coreia do sul',
  'south korea'   : 'coreia do sul',
  'mundo'         : 'internacional',
  'international' : 'internacional',
  'internacional' : 'internacional',
  'america do norte e central': 'america do norte',
  'america central'           : 'america do norte',
  'concacaf'                  : 'america do norte',
};

function normCountry(text = '') {
  const n = norm(text).replace(/[:.!?]+/g, '').replace(/\s+/g, ' ').trim();
  // remove sufixos comuns do Flash como "Brasil:" → "brasil"
  const clean = n.replace(/:$/, '').trim();
  return COUNTRY_ALIASES[clean] || clean;
}

function canonicalizeCompYouthMarkers(text = '') {
  return String(text || '')
    .replace(/\byouth\b/g, ' u20 ')
    .replace(/\b(sub[\s\-]?20|u[\s\-]?20)\b/g, ' u20 ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normComp(text = '') {
  let n = canonicalizeCompYouthMarkers(norm(text))
    .replace(/\b(play\s*offs?|playoffs?|play\s*outs?|play\s*out|playoff)\b/g, ' ')
    .replace(/\b\d+(?:st|nd|rd|th)?(?:\s*-\s*|\s+)\d+(?:st|nd|rd|th)?\s+places?\b/g, ' ')
    .replace(/\b\d+(?:st|nd|rd|th)?\s+places?\b/g, ' ')
    .replace(/\b(classification|placement|classificacao)\s*(rounds?|phases?|stages?)?\b/g, ' ')
    .replace(/\b(qualifying|qualifica\w*|segunda fase|final phase|relegation|promotion)\b/g, ' ')
    .replace(/\b(semifinals?|semi\s*finals?|quarterfinals?|quarter\s*finals?|group stage|fase de grupos)\b/g, ' ')
    .replace(/\b(da|de|do|del|la|el|the)\b/g, ' ')
    .replace(/[:.!\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (/\b(eurobasket|fiba|centrobasket|afrobasket|americup|asiacup|asia cup)\b/.test(n)) {
    n = n
      .replace(/\b(groups?|grupos?)\s+[a-h]\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return n;
}

function extractTennisScopeFrom365Country(country = '') {
  const n = norm(country).replace(/\s+/g, ' ').trim();
  if (['atp', 'atp simples', 'atp singles', 'atp s'].includes(n)) return 'ATP - Simples';
  if (['wta', 'wta simples', 'wta singles', 'wta s'].includes(n)) return 'WTA - Simples';
  if (['atp duplas', 'atp doubles', 'atp d', 'atp dupla', 'atp double'].includes(n)) return 'ATP - Duplas';
  if (['wta duplas', 'wta doubles', 'wta d', 'wta dupla', 'wta double'].includes(n)) return 'WTA - Duplas';
  if (['challenger', 'challenger simples', 'challenger singles', 'challenger s'].includes(n)) return 'Challenger - Simples';
  if (['challenger duplas', 'challenger doubles', 'challenger d', 'challenger dupla', 'challenger double'].includes(n)) return 'Challenger - Duplas';
  return country || '';
}

function extractTennisScopeFromFlashCompetition(comp = '') {
  const n = normComp(comp);
  const isDoubles = /\b(duplas|dupla|doubles|double| d )\b/.test(` ${n} `);
  if (n.includes('challenger')) return isDoubles ? 'Challenger - Duplas' : 'Challenger - Simples';
  if (n.includes('atp')) return isDoubles ? 'ATP - Duplas' : 'ATP - Simples';
  if (n.includes('wta')) return isDoubles ? 'WTA - Duplas' : 'WTA - Simples';
  if (n.includes('itf masculino')) return isDoubles ? 'ITF Masculino - Duplas' : 'ITF Masculino - Simples';
  if (n.includes('itf feminino')) return isDoubles ? 'ITF Feminino - Duplas' : 'ITF Feminino - Simples';
  return null;
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
  if (raw.includes(':')) raw = raw.split(':').slice(1).join(':').trim();
  if (raw.includes(',')) raw = raw.split(',')[0].trim();
  return cleanTennisEventBase(raw) || String(comp || '').trim();
}

function getCompetitionMemoryName(comp = '', sportKey = '') {
  return sportKey === 'tennis' ? extractTennisEventName(comp) : comp;
}

function competitionTags(text = '') {
  const n = norm(text);
  return {
    women: /\b(feminino|fem|women|w)\b/.test(n) || /\(f\)/.test(n),
    reserve: /\b(reserva|reservas|reserve|reserves|res)\b/.test(n),
    youth: /\b(youth|sub[\s-]?20|u[\s-]?20)\b/.test(n) || /\b(sub|u)[\s-]?(17|18|19|21|23)\b/.test(n),
    playoff: /\b(playoff|playoffs|mata mata)\b/.test(n),
  };
}

function compatibleCompetition(c1, c2) {
  const a = competitionTags(c1);
  const b = competitionTags(c2);
  return Object.keys(a).every(key => a[key] === b[key]);
}

// bigrams para similaridade
function bigrams(str) {
  const s = str.replace(/\s/g, '');
  const r = [];
  for (let i = 0; i < s.length - 1; i++) r.push(s[i] + s[i + 1]);
  return r;
}

function diceSim(a, b) {
  if (!a || !b) return 0;
  if (a === b)  return 1;
  const ba = bigrams(a);
  const bb = bigrams(b);
  if (!ba.length || !bb.length) return 0;
  const map = new Map();
  for (const bg of bb) map.set(bg, (map.get(bg) || 0) + 1);
  let hits = 0;
  for (const bg of ba) {
    const c = map.get(bg) || 0;
    if (c > 0) { hits++; map.set(bg, c - 1); }
  }
  return (2 * hits) / (ba.length + bb.length);
}

function compSim(c1, c2) {
  if (!compatibleCompetition(c1, c2)) return 0;
  const n1 = normComp(c1);
  const n2 = normComp(c2);
  if (!n1 || !n2) return 0;
  if (n1 === n2)  return 1;
  if (n1.includes(n2) || n2.includes(n1)) return 0.94;
  return diceSim(n1, n2);
}

// ─────────────────────────────────────────────────────────────────
// Regras de exclusão
// ─────────────────────────────────────────────────────────────────

const ALWAYS_IGNORE = [
  '__open_on_country_click__',
  'sem competicao',
];

function shouldIgnore(sportKey, compName) {
  const c = norm(compName || '');
  if (ALWAYS_IGNORE.some(p => c.includes(p))) return true;
  if (sportKey === 'tennis' && c.includes('itf'))       return true;
  if (sportKey === 'football' && c.startsWith('kings league')) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────
// Leitura dos JSONs
// ─────────────────────────────────────────────────────────────────

function getGroupName(obj = {}) {
  return (obj.country || obj.tour || obj.circuit || obj.category || obj.group || obj.section || '').trim();
}

/**
 * Retorna: Map<scopeKey, { scopeName, competitions: Set<string> }>
 */
function extract365(filePath, sportKey) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const map = new Map();

  for (const group of raw) {
    const rawScope = sportKey === 'tennis'
      ? extractTennisScopeFrom365Country(getGroupName(group))
      : getGroupName(group);
    const scopeKey = normCountry(rawScope);
    if (!scopeKey) continue;

    if (!map.has(scopeKey)) {
      map.set(scopeKey, { scopeName: rawScope, competitions: new Set() });
    }

    for (const comp of group.competitions || []) {
      const name = getCompetitionMemoryName((comp.name || comp.competition || '').trim(), sportKey);
      if (!name || shouldIgnore(sportKey, name)) continue;
      map.get(scopeKey).competitions.add(name);
    }
  }

  return map;
}

/**
 * Retorna: Map<scopeKey, { scopeName, competitions: Set<string> }>
 */
function extractFlash(filePath, sportKey) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const map = new Map();

  const addCompetition = (rawScope, comp) => {
    const scopeKey = normCountry(rawScope);
    if (!scopeKey) return;

    const name = getCompetitionMemoryName(comp || '', sportKey);
    if (!name || shouldIgnore(sportKey, name)) return;

    if (!map.has(scopeKey)) {
      map.set(scopeKey, { scopeName: rawScope, competitions: new Set() });
    }

    map.get(scopeKey).competitions.add(name);
  };

  for (const group of raw) {
    if (group.home && group.away) {
      const rawScope = sportKey === 'tennis'
        ? (extractTennisScopeFromFlashCompetition(group.competition || group.tournament || group.league || '') || extractTennisScopeFromFlashCompetition(getGroupName(group)) || getGroupName(group))
        : getGroupName(group);
      addCompetition(rawScope, group.competition || group.tournament || group.league || '');
      continue;
    }

    for (const comp of group.competitions || []) {
      const rawScope = sportKey === 'tennis'
        ? (extractTennisScopeFromFlashCompetition(comp.name || comp.competition || comp.tournament || comp.league || '') || extractTennisScopeFromFlashCompetition(getGroupName(group)) || getGroupName(group))
        : getGroupName(group);
      addCompetition(rawScope, comp.name || comp.competition || comp.tournament || comp.league || '');
    }
  }

  return map;
}

// ─────────────────────────────────────────────────────────────────
// Matching de competições entre os dois lados
// ─────────────────────────────────────────────────────────────────

const MATCH_THRESHOLD = 0.72; // similaridade mínima para considerar match

/**
 * Para cada competição do 365 tenta achar a melhor candidata no Flash.
 * Retorna array de { scope, competition365, competitionFlash, similarity }
 */
function matchCompetitions(scopeName, comps365, compsFlash) {
  const flashList = [...compsFlash];
  const usedFlash = new Set();
  const pairs     = [];

  for (const c365 of comps365) {
    let bestScore = 0;
    let bestFlash = null;

    for (const cFlash of flashList) {
      if (usedFlash.has(cFlash)) continue;
      const score = compSim(c365, cFlash);
      if (score > bestScore) {
        bestScore = score;
        bestFlash = cFlash;
      }
    }

    if (bestFlash && bestScore >= MATCH_THRESHOLD) {
      usedFlash.add(bestFlash);
      pairs.push({
        scope           : scopeName,
        competition365  : c365,
        competitionFlash: bestFlash,
        similarity      : Math.round(bestScore * 100),
      });
    }
  }

  return pairs;
}

// ─────────────────────────────────────────────────────────────────
// Core: processa um esporte
// ─────────────────────────────────────────────────────────────────

function processSport(sportKey, config, existingPairs = []) {
  logStep(`\n🏅 ${config.label}`);

  if (!fs.existsSync(config.file365)) {
    logStep(`  ⚠️  365 não encontrado: ${config.file365}`);
    return existingPairs;
  }
  if (!fs.existsSync(config.fileFlash)) {
    logStep(`  ⚠️  Flash não encontrado: ${config.fileFlash}`);
    return existingPairs;
  }

  const map365   = extract365(config.file365, sportKey);
  const mapFlash = extractFlash(config.fileFlash, sportKey);

  logStep(`  365  → ${map365.size} países/scopes, ${[...map365.values()].reduce((s, v) => s + v.competitions.size, 0)} competições`);
  logStep(`  Flash → ${mapFlash.size} países/scopes, ${[...mapFlash.values()].reduce((s, v) => s + v.competitions.size, 0)} competições`);

  // Monta chave única para deduplicação com o que já existe
  const existingKeys = new Set(
    existingPairs.map(p => {
      const sk = normCountry(p.scope || '');
      const k1 = normComp(p.competition365 || '');
      const k2 = normComp(p.competitionFlash || '');
      return `${sk}|||${k1}|||${k2}`;
    })
  );

  const newPairs  = [];
  let   totalNew  = 0;
  let   totalSkip = 0;

  // Só processa scopes que existem nos DOIS lados
  for (const [scopeKey, data365] of map365) {
    const dataFlash = mapFlash.get(scopeKey);
    if (!dataFlash || dataFlash.competitions.size === 0) continue;

    const pairs = matchCompetitions(
      data365.scopeName,
      [...data365.competitions],
      dataFlash.competitions,
    );

    for (const p of pairs) {
      const dedupKey = `${normCountry(p.scope)}|||${normComp(p.competition365)}|||${normComp(p.competitionFlash)}`;

      if (existingKeys.has(dedupKey)) {
        totalSkip++;
        continue;
      }

      existingKeys.add(dedupKey);
      newPairs.push({
        scope           : p.scope,
        competition365  : p.competition365,
        competitionFlash: p.competitionFlash,
      });
      totalNew++;

      if (totalNew <= 5) {
        logStep(
          `  ✅ [${p.similarity}%] "${p.competition365}"  ↔  "${p.competitionFlash}"  (${p.scope})`
        );
      }
    }
  }

  if (totalNew > 5) {
    logStep(`  ... +${totalNew - 5} outros pares`);
  }

  logStep(`  → ${totalNew} novo(s) par(es) | ${totalSkip} já conhecido(s)`);
  return [...existingPairs, ...newPairs];
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────

function main() {
  const args  = process.argv.slice(2);
  const reset = args.includes('--reset');
  const sportArg = args.find(a => !a.startsWith('--'));

  // Garante pasta config
  const configDir = path.join(__dirname, 'config');
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });

  // Carrega arquivo existente (ou começa vazio)
  let sharedFile = {};
  if (!reset && fs.existsSync(SHARED_FILE)) {
    try {
      sharedFile = JSON.parse(fs.readFileSync(SHARED_FILE, 'utf-8'));
      logStep('📂 shared_competitions.json carregado (modo acumulativo)');
    } catch (e) {
      console.warn('⚠️  Erro ao ler shared_competitions.json — começando do zero');
    }
  } else if (reset) {
    logStep('🔄 --reset: reconstruindo do zero');
  }

  const sportsToRun = sportArg
    ? [sportArg]
    : Object.keys(SPORT_CONFIGS);

  for (const sportKey of sportsToRun) {
    const config = SPORT_CONFIGS[sportKey];
    if (!config) {
      console.error(`❌ Esporte desconhecido: ${sportKey}`);
      continue;
    }

    const existing    = Array.isArray(sharedFile[sportKey]) ? sharedFile[sportKey] : [];
    sharedFile[sportKey] = processSport(sportKey, config, existing);
  }

  // Salva
  fs.writeFileSync(SHARED_FILE, JSON.stringify(sharedFile, null, 2), 'utf-8');

  // Resumo final
  logStep('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logStep('📊 RESUMO FINAL:');
  for (const [sport, pairs] of Object.entries(sharedFile)) {
    logStep(`   ${sport.padEnd(12)} → ${(pairs || []).length} pares compartilhados`);
  }
  logStep(`\n✅ Salvo em: ${SHARED_FILE}`);
}

main();