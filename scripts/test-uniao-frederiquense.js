const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { createRequire } = require('module');

const root = path.join(__dirname, '..');
process.chdir(root);
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
vm.runInNewContext(
  `${code}\nglobalOut = { teamNameSim, resolveContextualNickname, calculateMatchScore };`,
  sandbox
);
const g = sandbox.globalOut;

assert.strictEqual(
  g.resolveContextualNickname('Uniao', 'football', 'Gaucho A2'),
  'uniao frederiquense'
);
assert.strictEqual(
  g.resolveContextualNickname('Frederiquense', 'football', 'Gaucho 2'),
  'uniao frederiquense'
);
assert.strictEqual(
  g.resolveContextualNickname('União Frederiquense', 'football', 'Gaucho A2'),
  'uniao frederiquense'
);

// Outside Gaucho A2, short names must not collapse together.
assert.notStrictEqual(
  g.resolveContextualNickname('Uniao', 'football', 'Serie D'),
  g.resolveContextualNickname('Frederiquense', 'football', 'Serie D')
);
assert.ok(g.teamNameSim('Uniao', 'Frederiquense', 'football', 'Gaucho A2', 'Gaucho 2') >= 0.99);
assert.ok(g.teamNameSim('Uniao', 'Frederiquense', 'football', 'Serie D', 'Serie D') < 0.8);

const score = g.calculateMatchScore(
  { home: 'Uniao', away: 'Gramadense', competition: 'Gaucho A2', time: '15:00' },
  { home: 'Frederiquense', away: 'Gramadense', competition: 'Gaucho 2', time: '15:00' },
  'football'
);
assert.ok(score && score.score >= 0.85, `expected match, got ${JSON.stringify(score)}`);

console.log('test-uniao-frederiquense: ok');
