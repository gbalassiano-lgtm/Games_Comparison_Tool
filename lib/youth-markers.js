// 365Scores usa "Youth" onde o Flashscore usa "U20" (mesma categoria etária).
const BR_STATE_CODES = 'sp|rj|rs|sc|ba|ce|mg|pr|pb|pe|rn|al|es|go|ma|mt|ms|pa|pi|ro|rr|ac|ap|am|df|se|to';
const BR_STATE_YOUTH_SUFFIX_RE = new RegExp(`\\b(${BR_STATE_CODES})\\s+youth\\b`, 'g');
const YOUTH_U20_EQUIV_RE = /\b(sub[\s\-]?20|u[\s\-]?20|youth)\b/g;
const OTHER_YOUTH_AGE_RE = /\b(sub|u)[\s\-]?(17|18|19|21|23)\b/g;

function canonicalizeRomanNumerals(text = '') {
  return String(text || '')
    .toLowerCase()
    .replace(/\biv\b/g, '4')
    .replace(/\biii\b/g, '3')
    .replace(/\bii\b/g, '2');
}

function stripTeamYouthMarkers(text = '') {
  return String(text || '')
    .replace(new RegExp(`\\/(${BR_STATE_CODES})\\b(?:\\s+youth)?`, 'gi'), ' ')
    .replace(BR_STATE_YOUTH_SUFFIX_RE, ' ')
    .replace(YOUTH_U20_EQUIV_RE, ' ')
    .replace(OTHER_YOUTH_AGE_RE, ' ')
    .replace(new RegExp(`\\b(${BR_STATE_CODES})\\b\\s*$`, 'i'), '')
    .replace(/\//g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalizeCompYouthMarkers(text = '') {
  return String(text || '')
    .replace(/\byouth\b/g, ' u20 ')
    .replace(/\b(sub[\s\-]?20|u[\s\-]?20)\b/g, ' u20 ')
    .replace(/\s+/g, ' ')
    .trim();
}

// League-tier "B" labels (Primera B, Serie B, …) — not club reserves like "Puerto Cabello B".
const LEAGUE_PHASE_SUFFIX_RE =
  /\s*[-–:]\s*(clausura|apertura|apert\.?|claus\.?|play[\s\-]?offs?|grupos?\s+\w+|groups?\s+\w+|fase\s+\w+|stage\s+\w+|zona\s+\w+|final(?:es)?|ida|volta).*$/i;
const LEAGUE_DIVISION_B_RE =
  /\b(primera|primeiro|primeira|serie|liga|league|division|divis(?:ao|ão)|campeonato|nacional|segunda|segundo|tercera|terceira)\s+b$/i;

function stripCompetitionPhaseSuffix(text = '') {
  return String(text || '').replace(LEAGUE_PHASE_SUFFIX_RE, '').replace(/\s+/g, ' ').trim();
}

function isLeagueDivisionBLabel(text = '') {
  const normalized = stripCompetitionPhaseSuffix(
    String(text || '').toLowerCase().replace(/\u00a0/g, ' ')
  );
  return LEAGUE_DIVISION_B_RE.test(normalized);
}

function isLeagueTierCompetitionLabel(text = '') {
  const normalized = stripCompetitionPhaseSuffix(
    String(text || '').toLowerCase().replace(/\u00a0/g, ' ')
  );
  if (!normalized) return false;
  if (isLeagueDivisionBLabel(normalized)) return true;
  // "2. Liga", "3. Liga", "Liga 2", "League 2", "Division 2", "Serie A2", "Gaucho 2"
  if (/\b\d+\.?\s*(liga|league|division)\b/.test(normalized)) return true;
  if (/\b(liga|league|division|divis(?:ao|ão)|serie|série|campeonato)\s*[a-c]?\d+\b/.test(normalized)) {
    return true;
  }
  // Short regional tier labels that end in a division digit (Gaucho 2).
  // Do NOT treat Roman II/III as league tiers — those are club reserves
  // ("Mönchengladbach II", "Lubeck II"), not competitions.
  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (
    tokens.length === 2 &&
    /^(?:[a-c]?\d+)$/.test(tokens[1]) &&
    !/\b(fc|cf|sc|ac|united|city|club|sporting|atletico|athletic)\b/.test(normalized)
  ) {
    return true;
  }
  return false;
}

// Flash Club Friendlies append ISO-ish codes: "Villarreal B (Esp)", "PSV (Ned)".
// Strip before reserve/suffix checks so "B (Esp)" still counts as reserve.
// Keep single-letter (W)/(M) gender markers — pattern requires 2–4 letters.
function stripTeamCountryCodeParentheticals(text = '') {
  return String(text || '')
    .replace(/\s*\(([A-Za-z]{2,4})\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Category markers used to keep Term Fix / unmatched candidates from pairing
// men's vs women's or senior vs U23 games that only share a country/club token.
// role: 'team' (default) | 'competition' — competition names must not treat
// trailing "2"/"B"/"II" as club reserves ("Gaucho 2", "2. Liga").
function extractSideCategoryMarkers(text = '', options = {}) {
  const role = options.role === 'competition' ? 'competition' : 'team';
  const raw = String(text || '').toLowerCase().replace(/\u00a0/g, ' ');
  const teamRaw = role === 'team' ? stripTeamCountryCodeParentheticals(raw) : raw;
  const women = (
    /\b(women|woman|womens|feminino|feminina|femenino|femenina|femenil)\b/.test(raw) ||
    /\(w\)/.test(raw) ||
    /(^|[\s/(-])w([\s/)-]|$)/.test(raw)
  );
  const men = (
    /\b(men|man|mens|masculino|masculina)\b/.test(raw) ||
    /\(m\)/.test(raw)
  );

  let youthKey = null;
  const youthMatch = teamRaw.match(/\b(?:sub|u)[\s\-]?([0-9]{2})\b/) || raw.match(/\b(?:sub|u)[\s\-]?([0-9]{2})\b/);
  if (youthMatch) {
    youthKey = `u${youthMatch[1]}`;
  } else if (/\byouth\b/.test(raw)) {
    youthKey = 'u20';
  } else if (role === 'team') {
    const trimmed = teamRaw.trim();
    // Flash/365 reserve sides: B / 2 / II / Res / AM (Amateure).
    // Competition tiers are handled separately — never here.
    if (
      /\b(reserves?|reservas?|res|amateure|ama)\b/.test(teamRaw) ||
      /\s+am$/.test(trimmed) ||
      (
        /\s+(ii|2|b)$/.test(trimmed) &&
        !isLeagueDivisionBLabel(teamRaw) &&
        !isLeagueTierCompetitionLabel(teamRaw)
      )
    ) {
      youthKey = 'reserve';
    }
  }

  return { women, men, youthKey };
}

function normalizeYouthKey(key = '') {
  if (!key) return '';
  return key === 'youth' ? 'u20' : key;
}

function isDevelopmentalYouthKey(key = '') {
  const normalized = normalizeYouthKey(key);
  if (!normalized) return false;
  if (normalized === 'reserve') return true;
  return /^u\d{2}$/.test(normalized);
}

function womenMarkersCompatible(a = {}, b = {}) {
  if (a.women && b.men) return false;
  if (a.men && b.women) return false;
  return true;
}

function youthKeysCompatible(youthA = '', youthB = '') {
  if (!youthA && !youthB) return true;
  if (!youthA || !youthB) return false;
  if (youthA === youthB) return true;
  // U20/U23/Youth ↔ B/2/Res share a developmental bucket; distinct ages do not.
  if (youthA === 'reserve' || youthB === 'reserve') {
    return isDevelopmentalYouthKey(youthA) && isDevelopmentalYouthKey(youthB);
  }
  return false;
}

function categoryMarkersCompatible(left = {}, right = {}) {
  const a = left || {};
  const b = right || {};

  // Pairwise Term Fix checks stay strict on gender so "Liga MX" alone does not
  // alias to "Liga MX Feminino" without fixture context.
  if (a.women && b.men) return false;
  if (a.men && b.women) return false;
  if (!!a.women !== !!b.women) return false;

  const youthA = normalizeYouthKey(a.youthKey);
  const youthB = normalizeYouthKey(b.youthKey);
  return youthKeysCompatible(youthA, youthB);
}

function mergeCategoryMarkerInto(acc, markers = {}) {
  if (markers.women) acc.women = true;
  if (markers.men) acc.men = true;
  const youth = normalizeYouthKey(markers.youthKey);
  if (youth) acc.youthKeys.add(youth);
  return acc;
}

function aggregateCategoryMarkers(texts = [], options = {}) {
  const role = options.role === 'competition' ? 'competition' : 'team';
  const acc = { women: false, men: false, youthKeys: new Set() };
  for (const text of texts || []) {
    if (!text) continue;
    mergeCategoryMarkerInto(acc, extractSideCategoryMarkers(text, { role }));
  }
  return acc;
}

// Call sites pass [home, away, competition]. Competition trailing "2"/"B" must
// not mark the fixture as reserve (Gaucho 2, Liga FUTVE 2, 2. Liga).
function aggregateFixtureCategoryMarkers(texts = []) {
  const list = (texts || []).filter(Boolean);
  if (list.length >= 3) {
    const competition = list[list.length - 1];
    const teams = list.slice(0, -1);
    const acc = aggregateCategoryMarkers(teams, { role: 'team' });
    mergeCategoryMarkerInto(
      acc,
      extractSideCategoryMarkers(competition, { role: 'competition' })
    );
    return acc;
  }
  return aggregateCategoryMarkers(list, { role: 'team' });
}

function developmentalYouthSetsCompatible(keysA, keysB) {
  if (!keysA.size && !keysB.size) return true;
  if (!keysA.size || !keysB.size) return false;

  const agesA = [...keysA].filter(key => key !== 'reserve');
  const agesB = [...keysB].filter(key => key !== 'reserve');
  const allDevelopmental = [...keysA, ...keysB].every(isDevelopmentalYouthKey);
  if (!allDevelopmental) {
    if (keysA.size !== keysB.size) return false;
    for (const key of keysA) {
      if (!keysB.has(key)) return false;
    }
    return true;
  }

  // Pure reserve ↔ reserve, or age ↔ reserve (U20 vs B).
  if (!agesA.length || !agesB.length) return true;
  if (agesA.length !== agesB.length) return false;
  return agesA.every(key => keysB.has(key));
}

function aggregatedCategoryCompatible(left = {}, right = {}) {
  const a = left || {};
  const b = right || {};

  // Fixture-level: women's league on one source often omits W on the other.
  // Still reject explicit men ↔ women.
  if (!womenMarkersCompatible(a, b)) return false;

  const keysA = a.youthKeys instanceof Set ? a.youthKeys : new Set(a.youthKeys || []);
  const keysB = b.youthKeys instanceof Set ? b.youthKeys : new Set(b.youthKeys || []);
  return developmentalYouthSetsCompatible(keysA, keysB);
}

function textsCategoryCompatible(...texts) {
  const markers = texts.map(text => extractSideCategoryMarkers(text));
  for (let i = 0; i < markers.length; i++) {
    for (let j = i + 1; j < markers.length; j++) {
      if (!categoryMarkersCompatible(markers[i], markers[j])) return false;
    }
  }
  return true;
}

// Compare whole fixtures (teams + competition OR'd per side) so a women's
// league still matches when one roster omits an explicit W marker.
function fixturesCategoryCompatible(texts365 = [], textsFlash = []) {
  return aggregatedCategoryCompatible(
    aggregateFixtureCategoryMarkers(texts365),
    aggregateFixtureCategoryMarkers(textsFlash)
  );
}

module.exports = {
  stripTeamYouthMarkers,
  canonicalizeCompYouthMarkers,
  canonicalizeRomanNumerals,
  extractSideCategoryMarkers,
  categoryMarkersCompatible,
  aggregateCategoryMarkers,
  aggregateFixtureCategoryMarkers,
  aggregatedCategoryCompatible,
  textsCategoryCompatible,
  fixturesCategoryCompatible,
  isLeagueDivisionBLabel,
  isLeagueTierCompetitionLabel,
  stripCompetitionPhaseSuffix,
};
