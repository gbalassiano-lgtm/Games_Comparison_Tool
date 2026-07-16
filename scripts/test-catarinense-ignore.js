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
vm.runInNewContext(`${code}\nglobalOut = { normComp, compareCountry, shouldIgnoreCompetitionByRule, expandCompetitionNamesForIgnore, shouldIgnoreCompareIssue };`, sandbox);
const { normComp, compareCountry, shouldIgnoreCompetitionByRule, expandCompetitionNamesForIgnore, shouldIgnoreCompareIssue } = sandbox.globalOut;

let failed = 0;

function assert(condition, message) {
  if (!condition) {
    failed += 1;
    console.error(`FAIL | ${message}`);
  } else {
    console.log(`OK   | ${message}`);
  }
}

console.log('normComp("Catarinense 2") =', normComp('Catarinense 2', 'football'));
console.log('normComp("Catarinense - Serie B") =', normComp('Catarinense - Serie B', 'football'));

const namesFromFlash = expandCompetitionNamesForIgnore('football', 'Catarinense 2');
const namesFrom365 = expandCompetitionNamesForIgnore('football', 'Catarinense - Serie B');
console.log('expand(Catarinense 2) =', namesFromFlash);
console.log('expand(Catarinense - Serie B) =', namesFrom365);

assert(
  namesFromFlash.includes('Catarinense - Serie B'),
  'expandCompetitionNamesForIgnore("Catarinense 2") inclui "Catarinense - Serie B"'
);
assert(
  namesFrom365.includes('Catarinense 2'),
  'expandCompetitionNamesForIgnore("Catarinense - Serie B") inclui "Catarinense 2"'
);

assert(
  shouldIgnoreCompetitionByRule('football', 'Brazil', 'flash', 'Catarinense 2') === true,
  'shouldIgnoreCompetitionByRule ignora "Catarinense 2" (flash) em Brazil'
);
assert(
  shouldIgnoreCompetitionByRule('football', 'Brasil', '365', 'Catarinense - Serie B') === true,
  'shouldIgnoreCompetitionByRule ignora "Catarinense - Serie B" (365) em Brasil (scope pt-br)'
);

assert(
  shouldIgnoreCompareIssue('football', 'Brasil', { competicao_365: 'Catarinense - Serie B', competicao_flash: 'Catarinense 2' }) === true,
  'shouldIgnoreCompareIssue ignora payload divergente Catarinense 2 / Catarinense - Serie B'
);

const games365 = [
  { country: 'Brasil', competition: 'Catarinense - Serie B', home: 'Time A', away: 'Time B', time: '20:00', status: 'scheduled' },
];
const gamesFlash = [
  { country: 'Brasil', competition: 'Catarinense 2', home: 'Time A', away: 'Time B', time: '21:00', status: 'scheduled' },
];

const result = compareCountry('Brasil', games365, gamesFlash, 'football');
console.log('compareCountry result:', JSON.stringify(result, null, 2));

assert(
  (result.divergencias_horario || []).length === 0,
  'compareCountry filtra divergencia de horario para Catarinense 2 / Catarinense - Serie B (Brasil)'
);
assert(
  (result.so_no_365 || []).length === 0 && (result.so_no_flash || []).length === 0,
  'compareCountry nao deixa entradas so_no_365/so_no_flash para Catarinense 2 (Brasil)'
);

if (failed) {
  console.error(`\n${failed} assertion(s) failed.`);
  process.exit(1);
}

console.log('\ntest-catarinense-ignore: ok');
