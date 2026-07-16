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

assert.strictEqual(
  normCountry('America'),
  normCountry('NORTH & CENTRAL AMERICA'),
  'CentroBasket scopes must merge'
);

console.log('test-america-scope-aliases: ok');
