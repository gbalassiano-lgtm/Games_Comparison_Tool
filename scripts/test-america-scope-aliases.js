const assert = require('assert');
const { normCountry } = require('../compare.js');

assert.strictEqual(normCountry('America'), 'america');
assert.strictEqual(normCountry('AMERICA:'), 'america');
assert.strictEqual(normCountry('NORTH & CENTRAL AMERICA'), 'america');
assert.strictEqual(normCountry('North and Central America'), 'america');
assert.strictEqual(normCountry('America do Norte e Central'), 'america');
assert.strictEqual(normCountry('CONCACAF'), 'america');

assert.strictEqual(normCountry('Europe'), 'europe');
assert.strictEqual(normCountry('EUROPE:'), 'europe');
assert.strictEqual(normCountry('Africa'), 'africa');
assert.strictEqual(normCountry('AFRICA:'), 'africa');

assert.strictEqual(normCountry('Oceania'), 'oceania');
assert.strictEqual(normCountry('OCEANIA:'), 'oceania');
assert.strictEqual(normCountry('AUSTRALIA & OCEANIA:'), 'oceania');
assert.strictEqual(normCountry('Australia and Oceania'), 'oceania');
assert.strictEqual(
  normCountry('Oceania'),
  normCountry('AUSTRALIA & OCEANIA:'),
  'OFC scopes must merge Oceania ↔ Australia & Oceania'
);

assert.strictEqual(
  normCountry('America'),
  normCountry('NORTH & CENTRAL AMERICA'),
  'CentroBasket scopes must merge'
);

assert.strictEqual(normCountry('Turkiye'), 'turkiye');
assert.strictEqual(normCountry('TURKEY:'), 'turkiye');
assert.strictEqual(normCountry('Turkey'), 'turkiye');
assert.strictEqual(normCountry('Turquia'), 'turkiye');
assert.strictEqual(
  normCountry('Turkiye'),
  normCountry('TURKEY:'),
  'Turkey / Türkiye / Turquia scopes must merge'
);

console.log('test-america-scope-aliases: ok');
