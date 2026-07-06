const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { createRequire } = require('module');
const { isNormalizedCompPrefixMatch } = require('../lib/competition-prefix');

const root = path.join(__dirname, '..');
process.chdir(root);
require('dotenv').config();

const comparePath = path.join(root, 'compare.js');
const rootRequire = createRequire(comparePath);
delete require.cache[comparePath];
const code = fs.readFileSync(comparePath, 'utf8');
const sandbox = {
  module: { exports: {} },
  exports: {},
  require: rootRequire,
  __dirname: root,
  path: require('path'),
  fs,
  process,
  console,
};
vm.runInNewContext(`${code}\nglobalOut = { compSim, normComp };`, sandbox);
const { compSim, normComp } = sandbox.globalOut;

const prefixPairs = [
  ['MLB', 'MLB - Regular Season', true],
  ['MLB', 'MLB Regular Season', true],
  ['NCAA', 'NCAA Basketball', true],
  ['NFL', 'NFL Preseason', true],
  ['Premier League', 'Premier League - England', true],
  ['MLB', 'WNBA', false],
  ['Serie A', 'Serie B', false],
  ['Liga', 'Liga Portugal', true],
];

let failed = 0;

console.log('lib/competition-prefix.js');
for (const [left, right, expected] of prefixPairs) {
  const nLeft = normComp(left, 'baseball_usa');
  const nRight = normComp(right, 'baseball_usa');
  const got = isNormalizedCompPrefixMatch(nLeft, nRight);
  const ok = got === expected;
  if (!ok) failed += 1;
  console.log(`${ok ? 'OK' : 'FAIL'} | ${left} <> ${right} => ${got} (expected ${expected})`);
}

console.log('\ncompare.js compSim');
const compCases = [
  ['MLB', 'MLB - Regular Season', 'baseball_usa', 0.98],
  ['NBA', 'NBA Playoffs', 'basketball_usa', 0.98],
  ['MLB', 'WNBA', 'baseball_usa', null],
];

for (const [c1, c2, sportKey, minScore] of compCases) {
  const score = compSim(c1, c2, sportKey);
  const ok = minScore === null ? score < 0.85 : score >= minScore;
  if (!ok) failed += 1;
  console.log(`${ok ? 'OK' : 'FAIL'} | compSim(${c1}, ${c2}) = ${score.toFixed(3)}`);
}

if (failed) {
  console.error(`\n${failed} assertion(s) failed.`);
  process.exit(1);
}

console.log('\nAll competition prefix tests passed.');
