function isNormalizedCompPrefixMatch(left = '', right = '') {
  const a = String(left || '').trim();
  const b = String(right || '').trim();
  if (!a || !b) return false;
  if (a === b) return true;

  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (short === long) return true;
  if (!long.startsWith(short)) return false;

  const rest = long.slice(short.length);
  return /^[\s\-|/:]+/.test(rest) && rest.replace(/^[\s\-|/:]+/, '').trim().length > 0;
}

module.exports = {
  isNormalizedCompPrefixMatch,
};
