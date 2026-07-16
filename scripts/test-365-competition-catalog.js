const assert = require('assert');
const path = require('path');
const {
  CatalogStore,
  catalogScopeKey,
  resolveCatalogSportKey,
} = require('../lib/365-competition-catalog');

const store = new CatalogStore(path.join(__dirname, '..', 'config')).load();

assert.strictEqual(resolveCatalogSportKey('football'), 'football');
assert.strictEqual(resolveCatalogSportKey('latam_football'), 'football');
assert.strictEqual(resolveCatalogSportKey('israel_football'), 'football');
assert.strictEqual(resolveCatalogSportKey('basketball_usa'), 'basketball');
assert.strictEqual(resolveCatalogSportKey('latam_basketball'), 'basketball');
assert.strictEqual(resolveCatalogSportKey('american_football_usa'), 'american_football');
assert.strictEqual(resolveCatalogSportKey('baseball_usa'), 'baseball');
assert.strictEqual(resolveCatalogSportKey('latam_hockey'), 'hockey');
assert.strictEqual(resolveCatalogSportKey('latam_tennis'), 'tennis');
assert.strictEqual(resolveCatalogSportKey('tennis'), 'tennis');
assert.strictEqual(resolveCatalogSportKey('volleyball'), null);

assert.strictEqual(catalogScopeKey('International'), 'international');
assert.strictEqual(catalogScopeKey('Exhibition Men'), 'international');
assert.strictEqual(catalogScopeKey('Brazil'), 'brazil');
assert.strictEqual(catalogScopeKey('Africa'), 'africa');

assert.strictEqual(
  store.isInCatalog('football', 'Brazil', 'Brasileirão Série A'),
  true,
  'Brasileirão Série A should be in Brazil catalog scope'
);

assert.strictEqual(
  store.isInCatalog('football', 'England', 'Premier League'),
  true,
  'Premier League should match England scope only'
);

assert.strictEqual(
  store.isInCatalog('football', 'Brazil', 'Premier League'),
  false,
  'Premier League must not match via another country scope'
);

assert.strictEqual(
  store.isOutsideCatalog('basketball', 'Philippines', 'MPBL'),
  true,
  'MPBL should be outside basketball catalog'
);

assert.strictEqual(
  store.isInCatalog('basketball', 'Canada', 'CEBL'),
  true,
  'CEBL should be in Canada basketball catalog'
);

assert.strictEqual(
  store.isInCatalog('american_football_usa', 'USA', 'NFL'),
  true,
  'NFL should be in USA american football catalog'
);

assert.strictEqual(
  store.isInCatalog('baseball_usa', 'USA', 'MLB'),
  true,
  'MLB should be in USA baseball catalog'
);

assert.strictEqual(
  store.isInCatalog('hockey', 'Germany', 'DEL'),
  true,
  'DEL should be in Germany hockey catalog'
);

assert.strictEqual(
  store.isInCatalog('tennis', 'ATP', 'Miami'),
  true,
  'Miami ATP tournament should be in tennis catalog'
);

assert.strictEqual(
  store.isOutsideCatalog('hockey', 'Germany', 'Made Up League'),
  true,
  'Unknown hockey league should be outside catalog'
);

console.log('test-365-competition-catalog: ok');
