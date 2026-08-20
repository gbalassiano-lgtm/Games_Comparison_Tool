const assert = require('assert');
const {
  getCountryDisplayName,
  getCountryIsoCode,
  getCountryFlagUrl,
  resolveScopeKey,
} = require('../lib/country-flags');

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
assert.strictEqual(getCountryDisplayName('Bosnia & Herzegovina', 'pt'), 'Bósnia e Herzegovina');
assert.strictEqual(getCountryDisplayName('Gibraltar', 'pt'), 'Gibraltar');

assert.strictEqual(getCountryIsoCode('Bosnia & Herzegovina'), 'ba');
assert.strictEqual(getCountryIsoCode('Bosnia and Herzegovina'), 'ba');
assert.strictEqual(getCountryIsoCode('Bósnia e Herzegovina'), 'ba');
assert.strictEqual(getCountryIsoCode('Gibraltar'), 'gi');
assert.ok(getCountryFlagUrl('Bosnia & Herzegovina').includes('/ba'));
assert.ok(getCountryFlagUrl('Gibraltar').includes('/gi'));

assert.strictEqual(resolveScopeKey('Europa'), 'europe');
assert.strictEqual(resolveScopeKey('Europe'), 'europe');
assert.strictEqual(resolveScopeKey('EUROPE:'), 'europe');
assert.strictEqual(resolveScopeKey('Brasil'), 'brazil');
assert.strictEqual(resolveScopeKey('Internacional'), 'international');
assert.strictEqual(resolveScopeKey('Nova Zelândia'), 'new zealand');
assert.strictEqual(resolveScopeKey('Serra Leoa'), 'sierra leone');
assert.strictEqual(resolveScopeKey('NEW ZEALAND'), 'new zealand');
assert.strictEqual(resolveScopeKey('Bosnia & Herzegovina'), 'bosnia and herzegovina');
assert.strictEqual(resolveScopeKey('Gibraltar'), 'gibraltar');

console.log('test-country-names-pt: ok');
