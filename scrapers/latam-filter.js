function normalizeCountryKey(country = '') {
  return String(country || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[:.!?]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const LATAM_COUNTRY_KEYS = new Set([
  'argentina',
  'bolivia',
  'chile',
  'colombia',
  'costa rica',
  'cuba',
  'ecuador',
  'el salvador',
  'guatemala',
  'honduras',
  'jamaica',
  'mexico',
  'nicaragua',
  'panama',
  'paraguay',
  'peru',
  'republica dominicana',
  'dominican republic',
  'uruguay',
  'venezuela',
]);

const LATAM_REGIONAL_KEYS = new Set([
  'america',
  'north america',
  'south america',
  'america latina',
  'latin america',
  'latam',
  'america do sul',
  'america do norte',
  'america central',
  'central america',
  'concacaf',
]);

function isLatamCountry(country = '') {
  const key = normalizeCountryKey(country);
  if (!key) return false;
  if (LATAM_COUNTRY_KEYS.has(key)) return true;
  if (LATAM_REGIONAL_KEYS.has(key)) return true;

  for (const countryKey of LATAM_COUNTRY_KEYS) {
    if (key === countryKey || key.startsWith(`${countryKey} `) || key.endsWith(` ${countryKey}`)) {
      return true;
    }
  }

  return false;
}

function isLatamTennisRow(row = {}) {
  const competition = normalizeCountryKey(row.competition || row.name || '');
  if (!competition) return false;

  for (const countryKey of LATAM_COUNTRY_KEYS) {
    const pattern = `(${countryKey})`;
    if (competition.includes(pattern)) return true;
  }

  return false;
}

function filter365Grouped(data = [], sportKey = '') {
  return (Array.isArray(data) ? data : []).filter(group => {
    const label = group.country || group.tour || group.label || '';
    if (sportKey === 'tennis') {
      return isLatamCountry(label) || (group.competitions || []).some(comp => (
        isLatamTennisRow(comp) ||
        (comp.matches || []).some(match => isLatamTennisRow(match))
      ));
    }
    return isLatamCountry(label);
  });
}

function filterFlashFlat(data = [], sportKey = '') {
  return (Array.isArray(data) ? data : [])
    .filter(row => {
      if (sportKey === 'tennis') {
        return isLatamTennisRow(row);
      }
      return isLatamCountry(row.country || '');
    })
    .map(row => ({
      ...row,
      country: String(row.country || '').replace(/[:.]+$/g, '').trim() || row.country,
    }));
}

module.exports = {
  LATAM_COUNTRY_KEYS,
  LATAM_REGIONAL_KEYS,
  isLatamCountry,
  isLatamTennisRow,
  filter365Grouped,
  filterFlashFlat,
};
