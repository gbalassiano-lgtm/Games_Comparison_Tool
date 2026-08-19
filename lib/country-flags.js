function normalizeCountryKey(name = '') {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^(football|futebol|basketball|basquete|hockey|volleyball|volei|tennis|tenis)\s*\/\s*/i, '')
    .replace(/[:.!?]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const COUNTRY_NAME_ALIASES = {
  'paises baixos': 'netherlands',
  'holanda': 'netherlands',
  'holland': 'netherlands',
  'uk': 'united kingdom',
  'great britain': 'united kingdom',
  'grã-bretanha': 'united kingdom',
  'grao-bretanha': 'united kingdom',
  'reino unido': 'united kingdom',
  'czech republic': 'czechia',
  'republica tcheca': 'czechia',
  'coreia': 'south korea',
  'south korea': 'south korea',
  'coreia do sul': 'south korea',
  'brasil': 'brazil',
  'eua': 'usa',
  'estados unidos': 'usa',
  'united states': 'usa',
  'united states of america': 'usa',
  'mundo': 'world',
  'international': 'world',
  'internacional': 'world',
  'viet nam': 'vietnam',
  'russia': 'russian federation',
  'russia federation': 'russian federation',
  'turkey': 'turkiye',
  'turquia': 'turkiye',
  'ivory coast': 'cote divoire',
  'costa do marfim': 'cote divoire',
  "cote d'ivoire": 'cote divoire',
  'cote divoire': 'cote divoire',
  'bosnia': 'bosnia and herzegovina',
  'bosnia herzegovina': 'bosnia and herzegovina',
  'north macedonia': 'north macedonia',
  'macedonia': 'north macedonia',
  'hong kong': 'hong kong',
  'taiwan': 'taiwan',
  'chinese taipei': 'taiwan',
  'porto rico': 'puerto rico',
};

const COUNTRY_ISO = {
  afghanistan: 'af',
  albania: 'al',
  algeria: 'dz',
  andorra: 'ad',
  angola: 'ao',
  argentina: 'ar',
  armenia: 'am',
  australia: 'au',
  austria: 'at',
  azerbaijan: 'az',
  bahrain: 'bh',
  bangladesh: 'bd',
  belarus: 'by',
  belgium: 'be',
  belize: 'bz',
  benin: 'bj',
  bhutan: 'bt',
  bolivia: 'bo',
  'bosnia and herzegovina': 'ba',
  botswana: 'bw',
  brazil: 'br',
  bulgaria: 'bg',
  'burkina faso': 'bf',
  burundi: 'bi',
  cambodia: 'kh',
  cameroon: 'cm',
  canada: 'ca',
  chile: 'cl',
  china: 'cn',
  colombia: 'co',
  'cote divoire': 'ci',
  'costa rica': 'cr',
  croatia: 'hr',
  cuba: 'cu',
  cyprus: 'cy',
  czechia: 'cz',
  denmark: 'dk',
  'dominican republic': 'do',
  ecuador: 'ec',
  egypt: 'eg',
  'el salvador': 'sv',
  england: 'gb-eng',
  estonia: 'ee',
  ethiopia: 'et',
  'faroe islands': 'fo',
  fiji: 'fj',
  finland: 'fi',
  france: 'fr',
  gabon: 'ga',
  georgia: 'ge',
  germany: 'de',
  ghana: 'gh',
  greece: 'gr',
  guatemala: 'gt',
  honduras: 'hn',
  'hong kong': 'hk',
  hungary: 'hu',
  iceland: 'is',
  india: 'in',
  indonesia: 'id',
  iran: 'ir',
  iraq: 'iq',
  ireland: 'ie',
  israel: 'il',
  italy: 'it',
  jamaica: 'jm',
  japan: 'jp',
  jordan: 'jo',
  kazakhstan: 'kz',
  kenya: 'ke',
  kosovo: 'xk',
  kuwait: 'kw',
  kyrgyzstan: 'kg',
  latvia: 'lv',
  lebanon: 'lb',
  libya: 'ly',
  lithuania: 'lt',
  luxembourg: 'lu',
  malaysia: 'my',
  malawi: 'mw',
  malta: 'mt',
  mexico: 'mx',
  moldova: 'md',
  mongolia: 'mn',
  montenegro: 'me',
  morocco: 'ma',
  mozambique: 'mz',
  myanmar: 'mm',
  nepal: 'np',
  netherlands: 'nl',
  'new zealand': 'nz',
  nicaragua: 'ni',
  nigeria: 'ng',
  'north macedonia': 'mk',
  'northern ireland': 'gb-nir',
  norway: 'no',
  oman: 'om',
  pakistan: 'pk',
  palestine: 'ps',
  panama: 'pa',
  paraguay: 'py',
  peru: 'pe',
  philippines: 'ph',
  poland: 'pl',
  portugal: 'pt',
  'puerto rico': 'pr',
  qatar: 'qa',
  romania: 'ro',
  'russian federation': 'ru',
  rwanda: 'rw',
  'saudi arabia': 'sa',
  scotland: 'gb-sct',
  senegal: 'sn',
  serbia: 'rs',
  'sierra leone': 'sl',
  singapore: 'sg',
  slovakia: 'sk',
  slovenia: 'si',
  somalia: 'so',
  'south africa': 'za',
  'south korea': 'kr',
  spain: 'es',
  'sri lanka': 'lk',
  sudan: 'sd',
  sweden: 'se',
  switzerland: 'ch',
  syria: 'sy',
  taiwan: 'tw',
  tajikistan: 'tj',
  tanzania: 'tz',
  thailand: 'th',
  tunisia: 'tn',
  turkiye: 'tr',
  uganda: 'ug',
  ukraine: 'ua',
  'united arab emirates': 'ae',
  'united kingdom': 'gb',
  uruguay: 'uy',
  usa: 'us',
  uzbekistan: 'uz',
  venezuela: 've',
  vietnam: 'vn',
  wales: 'gb-wls',
  world: '',
  yemen: 'ye',
  zambia: 'zm',
  zimbabwe: 'zw',
};

const COUNTRY_NAMES_PT = {
  afghanistan: 'Afeganistão',
  albania: 'Albânia',
  algeria: 'Argélia',
  andorra: 'Andorra',
  angola: 'Angola',
  argentina: 'Argentina',
  armenia: 'Arménia',
  australia: 'Austrália',
  austria: 'Áustria',
  azerbaijan: 'Azerbaijão',
  bahrain: 'Barém',
  bangladesh: 'Bangladesh',
  belarus: 'Bielorrússia',
  belgium: 'Bélgica',
  belize: 'Belize',
  benin: 'Benim',
  bhutan: 'Butão',
  bolivia: 'Bolívia',
  'bosnia and herzegovina': 'Bósnia e Herzegovina',
  botswana: 'Botsuana',
  brazil: 'Brasil',
  bulgaria: 'Bulgária',
  'burkina faso': 'Burquina Faso',
  burundi: 'Burundi',
  cambodia: 'Camboja',
  cameroon: 'Camarões',
  canada: 'Canadá',
  chile: 'Chile',
  china: 'China',
  colombia: 'Colômbia',
  'cote divoire': 'Costa do Marfim',
  'costa rica': 'Costa Rica',
  croatia: 'Croácia',
  cuba: 'Cuba',
  cyprus: 'Chipre',
  czechia: 'Chéquia',
  denmark: 'Dinamarca',
  'dominican republic': 'República Dominicana',
  ecuador: 'Equador',
  egypt: 'Egito',
  'el salvador': 'El Salvador',
  england: 'Inglaterra',
  estonia: 'Estónia',
  ethiopia: 'Etiópia',
  'faroe islands': 'Ilhas Faroé',
  fiji: 'Fiji',
  finland: 'Finlândia',
  france: 'França',
  gabon: 'Gabão',
  georgia: 'Geórgia',
  germany: 'Alemanha',
  ghana: 'Gana',
  greece: 'Grécia',
  guatemala: 'Guatemala',
  honduras: 'Honduras',
  'hong kong': 'Hong Kong',
  hungary: 'Hungria',
  iceland: 'Islândia',
  india: 'Índia',
  indonesia: 'Indonésia',
  iran: 'Irão',
  iraq: 'Iraque',
  ireland: 'Irlanda',
  israel: 'Israel',
  italy: 'Itália',
  jamaica: 'Jamaica',
  japan: 'Japão',
  jordan: 'Jordânia',
  kazakhstan: 'Cazaquistão',
  kenya: 'Quénia',
  kosovo: 'Kosovo',
  kuwait: 'Kuwait',
  kyrgyzstan: 'Quirguistão',
  latvia: 'Letónia',
  lebanon: 'Líbano',
  libya: 'Líbia',
  lithuania: 'Lituânia',
  luxembourg: 'Luxemburgo',
  malaysia: 'Malásia',
  malta: 'Malta',
  mexico: 'México',
  moldova: 'Moldávia',
  mongolia: 'Mongólia',
  montenegro: 'Montenegro',
  morocco: 'Marrocos',
  mozambique: 'Moçambique',
  myanmar: 'Mianmar',
  nepal: 'Nepal',
  netherlands: 'Países Baixos',
  'new zealand': 'Nova Zelândia',
  nicaragua: 'Nicarágua',
  nigeria: 'Nigéria',
  'north macedonia': 'Macedónia do Norte',
  'northern ireland': 'Irlanda do Norte',
  norway: 'Noruega',
  oman: 'Omã',
  pakistan: 'Paquistão',
  palestine: 'Palestina',
  panama: 'Panamá',
  paraguay: 'Paraguai',
  peru: 'Peru',
  philippines: 'Filipinas',
  poland: 'Polónia',
  portugal: 'Portugal',
  'puerto rico': 'Porto Rico',
  qatar: 'Catar',
  romania: 'Roménia',
  'russian federation': 'Rússia',
  rwanda: 'Ruanda',
  'saudi arabia': 'Arábia Saudita',
  scotland: 'Escócia',
  senegal: 'Senegal',
  serbia: 'Sérvia',
  'sierra leone': 'Serra Leoa',
  singapore: 'Singapura',
  slovakia: 'Eslováquia',
  slovenia: 'Eslovénia',
  somalia: 'Somália',
  'south africa': 'África do Sul',
  'south korea': 'Coreia do Sul',
  spain: 'Espanha',
  'sri lanka': 'Sri Lanka',
  sudan: 'Sudão',
  sweden: 'Suécia',
  switzerland: 'Suíça',
  syria: 'Síria',
  taiwan: 'Taiwan',
  tajikistan: 'Tajiquistão',
  tanzania: 'Tanzânia',
  thailand: 'Tailândia',
  tunisia: 'Tunísia',
  turkiye: 'Turquia',
  uganda: 'Uganda',
  ukraine: 'Ucrânia',
  'united arab emirates': 'Emirados Árabes Unidos',
  'united kingdom': 'Reino Unido',
  uruguay: 'Uruguai',
  usa: 'Estados Unidos',
  uzbekistan: 'Usbequistão',
  venezuela: 'Venezuela',
  vietnam: 'Vietname',
  wales: 'País de Gales',
  world: 'Mundo',
  yemen: 'Iémen',
  zambia: 'Zâmbia',
  zimbabwe: 'Zimbábue',
};

const REGION_NAMES_PT = {
  international: 'Internacional',
  europe: 'Europa',
  asia: 'Ásia',
  africa: 'África',
  'south-america': 'América do Sul',
  'north-america': 'América do Norte',
  oceania: 'Oceania',
};

const COUNTRY_NAMES_PT_REVERSE = Object.fromEntries(
  Object.entries(COUNTRY_NAMES_PT).map(([enKey, ptLabel]) => [
    normalizeCountryKey(ptLabel),
    enKey,
  ]).filter(([ptKey]) => ptKey)
);

const REGION_NAMES_PT_REVERSE = Object.fromEntries(
  Object.entries(REGION_NAMES_PT).map(([enKey, ptLabel]) => [
    normalizeCountryKey(ptLabel),
    enKey,
  ]).filter(([ptKey]) => ptKey)
);

function getCountryDisplayName(countryName = '', language = 'en') {
  if (!countryName || language !== 'pt') return countryName;

  const raw = normalizeCountryKey(countryName);
  if (!raw) return countryName;

  const regionKey = REGION_SCOPE_ALIASES[raw];
  if (regionKey && REGION_NAMES_PT[regionKey]) {
    return REGION_NAMES_PT[regionKey];
  }

  const aliased = COUNTRY_NAME_ALIASES[raw] || raw;
  if (Object.prototype.hasOwnProperty.call(COUNTRY_NAMES_PT, aliased)) {
    return COUNTRY_NAMES_PT[aliased];
  }

  const compact = aliased.replace(/\s+/g, '');
  for (const [name, label] of Object.entries(COUNTRY_NAMES_PT)) {
    if (name.replace(/\s+/g, '') === compact) return label;
  }

  return countryName;
}

function getTennisScopeLogoUrl(countryName = '') {
  const raw = normalizeCountryKey(countryName);
  if (!raw) return '';
  if (/^challenger\b/.test(raw)) return '/brand/tennis/challenger.png';
  if (/^atp\b/.test(raw)) return '/brand/tennis/atp.png';
  if (/^wta\b/.test(raw)) return '/brand/tennis/wta.png';
  return '';
}

const REGION_SCOPE_ALIASES = {
  world: 'international',
  mundo: 'international',
  international: 'international',
  internacional: 'international',
  global: 'international',
  intl: 'international',
  asia: 'asia',
  europe: 'europe',
  europa: 'europe',
  'south america': 'south-america',
  'south-america': 'south-america',
  'america do sul': 'south-america',
  'north america': 'north-america',
  'north-america': 'north-america',
  'america do norte': 'north-america',
  america: 'international',
  africa: 'africa',
  oceania: 'oceania',
  'australia & oceania': 'oceania',
  'australia and oceania': 'oceania',
  'australia oceania': 'oceania',
};

const SCOPE_WILDCARDS = new Set([
  '',
  '*',
  'all',
  'all competitions',
  'todas',
  'todas as competicoes',
  'todas as competições',
]);

function resolveScopeKey(scope = '') {
  const raw = normalizeCountryKey(scope);
  if (!raw || SCOPE_WILDCARDS.has(raw)) return '*';

  const regionKey = REGION_SCOPE_ALIASES[raw];
  if (regionKey) return regionKey;

  if (REGION_NAMES_PT_REVERSE[raw]) return REGION_NAMES_PT_REVERSE[raw];
  if (COUNTRY_NAME_ALIASES[raw]) return COUNTRY_NAME_ALIASES[raw];
  if (COUNTRY_NAMES_PT_REVERSE[raw]) return COUNTRY_NAMES_PT_REVERSE[raw];

  return raw;
}

const REGION_SCOPE_LOGOS = {
  international: '/brand/regions/international.png',
  asia: '/brand/regions/asia.png',
  africa: '/brand/regions/africa.png',
  'south-america': '/brand/regions/south-america.png',
  'north-america': '/brand/regions/north-america.png',
  europe: '/brand/regions/europe.png',
  oceania: '/brand/regions/oceania.png',
};

function getRegionScopeLogoUrl(countryName = '') {
  const raw = normalizeCountryKey(countryName);
  if (!raw) return '';
  const key = REGION_SCOPE_ALIASES[raw];
  if (!key) return '';
  return REGION_SCOPE_LOGOS[key] || '';
}

function getCountryIsoCode(countryName = '') {
  const raw = normalizeCountryKey(countryName);
  if (!raw || raw === '-' || raw === 'sem grupo') return '';
  if (/^(atp|wta|challenger|itf)\b/.test(raw)) return '';

  const aliased = COUNTRY_NAME_ALIASES[raw] || raw;
  if (Object.prototype.hasOwnProperty.call(COUNTRY_ISO, aliased)) {
    return COUNTRY_ISO[aliased];
  }

  const compact = aliased.replace(/\s+/g, '');
  for (const [name, code] of Object.entries(COUNTRY_ISO)) {
    if (name.replace(/\s+/g, '') === compact) return code;
  }

  return '';
}

function normalizeFlagSize(size = 40) {
  const n = Number(size) || 40;
  if (n <= 20) return 20;
  if (n <= 40) return 40;
  return 80;
}

function getCountryFlagUrl(countryName = '', size = 40) {
  const code = getCountryIsoCode(countryName);
  if (!code) return '';
  const safeSize = normalizeFlagSize(size);
  if (typeof window !== 'undefined') {
    return `/api/flag/${code}?s=${safeSize}`;
  }
  return `https://flagcdn.com/w${safeSize}/${code}.png`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeCountryKey,
    COUNTRY_NAME_ALIASES,
    resolveScopeKey,
    normalizeFlagSize,
    getTennisScopeLogoUrl,
    getRegionScopeLogoUrl,
    getCountryIsoCode,
    getCountryFlagUrl,
    getCountryDisplayName,
  };
}

if (typeof window !== 'undefined') {
  window.CountryFlags = {
    normalizeFlagSize,
    getTennisScopeLogoUrl,
    getRegionScopeLogoUrl,
    getCountryFlagUrl,
    getCountryIsoCode,
    getCountryDisplayName,
    resolveScopeKey,
  };
}
