const path = require('path');
process.chdir(path.join(__dirname, '..'));

const {
  expandCompetitionNamesForScope,
  decorateRulesWithAliases,
  weeklyRowIsIgnored,
  listRules,
} = require('../server.js');

let failed = 0;

function assert(condition, message) {
  if (!condition) {
    failed += 1;
    console.error(`FAIL | ${message}`);
  } else {
    console.log(`OK   | ${message}`);
  }
}

const expanded = expandCompetitionNamesForScope('football', 'Catarinense 2');
console.log('expandCompetitionNamesForScope(Catarinense 2) =', expanded);
assert(expanded.includes('Catarinense - Serie B'), 'server expandCompetitionNamesForScope liga Catarinense 2 <-> Catarinense - Serie B');

const decorated = decorateRulesWithAliases(listRules());
const catarinenseRule = (decorated.football?.ignoreFlashOnly || []).find(r => r.competition === 'Catarinense 2');
console.log('decorated Catarinense 2 rule =', catarinenseRule);
assert(!!catarinenseRule, 'regra ignoreFlashOnly "Catarinense 2" existe em football');
assert(
  Array.isArray(catarinenseRule?.aliases) && catarinenseRule.aliases.includes('Catarinense - Serie B'),
  'regra decorada inclui alias "Catarinense - Serie B"'
);

const rawRules = listRules();
const rawCatarinenseRule = (rawRules.football?.ignoreFlashOnly || []).find(r => r.competition === 'Catarinense 2');
assert(!rawCatarinenseRule?.aliases, 'listRules() (persistido) NÃO ganha campo aliases (nao contamina competition_rules.json)');

const weeklyRow365Only = {
  country: 'Brasil',
  competition365: 'Catarinense - Serie B',
  type: 'only365',
};
assert(
  weeklyRowIsIgnored(weeklyRow365Only, 'football') === true,
  'weeklyRowIsIgnored ignora linha only365 "Catarinense - Serie B" (Brasil) via alias da regra Flash'
);

const weeklyRowUnrelated = {
  country: 'Brasil',
  competition365: 'Paulista Serie B',
  type: 'only365',
};
assert(
  weeklyRowIsIgnored(weeklyRowUnrelated, 'football') === false,
  'weeklyRowIsIgnored NAO ignora competicao nao relacionada'
);

if (failed) {
  console.error(`\n${failed} assertion(s) failed.`);
  process.exit(1);
}

console.log('\ntest-catarinense-ignore-server: ok');
