function normalizeCountryKey(country = '') {
  return String(country || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[:.!?]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const USA_KEYS = new Set([
  'usa',
  'eua',
  'estados unidos',
  'united states',
  'u s a',
  'us',
]);

function isUsaCountry(country = '') {
  return USA_KEYS.has(normalizeCountryKey(country));
}

function filter365Grouped(data = []) {
  return (Array.isArray(data) ? data : [])
    .filter(group => isUsaCountry(group.country || group.label || ''))
    .map(group => ({
      ...group,
      country: 'USA',
    }));
}

function filterFlashFlat(data = []) {
  return (Array.isArray(data) ? data : [])
    .filter(row => isUsaCountry(row.country || ''))
    .map(row => ({
      ...row,
      country: String(row.country || 'USA').replace(/[:.]+$/g, '').trim() || 'USA',
    }));
}

module.exports = {
  isUsaCountry,
  filter365Grouped,
  filterFlashFlat,
};
