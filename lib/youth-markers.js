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

// Category markers used to keep Term Fix / unmatched candidates from pairing
// men's vs women's or senior vs U23 games that only share a country/club token.
function extractSideCategoryMarkers(text = '') {
  const raw = String(text || '').toLowerCase().replace(/\u00a0/g, ' ');
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
  const youthMatch = raw.match(/\b(?:sub|u)[\s\-]?([0-9]{2})\b/);
  if (youthMatch) {
    youthKey = `u${youthMatch[1]}`;
  } else if (/\byouth\b/.test(raw)) {
    youthKey = 'u20';
  }

  return { women, men, youthKey };
}

function normalizeYouthKey(key = '') {
  if (!key) return '';
  return key === 'youth' ? 'u20' : key;
}

function categoryMarkersCompatible(left = {}, right = {}) {
  const a = left || {};
  const b = right || {};

  if (a.women && b.men) return false;
  if (a.men && b.women) return false;
  if (!!a.women !== !!b.women) return false;

  const youthA = normalizeYouthKey(a.youthKey);
  const youthB = normalizeYouthKey(b.youthKey);
  if (youthA || youthB) {
    if (!youthA || !youthB) return false;
    if (youthA !== youthB) return false;
  }

  return true;
}

function aggregateCategoryMarkers(texts = []) {
  let women = false;
  let men = false;
  const youthKeys = new Set();
  for (const text of texts || []) {
    if (!text) continue;
    const markers = extractSideCategoryMarkers(text);
    if (markers.women) women = true;
    if (markers.men) men = true;
    const youth = normalizeYouthKey(markers.youthKey);
    if (youth) youthKeys.add(youth);
  }
  return { women, men, youthKeys };
}

function aggregatedCategoryCompatible(left = {}, right = {}) {
  const a = left || {};
  const b = right || {};

  if (a.women && b.men) return false;
  if (a.men && b.women) return false;
  if (!!a.women !== !!b.women) return false;

  const keysA = a.youthKeys instanceof Set ? a.youthKeys : new Set(a.youthKeys || []);
  const keysB = b.youthKeys instanceof Set ? b.youthKeys : new Set(b.youthKeys || []);
  if (keysA.size || keysB.size) {
    if (keysA.size !== keysB.size) return false;
    for (const key of keysA) {
      if (!keysB.has(key)) return false;
    }
  }
  return true;
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
    aggregateCategoryMarkers(texts365),
    aggregateCategoryMarkers(textsFlash)
  );
}

module.exports = {
  stripTeamYouthMarkers,
  canonicalizeCompYouthMarkers,
  canonicalizeRomanNumerals,
  extractSideCategoryMarkers,
  categoryMarkersCompatible,
  aggregateCategoryMarkers,
  aggregatedCategoryCompatible,
  textsCategoryCompatible,
  fixturesCategoryCompatible,
};
