const assert = require('assert');
const path = require('path');
const {
  CatalogStore,
  buildScan365PresenceIndex,
  competition365CoversLeague,
  isCompetitionOutside365Catalog,
} = require('../lib/365-competition-catalog');

const store = new CatalogStore(path.join(__dirname, '..', 'config')).load();

const ecuadorSerieBScan = {
  id: 'test-ecuador-serie-b',
  sport: 'football',
  result: {
    countries: [
      {
        country: 'Ecuador',
        sport: 'football',
        result: {
          so_no_flash: [
            { competicao: 'Serie B', home: 'Dep. Santo Domingo', away: 'Ind. Juniors' },
          ],
          matched_pairs: [
            {
              competition365: 'Serie B',
              competitionFlash: 'Serie B',
              home365: 'Atlético FC',
              away365: 'El Nacional',
            },
            {
              competition365: 'Serie B',
              competitionFlash: 'Serie B',
              home365: 'Cumbaya',
              away365: '22 de Julio',
            },
          ],
          so_no_365: [],
        },
      },
    ],
  },
};

assert.strictEqual(
  store.isInCatalog('football', 'Ecuador', 'Serie B'),
  false,
  'Ecuador Serie B should not be in static catalog'
);

const ecuadorPresence = buildScan365PresenceIndex(ecuadorSerieBScan);
assert.ok(
  competition365CoversLeague(store, 'football', 'Ecuador', 'Serie B', ecuadorSerieBScan, ecuadorPresence),
  'Scan matched_pairs should prove 365 covers Ecuador Serie B'
);

assert.strictEqual(
  isCompetitionOutside365Catalog(store, 'football', 'Ecuador', 'Serie B', ecuadorSerieBScan, ecuadorPresence),
  false,
  'onlyFlash Serie B row must not be classified as outside when scan has matched Serie B games'
);

const emptyScan = { sport: 'basketball', result: { countries: [] } };
const mpblPresence = buildScan365PresenceIndex(emptyScan);

assert.strictEqual(
  store.isInCatalog('basketball', 'Philippines', 'MPBL'),
  false,
  'MPBL should not be in basketball catalog'
);

assert.strictEqual(
  competition365CoversLeague(store, 'basketball', 'Philippines', 'MPBL', emptyScan, mpblPresence),
  false,
  'MPBL should not be covered without catalog or scan presence'
);

assert.strictEqual(
  isCompetitionOutside365Catalog(store, 'basketball', 'Philippines', 'MPBL', emptyScan, mpblPresence),
  true,
  'MPBL Philippines should be outside when basketball catalog exists and scan has no 365 presence'
);

const friendlyScan = {
  sport: 'football',
  result: {
    countries: [{
      country: 'International',
      sport: 'football',
      result: { so_no_flash: [{ competicao: 'Club Friendly' }], matched_pairs: [], so_no_365: [] },
    }],
  },
};
const friendlyPresence = buildScan365PresenceIndex(friendlyScan);

assert.strictEqual(
  store.isInCatalog('football', 'International', 'Club Friendly'),
  false,
  'Club Friendly should not be in static catalog'
);

assert.strictEqual(
  isCompetitionOutside365Catalog(store, 'football', 'International', 'Club Friendly', friendlyScan, friendlyPresence),
  false,
  'Club Friendly must alert as operational missing365, not be hidden as outside catalog'
);

assert.strictEqual(
  isCompetitionOutside365Catalog(store, 'football', 'International', 'Friendly International', friendlyScan, friendlyPresence),
  false,
  'Friendly International must alert as operational missing365, not be hidden as outside catalog'
);

console.log('test-catalog-vs-scan-presence: ok');
