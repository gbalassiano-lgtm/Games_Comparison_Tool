const NON_FOOTBALL_SPORT_SLUGS = new Set([
  'snooker',
  'darts',
  'tennis',
  'basketball',
  'hockey',
  'volleyball',
  'baseball',
  'american-football',
  'handball',
  'rugby-union',
  'rugby-league',
  'cricket',
  'badminton',
  'table-tennis',
  'beach-volleyball',
  'futsal',
  'esports',
  'mma',
  'boxing',
  'motorsport',
  'cycling',
  'golf',
]);

const NON_FOOTBALL_COMPETITION_PATTERNS = [
  /\bchampionship league\b/i,
  /\bworld championship\b/i,
  /\bplayers championship\b/i,
  /\bworld snooker\b/i,
  /\bworld darts\b/i,
  /\bpremier league darts\b/i,
  /\batp\b/i,
  /\bwta\b/i,
  /\bitf\b/i,
  /\bchallenger\b/i,
];

function normalizeText(text = '') {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeIndividualParticipant(name = '') {
  const value = String(name || '').trim();
  if (!value) return false;

  if (/\//.test(value)) return true;

  if (/^[A-Za-zÀ-ÿ][\wÀ-ÿ.'-]*\s+[A-Z]\.$/.test(value)) return true;
  if (/^[A-Za-zÀ-ÿ][\wÀ-ÿ.'-]*\s+[A-Z]\.[A-Za-zÀ-ÿ][\wÀ-ÿ.'-]*$/.test(value)) return true;

  return false;
}

function competitionLooksNonFootball(competition = '') {
  const text = normalizeText(competition).toLowerCase();
  if (!text) return false;
  return NON_FOOTBALL_COMPETITION_PATTERNS.some(pattern => pattern.test(text));
}

function sportSlugFromMatchHref(href = '') {
  const value = String(href || '');
  const match = value.match(/\/match\/([^/?#]+)/i);
  return match?.[1]?.toLowerCase() || '';
}

function isNonFootballSportSlug(slug = '') {
  return NON_FOOTBALL_SPORT_SLUGS.has(String(slug || '').toLowerCase());
}

function isNonFootballFlashMatch(match = {}) {
  const home = String(match.home || '').trim();
  const away = String(match.away || '').trim();
  const competition = String(match.competition || match.competicao || '').trim();
  const sportHint = String(match.sport || match.sportSlug || '').trim().toLowerCase();

  if (sportHint && sportHint !== 'football' && sportHint !== 'soccer') {
    return true;
  }

  if (competitionLooksNonFootball(competition)) {
    if (looksLikeIndividualParticipant(home) && looksLikeIndividualParticipant(away)) {
      return true;
    }
  }

  if (looksLikeIndividualParticipant(home) && looksLikeIndividualParticipant(away)) {
    return competitionLooksNonFootball(competition) || /^(world|international|internacional)$/i.test(String(match.country || '').replace(/:$/, '').trim());
  }

  return false;
}

function filterFootballFlashMatches(matches = []) {
  return (matches || []).filter(match => !isNonFootballFlashMatch(match));
}

function assertFootballFlashScrapeQuality(rawCount, filteredMatches = []) {
  if (rawCount > 0 && filteredMatches.length === 0) {
    throw new Error(
      `Flashscore football scrape returned ${rawCount} matches but none passed football validation ` +
      '(page likely mixed another sport or failed to load football fixtures).'
    );
  }
}

module.exports = {
  looksLikeIndividualParticipant,
  competitionLooksNonFootball,
  sportSlugFromMatchHref,
  isNonFootballSportSlug,
  isNonFootballFlashMatch,
  filterFootballFlashMatches,
  assertFootballFlashScrapeQuality,
};
