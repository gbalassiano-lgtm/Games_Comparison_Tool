function normalizeCountryKey(country = '') {
  return String(country || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[:.!?]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const ISRAEL_COUNTRY_KEYS = new Set([
  'israel',
  'israeli',
]);

function isIsraelCountry(country = '') {
  const key = normalizeCountryKey(country);
  if (!key) return false;
  if (ISRAEL_COUNTRY_KEYS.has(key)) return true;

  for (const countryKey of ISRAEL_COUNTRY_KEYS) {
    if (key === countryKey || key.startsWith(`${countryKey} `) || key.endsWith(` ${countryKey}`)) {
      return true;
    }
  }

  return key.includes('israel');
}

function filter365Grouped(data = []) {
  return (Array.isArray(data) ? data : []).filter(group => {
    const label = group.country || group.tour || group.label || '';
    return isIsraelCountry(label);
  });
}

function filterFlashFlat(data = []) {
  return (Array.isArray(data) ? data : [])
    .filter(row => isIsraelCountry(row.country || ''))
    .map(row => ({
      ...row,
      country: String(row.country || '').replace(/[:.]+$/g, '').trim() || row.country,
    }));
}

module.exports = {
  ISRAEL_COUNTRY_KEYS,
  isIsraelCountry,
  filter365Grouped,
  filterFlashFlat,
};
