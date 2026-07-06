const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { createRequire } = require('module');
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
vm.runInNewContext(`${code}\nglobalOut = { teamNameSim, teamSim, compSim, normTeam, resolveContextualNickname, calculateMatchScore };`, sandbox);
const g = sandbox.globalOut;

const pairs = [
  ['Portland Timbers II', 'Portland Timbers 2'],
  ['The Town FC', 'San Jose Earthquakes II'],
  ['United Nordic', 'Nordic United'],
  ['IK Oddevold', 'Oddevold'],
  ['Khan Sheikhoun', 'Khan Shaykhun'],
  ['Al Shola', 'Al-Shouleh'],
  ['Barkchi Gissar', 'Barkchi Hisor'],
  ['FK Vakhsh', 'Vakhsh'],
  ['NJ/NY Gotham FC', 'Gotham W'],
  ['Dingnan United', 'Dingnan Ganlian'],
  ['Awassa Kenema', 'Hawassa'],
  ['Defence Force SC', 'Mechal'],
  ['Kuopion Palloseura II', 'KuPS Akatemia'],
  ['FH Hafnarfjordur', 'Hafnarfjordur'],
  ['IB Vestmannaeyja', 'Vestmannaeyjar'],
  ['Jenis', 'Zhenis'],
  ['Astana', 'FC Astana'],
  ['Tobol Kostanay', 'Tobol'],
  ['Altay Oskemen', 'Altai'],
  ['Gyeongju H&N', 'Gyeongju KHNP'],
  ['Pocheon FC', 'Pocheon'],
  ['Busan Transportation', 'Busan Kyotong'],
  ['Vaasa PS', 'VPS'],
  ['Adama Kenema', 'Adama City'],
  ['CBR Brave', 'Canberra Brave'],
  ['Adelaide', 'Adelaide Adrenaline'],
];

for (const [a, b] of pairs) {
  console.log(`${g.teamNameSim(a, b, 'football').toFixed(3)} | ${a} <> ${b}`);
  console.log(`   ${g.normTeam(a)} | ${g.normTeam(b)}`);
}

const games = [
  { h365: 'Portland Timbers II', a365: 'The Town FC', hF: 'Portland Timbers 2', aF: 'San Jose Earthquakes II', comp365: 'MLS Next Pro', compF: 'MLS Next Pro', time: '23:00' },
  { h365: 'United Nordic', a365: 'IK Oddevold', hF: 'Nordic United', aF: 'Oddevold', comp365: 'Superettan', compF: 'Superettan', time: '16:00' },
  { h365: 'Siheung Citizen', a365: 'Jeonbuk Motors II', hF: 'Siheung Citizen', aF: 'Jeonbuk 2', comp365: 'K League 3', compF: 'K3 League', time: '16:00' },
  { h365: 'Foutoua', a365: 'Khan Sheikhoun', hF: 'Foutoua', aF: 'Khan Shaykhun', comp365: 'Syrian Premier League', compF: 'Premier League', time: '20:00' },
  { h365: 'Adama Kenema', a365: 'Welayta Dicha', hF: 'Adama City', aF: 'Welayta Dicha', comp365: 'Premier League', compF: 'Premier League', time: '16:00' },
  { h365: 'Gnistan', a365: 'Vaasa PS', hF: 'Gnistan', aF: 'VPS', comp365: 'Veikkausliiga', compF: 'Veikkausliiga', time: '19:00' },
  { h365: 'Canberra Brave', a365: 'Adelaide Adrenaline', hF: 'CBR Brave', aF: 'Adelaide', comp365: 'AIHL', compF: 'AIHL', time365: '04:00', timeF: '01:00', sport: 'hockey' },
];

for (const game of games) {
  const score = g.calculateMatchScore(
    { home: game.h365, away: game.a365, competition: game.comp365, time: game.time365 || game.time },
    { home: game.hF, away: game.aF, competition: game.compF, time: game.timeF || game.time },
    game.sport || 'football'
  );
  console.log('MATCH', score ? `${score.score.toFixed(3)} ts=${score.ts.toFixed(3)} cs=${score.cs.toFixed(3)}` : 'NULL', `${game.h365}/${game.a365}`);
}

console.log('comp', g.compSim('K League 3', 'K3 League', 'football').toFixed(3));
