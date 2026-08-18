const assert = require('assert');
const { compareCountry, normCountry, groupByScope } = require('../compare.js');

assert.strictEqual(normCountry('Turkiye'), normCountry('TURKEY:'));
assert.strictEqual(normCountry('International'), normCountry('WORLD:'));

const turkey365 = [{
  home: 'Boluspor',
  away: 'Manisa FK',
  time: '15:30',
  status: 'scheduled',
  competition: '1. Lig',
  country: 'Turkiye',
}];
const turkeyFlash = [{
  home: 'Boluspor',
  away: 'Manisa FK',
  time: '15:30',
  status: 'scheduled',
  competition: '1. Lig',
  country: 'TURKEY:',
}];

const by365 = groupByScope(turkey365, 'football', '365');
const byFlash = groupByScope(turkeyFlash, 'football', 'flash');
const turkeyKeys = [...new Set([...Object.keys(by365), ...Object.keys(byFlash)])];
assert.strictEqual(turkeyKeys.length, 1, `Turkey scopes must share one key, got ${turkeyKeys.join(',')}`);

const turkeyResult = compareCountry(
  by365[turkeyKeys[0]].countryName,
  by365[turkeyKeys[0]].games,
  byFlash[turkeyKeys[0]].games,
  'football'
);
assert.strictEqual(turkeyResult.matched_pairs.length, 1, 'Boluspor / Manisa FK must match across Turkiye ↔ TURKEY:');
assert.strictEqual(turkeyResult.so_no_365.length, 0);
assert.strictEqual(turkeyResult.so_no_flash.length, 0);

const friendly365 = [{
  home: 'CF Intercity',
  away: 'Villarreal B',
  time: '05:00',
  status: 'scheduled',
  competition: 'Club Friendlies',
  country: 'International',
}];
const friendlyFlash = [{
  home: 'CF Intercity (Esp)',
  away: 'Villarreal B (Esp)',
  time: '05:00',
  status: 'scheduled',
  competition: 'Club Friendly',
  country: 'WORLD:',
}];

const by365F = groupByScope(friendly365, 'football', '365');
const byFlashF = groupByScope(friendlyFlash, 'football', 'flash');
const friendlyKeys = [...new Set([...Object.keys(by365F), ...Object.keys(byFlashF)])];
assert.strictEqual(friendlyKeys.length, 1, `International/WORLD scopes must share one key, got ${friendlyKeys.join(',')}`);

const friendlyResult = compareCountry(
  by365F[friendlyKeys[0]].countryName,
  by365F[friendlyKeys[0]].games,
  byFlashF[friendlyKeys[0]].games,
  'football'
);
assert.strictEqual(
  friendlyResult.matched_pairs.length,
  1,
  'CF Intercity / Villarreal B must match with Flash (Esp) country codes'
);
assert.strictEqual(friendlyResult.so_no_365.length, 0);
assert.strictEqual(friendlyResult.so_no_flash.length, 0);

const ofc365 = [
  {
    home: 'Auckland City',
    away: 'Rewa',
    time: '00:00',
    status: 'scheduled',
    competition: 'OFC Champions League',
    country: 'Oceania',
  },
  {
    home: 'Abm Galaxy',
    away: 'Central Coast',
    time: '04:00',
    status: 'scheduled',
    competition: 'OFC Champions League',
    country: 'Oceania',
  },
];
const ofcFlash = [
  {
    home: 'Auckland City (Nzl)',
    away: 'Rewa (Fij)',
    time: '00:00',
    status: 'scheduled',
    competition: 'OFC Champions League - Play Offs',
    country: 'AUSTRALIA & OCEANIA:',
  },
  {
    home: 'ABM Galaxy (Van)',
    away: 'Central Coast (Sol)',
    time: '04:00',
    status: 'scheduled',
    competition: 'OFC Champions League - Play Offs',
    country: 'AUSTRALIA & OCEANIA:',
  },
];

const by365Ofc = groupByScope(ofc365, 'football', '365');
const byFlashOfc = groupByScope(ofcFlash, 'football', 'flash');
const ofcKeys = [...new Set([...Object.keys(by365Ofc), ...Object.keys(byFlashOfc)])];
assert.strictEqual(ofcKeys.length, 1, `OFC scopes must share one key, got ${ofcKeys.join(',')}`);

const ofcResult = compareCountry(
  by365Ofc[ofcKeys[0]].countryName,
  by365Ofc[ofcKeys[0]].games,
  byFlashOfc[ofcKeys[0]].games,
  'football'
);
assert.strictEqual(ofcResult.matched_pairs.length, 2, 'OFC Champions League playoff ties must match');
assert.strictEqual(ofcResult.so_no_365.length, 0);
assert.strictEqual(ofcResult.so_no_flash.length, 0);

console.log('test-scope-country-merge-match: ok');
