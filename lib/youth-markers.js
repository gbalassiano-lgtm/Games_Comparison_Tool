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

module.exports = {
  stripTeamYouthMarkers,
  canonicalizeCompYouthMarkers,
  canonicalizeRomanNumerals,
};
