const assert = require('assert');
const { getCountryDisplayName, resolveScopeKey } = require('../lib/country-flags');

assert.strictEqual(getCountryDisplayName('SIERRA LEONE', 'pt'), 'Serra Leoa');
assert.strictEqual(getCountryDisplayName('BELARUS', 'pt'), 'Bielorrússia');
assert.strictEqual(getCountryDisplayName('NEW ZEALAND', 'pt'), 'Nova Zelândia');
assert.strictEqual(getCountryDisplayName('CHILE', 'pt'), 'Chile');
assert.strictEqual(getCountryDisplayName('ZIMBABWE', 'pt'), 'Zimbábue');
assert.strictEqual(getCountryDisplayName('ICELAND', 'pt'), 'Islândia');
assert.strictEqual(getCountryDisplayName('EUROPE', 'pt'), 'Europa');
assert.strictEqual(getCountryDisplayName('LATVIA', 'pt'), 'Letónia');
assert.strictEqual(getCountryDisplayName('Morocco', 'pt'), 'Marrocos');
assert.strictEqual(getCountryDisplayName('Belarus', 'en'), 'Belarus');

assert.strictEqual(resolveScopeKey('Europa'), 'europe');
assert.strictEqual(resolveScopeKey('Europe'), 'europe');
assert.strictEqual(resolveScopeKey('EUROPE:'), 'europe');
assert.strictEqual(resolveScopeKey('Brasil'), 'brazil');
assert.strictEqual(resolveScopeKey('Internacional'), 'international');
assert.strictEqual(resolveScopeKey('Nova Zelândia'), 'new zealand');
assert.strictEqual(resolveScopeKey('Serra Leoa'), 'sierra leone');
assert.strictEqual(resolveScopeKey('NEW ZEALAND'), 'new zealand');

console.log('test-country-names-pt: ok');
