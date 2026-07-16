const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createRequire } = require('module');

const root = path.join(__dirname, '..');
process.chdir(root);
require('dotenv').config();

const comparePath = path.join(root, 'compare.js');
const rootRequire = createRequire(comparePath);
const code = fs.readFileSync(comparePath, 'utf8');
const sandbox = {
  module: { exports: {} },
  exports: {},
  require: rootRequire,
  __dirname: root,
  path,
  fs,
  process,
  console,
};
vm.runInNewContext(`${code}\nglobalOut = { normComp, compSim, compareCountry };`, sandbox);
const { normComp, compSim, compareCountry } = sandbox.globalOut;

let failed = 0;

function assert(condition, message) {
  if (!condition) {
    failed += 1;
    console.error(`FAIL | ${message}`);
  } else {
    console.log(`OK   | ${message}`);
  }
}

const sameKeyCases = [
  ['EuroBasket U20', 'EuroBasket U20 - Play Offs'],
  ['EuroBasket U20', 'EuroBasket U20 - 9th-16th places'],
  ['EuroBasket U20', 'EuroBasket U20 - Group A'],
  ['EuroBasket U20', 'EuroBasket U20 - Semi-Finals'],
  ['EuroBasket U20', 'EuroBasket U20 - Quarter-Finals'],
  ['EuroBasket U20', 'EuroBasket U20 - Final'],
  ['EuroBasket U16 C Women', 'EuroBasket U16 C Women - 5th-7th places'],
  ['Asian Championship U18', 'Asian Championship U18 - 9th-16th places'],
];

for (const [left, right] of sameKeyCases) {
  const nLeft = normComp(left, 'basketball');
  const nRight = normComp(right, 'basketball');
  assert(nLeft === nRight, `normComp(${left}) === normComp(${right}) (${nLeft} vs ${nRight})`);
  assert(compSim(left, right, 'basketball') >= 0.98, `compSim(${left}, ${right}) high`);
}

assert(
  normComp('EuroBasket U20', 'basketball') !== normComp('EuroBasket U20 B', 'basketball'),
  'EuroBasket U20 B stays distinct from EuroBasket U20'
);

assert(
  normComp('Kakkonen Group A', 'football') !== normComp('Kakkonen Group B', 'football'),
  'Kakkonen Group A/B remain distinct (not FIBA-style)'
);

assert(
  normComp('Kakkonen Group A', 'football').includes('group'),
  'Kakkonen Group letter is preserved'
);

const games365 = [
  { country: 'Europe', competition: 'EuroBasket U20', home: 'France U20', away: 'Croatia U20', time: '12:00', status: 'scheduled' },
  { country: 'Europe', competition: 'EuroBasket U20', home: 'Latvia U20', away: 'Romania U20', time: '12:00', status: 'scheduled' },
];
const gamesFlash = [
  { country: 'EUROPE:', competition: 'EuroBasket U20 - Play Offs', home: 'France U20', away: 'Croatia U20', time: '12:00', status: 'scheduled' },
  { country: 'EUROPE:', competition: 'EuroBasket U20 - 9th-16th places', home: 'Latvia U20', away: 'Romania U20', time: '12:00', status: 'scheduled' },
];
const result = compareCountry('Europe', games365, gamesFlash, 'basketball');
assert(result.matched_pairs.length === 2, 'both Flash stages match 365 EuroBasket U20');
assert(result.so_no_365.length === 0 && result.so_no_flash.length === 0, 'no only365/onlyFlash leftovers');
assert(
  result.matched_pairs.every((p) => p.compKey365 === p.compKeyFlash && p.compKey365 === 'eurobasket u20'),
  'matched pairs share the same stripped competition key'
);

if (failed) {
  console.error(`\n${failed} assertion(s) failed.`);
  process.exit(1);
}

console.log('\ntest-eurobasket-stage-norm: ok');
