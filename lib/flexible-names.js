const { canonicalizeRomanNumerals } = require('./youth-markers');

const TRANSLITERATION_REPLACEMENTS = [
  [/sheikhou?n/g, 'sheikhun'],
  [/shaykhun/g, 'sheikhun'],
  [/shouleh/g, 'shola'],
  [/gissar/g, 'hisor'],
  [/\bawassa\b/g, 'hawassa'],
  [/\bhawassa\b/g, 'hawassa'],
  [/\bjenis\b/g, 'zhenis'],
  [/\bzh enis\b/g, 'zhenis'],
  [/\baltay\b/g, 'altai'],
  [/\baltai\b/g, 'altai'],
  [/\btransportation\b/g, 'kyotong'],
  [/\bkyotong\b/g, 'kyotong'],
  [/\bvestmannaeyja\b/g, 'vestmannaeyjar'],
  [/\bvestmannaeyjar\b/g, 'vestmannaeyjar'],
];

const TEAM_NICKNAMES = {
  thetownfc: 'san jose earthquakes 2',
  thetown: 'san jose earthquakes 2',
  gothamfc: 'gotham',
  njnygothamfc: 'gotham',
  gothamw: 'gotham',
  jeonbukmotors: 'jeonbuk 2',
  jeonbukmotor: 'jeonbuk 2',
  alsaddfc: 'al sadd',
  alsadd: 'al sadd',
  mechal: 'defence force',
  defenceforce: 'defence force',
  defenceforcesc: 'defence force',
  zhenis: 'zhenis',
  jenis: 'zhenis',
  kupsakatemia: 'kuopion palloseura 2',
  kuopionpalloseura2: 'kuopion palloseura 2',
  gyeongjukhnp: 'gyeongju khnp',
  gyeongjuhn: 'gyeongju khnp',
  busankyotong: 'busan kyotong',
  busantransportation: 'busan kyotong',
  dingnanganlian: 'dingnan united',
  dingnanunited: 'dingnan united',
  hafnarfjordur: 'hafnarfjordur',
  fhhafnarfjordur: 'hafnarfjordur',
  ibvestmannaeyjar: 'vestmannaeyjar',
  ibvestmannaeyja: 'vestmannaeyjar',
  vestmannaeyjar: 'vestmannaeyjar',
  vestmannaeyja: 'vestmannaeyjar',
  tobolkostanay: 'tobol',
  tobol: 'tobol',
  altaioskemen: 'altai',
  altayoskemen: 'altai',
  vps: 'vaasa',
  vaasaps: 'vaasa',
  vaasa: 'vaasa',
  adamakenema: 'adama',
  adamacity: 'adama',
  adama: 'adama',
  cbrbrave: 'canberra brave',
  cbr: 'canberra',
  czechia: 'czech republic',
  // Flash Club Friendlies often use short/local forms.
  stvv: 'sint truiden',
  sttruiden: 'sint truiden',
  sinttruiden: 'sint truiden',
  sainttruiden: 'sint truiden',
  royaleunionsg: 'union saint gilloise',
  unionsg: 'union saint gilloise',
  unionstgilloise: 'union saint gilloise',
  unionstilloise: 'union saint gilloise',
  unionsaintgilloise: 'union saint gilloise',
  dvtk: 'diosgyori',
  diosgyori: 'diosgyori',
  diosgyorivtk: 'diosgyori',
  hbkoge: 'koge',
  koge: 'koge',
  afs: 'avs',
};

function applyTransliteration(text = '') {
  let value = String(text || '').toLowerCase()
    // Flash / 365 country spellings: ß stays after NFD and breaks Grossaspach ↔ Großaspach.
    .replace(/ß/g, 'ss')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a');
  for (const [pattern, replacement] of TRANSLITERATION_REPLACEMENTS) {
    value = value.replace(pattern, replacement);
  }
  return value;
}

function squashComparableName(text = '') {
  return applyTransliteration(String(text || ''))
    .replace(/[^a-z0-9]/g, '');
}

function stripFlashCountryParentheticals(text = '') {
  // Flash Club Friendlies: "Hoffenheim II (Ger)", "PSV (Ned)", "Vitesse (Bel)".
  return String(text || '')
    .replace(/\s*\(([A-Za-z]{2,4})\)\s*/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHonorificClubTokens(text = '') {
  return String(text || '')
    .replace(/\b(royale?|saint|sint|st)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sortedTokenSignature(text = '') {
  return applyTransliteration(String(text || ''))
    .split(/\s+/)
    .map(token => token.trim())
    .filter(Boolean)
    .sort()
    .join(' ');
}

function nameDice(left = '', right = '') {
  const a = squashComparableName(left);
  const b = squashComparableName(right);
  if (!a || !b) return a === b ? 1 : 0;
  if (a === b) return 1;
  if (a.length === 1 || b.length === 1) return a === b ? 1 : 0;

  const counts = new Map();
  for (let i = 0; i < a.length - 1; i += 1) {
    const gram = a.slice(i, i + 2);
    counts.set(gram, (counts.get(gram) || 0) + 1);
  }

  let shared = 0;
  for (let i = 0; i < b.length - 1; i += 1) {
    const gram = b.slice(i, i + 2);
    const count = counts.get(gram) || 0;
    if (!count) continue;
    shared += 1;
    counts.set(gram, count - 1);
  }

  return (2 * shared) / (a.length + b.length - 2);
}

function normalizeWomenTeamSuffix(text = '') {
  return String(text || '')
    .replace(/\s+\(w\)\s*$/i, '')
    .replace(/\s+w\s*$/i, '')
    .replace(/\s+f\s*$/i, '')
    .trim();
}

function normalizeReserveTeamSuffix(text = '') {
  return String(text || '')
    // "Res." / "Reserve" / "B" / "II" must land on the same "2" marker Flash uses.
    .replace(/\b(akademia|akatemia|academy|reserves?|reservas?|res)\b/g, ' 2')
    .replace(/\s+(ii|2|b)\s*$/i, ' 2')
    .replace(/\s+2\s*$/i, ' 2')
    .replace(/\s+/g, ' ')
    .trim();
}

const CLUB_ABBREVIATIONS = {
  ind: 'independiente',
  atl: 'atletico',
  ath: 'athletic',
  athl: 'athletic',
  dep: 'deportivo',
  depor: 'deportivo',
  nac: 'nacional',
  univ: 'universidad',
  est: 'estudiantes',
  int: 'internacional',
  inter: 'internacional',
  spr: 'sporting',
  spt: 'sporting',
  juv: 'juventude',
  rac: 'racing',
};

function expandTeamAbbreviations(text = '') {
  return String(text || '')
    .replace(/\bkups\b/g, 'kuopion palloseura')
    .replace(/\bh\s*&\s*n\b/gi, 'khnp')
    .replace(/\bvps\b/gi, 'vaasa');
}

function expandKnownClubAbbreviations(text = '') {
  return String(text || '')
    .split(/\s+/)
    .map(token => CLUB_ABBREVIATIONS[token] || token)
    .filter(Boolean)
    .join(' ');
}

function isTokenAbbreviationOf(shortToken = '', longToken = '') {
  const short = String(shortToken || '');
  const long = String(longToken || '');
  if (!short || !long || long.length <= short.length) return false;
  if (!long.startsWith(short)) return false;
  // Single-letter Flash initials: "U." ↔ Union / Universidad (needs other shared tokens).
  if (short.length === 1) {
    return /^[a-z]$/i.test(short) && long.length >= 4;
  }
  if (short.length < 3 || long.length < short.length + 2) return false;
  // "Ind." / "Atl." style truncations: short stem, clearly longer full word.
  if (short.length <= 5 && long.length >= short.length + 3) return true;
  return short.length >= 4;
}

function abbreviatedTokenScore(left = '', right = '') {
  const leftTokens = left.split(/\s+/).filter(Boolean);
  const rightTokens = right.split(/\s+/).filter(Boolean);
  if (!leftTokens.length || !rightTokens.length) return 0;

  const used = new Set();
  let matched = 0;
  let abbrevHits = 0;

  for (const leftToken of leftTokens) {
    let bestIndex = -1;
    let bestKind = '';

    for (let index = 0; index < rightTokens.length; index += 1) {
      if (used.has(index)) continue;
      const rightToken = rightTokens[index];
      if (leftToken === rightToken) {
        bestIndex = index;
        bestKind = 'exact';
        break;
      }
      if (
        isTokenAbbreviationOf(leftToken, rightToken) ||
        isTokenAbbreviationOf(rightToken, leftToken)
      ) {
        bestIndex = index;
        bestKind = 'abbrev';
      }
    }

    if (bestIndex < 0) continue;
    used.add(bestIndex);
    matched += 1;
    if (bestKind === 'abbrev') abbrevHits += 1;
  }

  const minSize = Math.min(leftTokens.length, rightTokens.length);
  const maxSize = Math.max(leftTokens.length, rightTokens.length);
  if (!abbrevHits || matched < minSize) return 0;
  if (matched === maxSize) return 0.96;
  if (matched === minSize && maxSize - minSize <= 1) return 0.93;
  return 0;
}

function stripPalloseuraSuffix(text = '') {
  return String(text || '')
    .replace(/\s+ps\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripClubPrefixes(text = '') {
  return String(text || '')
    .replace(/^(fh|ib|ols)\s+/i, '')
    .replace(/\b(fh|ib)\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTeamNameCore(text = '') {
  let value = canonicalizeRomanNumerals(
    normalizeWomenTeamSuffix(stripFlashCountryParentheticals(String(text || '')))
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  );

  value = applyTransliteration(value);
  value = expandTeamAbbreviations(value);

  value = value
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(w|women|woman|feminino|fem)\b/g, ' ')
    // Leading Arabic article is usually cosmetic for Friendlies matching ("Al Jazira").
    .replace(/^(al|el)\s+/g, '')
    .replace(/\b(fc|cf|sc|ac|ec|se|es|af|rc|sd|ud|rcd|ca|cd|fk|sk|bk|if|hk|nk|ik|pfc|nj|ny|hb)\b/g, ' ')
    .replace(/[:.!?_\-/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Expand Ind./Atl./Dep. style stems after punctuation is normalized to tokens.
  value = expandKnownClubAbbreviations(value);

  value = stripClubPrefixes(value);
  value = stripPalloseuraSuffix(value);
  value = normalizeReserveTeamSuffix(value);
  value = value.replace(/\badt\b/g, 'ad');

  const squashed = squashComparableName(value);
  if (TEAM_NICKNAMES[squashed]) {
    value = TEAM_NICKNAMES[squashed];
  } else {
    // Nickname after dropping Royal/Saint fillers: "Royale Union SG" → union sg
    const strippedHonorific = stripHonorificClubTokens(value);
    const honorificKey = squashComparableName(strippedHonorific);
    if (TEAM_NICKNAMES[honorificKey]) {
      value = TEAM_NICKNAMES[honorificKey];
    }
  }

  value = value
    // Keep trailing "2" from normalizeReserveTeamSuffix — do not strip bare "res"
    // here or pair keys diverge from Flash ("Central Res." vs "Central 2").
    .replace(/\b(motors?|motor|force)\b/g, ' ')
    .replace(/\b\d{3,}\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip junior(s) only as a modifier on a longer club name (Boca Juniors),
  // never wipe standalone Junior / Atlético Junior / Junior Barranquilla.
  value = stripJuniorNameModifiers(value);

  return value;
}

const GENERIC_CLUB_PREFIX_TOKENS = new Set([
  'atletico', 'athletic', 'club', 'deportivo', 'real', 'sporting',
  'cd', 'ac', 'cf', 'ca', 'rc',
]);

function stripJuniorNameModifiers(text = '') {
  const tokens = String(text || '').split(/\s+/).filter(Boolean);
  if (!tokens.length) return String(text || '');

  const juniorIndexes = [];
  for (let i = 0; i < tokens.length; i += 1) {
    if (/^juniors?$/.test(tokens[i])) juniorIndexes.push(i);
  }
  if (!juniorIndexes.length) return tokens.join(' ');

  const without = tokens.filter(token => !/^juniors?$/.test(token));
  // Bare "Junior" / "Juniors" is the club identity.
  if (!without.length) return tokens.join(' ');
  // "Junior Barranquilla" — junior leads the name.
  if (juniorIndexes[0] === 0) return tokens.join(' ');
  // "Atletico Junior" — only generic prefixes remain without junior.
  if (without.every(token => GENERIC_CLUB_PREFIX_TOKENS.has(token))) {
    return tokens.join(' ');
  }
  // "Boca Juniors" / "Independiente Juniors" — junior(s) is a trailing modifier.
  return without.join(' ');
}

function trailingAcronymClubScore(left = '', right = '') {
  // "union sg" ↔ "union saint gilloise" / "union st gilloise"
  const leftTokens = left.split(/\s+/).filter(Boolean);
  const rightTokens = right.split(/\s+/).filter(Boolean);
  if (leftTokens.length < 2 || rightTokens.length < 2) return 0;

  const scorePair = (shortTokens, longTokens) => {
    if (shortTokens.length > longTokens.length) return 0;
    const sharedPrefix = shortTokens.slice(0, -1);
    if (!sharedPrefix.length) return 0;
    if (!sharedPrefix.every((token, index) => token === longTokens[index])) return 0;

    const acronym = shortTokens[shortTokens.length - 1];
    if (acronym.length < 2 || acronym.length > 4) return 0;
    const remainder = longTokens.slice(sharedPrefix.length).join(' ');
    if (!remainder) return 0;
    return initialismScore(acronym, remainder) >= 0.94 ? 0.96 : 0;
  };

  return Math.max(
    scorePair(leftTokens, rightTokens),
    scorePair(rightTokens, leftTokens)
  );
}

function sharedPrefixClubScore(left = '', right = '') {
  const leftTokens = left.split(/\s+/).filter(Boolean);
  const rightTokens = right.split(/\s+/).filter(Boolean);
  if (!leftTokens.length || !rightTokens.length) return 0;

  const prefix = leftTokens[0];
  if (prefix.length < 6 || prefix !== rightTokens[0]) return 0;

  const leftSquash = squashComparableName(left);
  const rightSquash = squashComparableName(right);
  const prefixSquash = squashComparableName(prefix);
  if (!leftSquash.startsWith(prefixSquash) || !rightSquash.startsWith(prefixSquash)) return 0;

  if (leftSquash.includes(rightSquash) || rightSquash.includes(leftSquash)) return 0.95;

  const overlap = nameDice(left, right);
  if (overlap >= 0.45) return 0.92;
  if (leftTokens.length >= 2 && rightTokens.length >= 2 && overlap >= 0.35) return 0.88;

  return 0;
}

function initialismTokens(text = '') {
  return canonicalizeRomanNumerals(String(text || ''))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(fc|cf|sc|ac|ec|se|es|af|rc|sd|ud|rcd|ca|cd|fk|sk|bk|if|hk|nk|ik|pfc|nj|ny)\b/g, ' ')
    .replace(/[:.!?_\-/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function initialismScore(shortName = '', longName = '') {
  const short = squashComparableName(shortName);
  const longTokens = initialismTokens(longName);
  if (short.length < 2 || short.length > 5 || !longTokens.length) return 0;

  const variants = new Set();
  variants.add(longTokens.map(token => token[0]).join(''));

  if (longTokens.length >= 2) {
    const [first, second] = longTokens;
    if (second === 'ps' || second.length <= 3) {
      variants.add(`${first[0] || ''}${second}`);
    }
    variants.add(`${first[0] || ''}${longTokens.slice(1).map(token => token[0]).join('')}`);
  }

  for (const variant of variants) {
    if (short === squashComparableName(variant)) return 0.96;
  }

  return 0;
}

function sameCityClubSuffixScore(left = '', right = '') {
  const leftTokens = left.split(/\s+/).filter(Boolean);
  const rightTokens = right.split(/\s+/).filter(Boolean);
  if (leftTokens.length !== 2 || rightTokens.length !== 2) return 0;
  if (leftTokens[0] !== rightTokens[0] || leftTokens[0].length < 5) return 0;

  const dice = nameDice(left, right);
  if (dice >= 0.48) return 0.9;
  return 0;
}

function tokenOverlapRatioScore(left = '', right = '') {
  const leftTokens = left.split(/\s+/).filter(token => token.length > 1);
  const rightTokens = right.split(/\s+/).filter(token => token.length > 1);
  if (!leftTokens.length || !rightTokens.length) return 0;

  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);
  let intersection = 0;
  for (const token of leftSet) {
    if (rightSet.has(token)) intersection += 1;
  }
  if (!intersection) return 0;

  const union = new Set([...leftSet, ...rightSet]).size;
  const jaccard = intersection / union;
  const coverage = intersection / Math.max(leftSet.size, rightSet.size);

  if (leftTokens[0] === rightTokens[0] && leftTokens[0].length >= 5 && coverage >= 0.5 && jaccard >= 0.33) {
    const dice = nameDice(left, right);
    if (dice >= 0.48) return Math.max(0.88, jaccard + 0.55);
  }

  return 0;
}

function tokenSubsetScore(left = '', right = '') {
  const leftTokens = new Set(left.split(/\s+/).filter(token => token.length > 1));
  const rightTokens = new Set(right.split(/\s+/).filter(token => token.length > 1));
  if (!leftTokens.size || !rightTokens.size) return 0;

  let intersection = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) intersection += 1;
  }

  const minSize = Math.min(leftTokens.size, rightTokens.size);
  const maxSize = Math.max(leftTokens.size, rightTokens.size);
  if (!intersection) return 0;

  const coverage = intersection / minSize;
  if (coverage < 1) return 0;

  if (maxSize === minSize) return 0.96;
  if (minSize === 1 && intersection === 1) return 0.94;
  return 0;
}

function acronymSuffixClubScore(left = '', right = '') {
  const leftTokens = left.split(/\s+/).filter(Boolean);
  const rightTokens = right.split(/\s+/).filter(Boolean);
  if (leftTokens.length < 2 || rightTokens.length < 2) return 0;

  const scorePair = (shortTokens, longTokens) => {
    const shortSuffix = shortTokens[shortTokens.length - 1];
    const longSuffix = longTokens[longTokens.length - 1];
    if (shortSuffix !== longSuffix || shortSuffix.length < 4) return 0;

    const shortHead = shortTokens.slice(0, -1);
    if (shortHead.length !== 1) return 0;

    const acronym = shortHead[0];
    if (acronym.length < 2 || acronym.length > 5) return 0;

    const init = Math.max(
      initialismScore(acronym, longTokens.slice(0, -1).join(' ')),
      initialismScore(acronym, longTokens.join(' '))
    );
    if (init >= 0.94) return 0.96;

    const dice = nameDice(shortTokens.join(' '), longTokens.join(' '));
    if (dice >= 0.42) return Math.max(0.9, dice + 0.45);

    return 0;
  };

  return Math.max(
    scorePair(leftTokens, rightTokens),
    scorePair(rightTokens, leftTokens)
  );
}

function flexibleNameSimilarity(a = '', b = '') {
  const left = normalizeTeamNameCore(a);
  const right = normalizeTeamNameCore(b);
  if (!left || !right) return 0;
  if (left === right) return 1;

  const leftSorted = sortedTokenSignature(left);
  const rightSorted = sortedTokenSignature(right);
  if (leftSorted === rightSorted) return 0.99;

  const leftSquash = squashComparableName(left);
  const rightSquash = squashComparableName(right);
  if (leftSquash && leftSquash === rightSquash) return 0.98;

  // Use normalized forms — raw "(Ger)/(Ned)" suffixes used to poison initialisms (DVTK).
  const initialism = Math.max(initialismScore(left, right), initialismScore(right, left));
  if (initialism >= 0.94) return initialism;

  const trailingAcronym = trailingAcronymClubScore(left, right);
  if (trailingAcronym >= 0.94) return trailingAcronym;

  const abbrevScore = abbreviatedTokenScore(left, right);
  if (abbrevScore >= 0.92) return abbrevScore;

  // Single-token truncated club names: "ind" ↔ "independiente"
  if (
    !left.includes(' ') &&
    !right.includes(' ') &&
    (isTokenAbbreviationOf(left, right) || isTokenAbbreviationOf(right, left))
  ) {
    return 0.94;
  }

  const acronymSuffix = Math.max(acronymSuffixClubScore(left, right), acronymSuffixClubScore(right, left));
  if (acronymSuffix >= 0.88) return acronymSuffix;

  const subsetScore = tokenSubsetScore(left, right);
  if (subsetScore >= 0.94) return subsetScore;

  const overlapScore = tokenOverlapRatioScore(left, right);
  if (overlapScore >= 0.88) return overlapScore;

  const cityClubScore = sameCityClubSuffixScore(left, right);
  if (cityClubScore >= 0.88) return cityClubScore;

  const prefixScore = sharedPrefixClubScore(left, right);
  if (prefixScore >= 0.88) return prefixScore;

  // Distinctive club token present in a longer form: "grossaspach" in "sonnenhof grossaspach"
  if (leftSquash.length >= 5 && rightSquash.length >= 5) {
    if (leftSquash.includes(rightSquash) || rightSquash.includes(leftSquash)) {
      return 0.95;
    }
  }

  // Honorific-stripped overlap for Friendlies ("Royale Union SG" ↔ "Union St. Gilloise")
  const leftBare = stripHonorificClubTokens(left);
  const rightBare = stripHonorificClubTokens(right);
  if (leftBare && rightBare && (leftBare !== left || rightBare !== right)) {
    const bareTrailing = trailingAcronymClubScore(leftBare, rightBare);
    if (bareTrailing >= 0.94) return bareTrailing;
    const bareSubset = tokenSubsetScore(leftBare, rightBare);
    if (bareSubset >= 0.94) return bareSubset;
    const bareLeftSquash = squashComparableName(leftBare);
    const bareRightSquash = squashComparableName(rightBare);
    if (
      bareLeftSquash.length >= 5 &&
      bareRightSquash.length >= 5 &&
      (bareLeftSquash.includes(bareRightSquash) || bareRightSquash.includes(bareLeftSquash))
    ) {
      return 0.94;
    }
  }

  const dice = nameDice(left, right);
  if (dice >= 0.72) return Math.max(0.9, Math.min(1, dice));
  if (dice >= 0.58) return 0.88;

  return 0;
}

module.exports = {
  applyTransliteration,
  squashComparableName,
  sortedTokenSignature,
  normalizeTeamNameCore,
  flexibleNameSimilarity,
  expandKnownClubAbbreviations,
  abbreviatedTokenScore,
  isTokenAbbreviationOf,
  CLUB_ABBREVIATIONS,
  TEAM_NICKNAMES,
};
