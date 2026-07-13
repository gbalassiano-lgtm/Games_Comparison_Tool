const fs = require('fs');
const path = require('path');
const vm = require('vm');
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
vm.runInNewContext(`${code}\nglobalOut = { load365, loadFlash, groupByScope, compareCountry, shouldIgnoreCompetitionByRule };`, sandbox);
const g = sandbox.globalOut;

const sportKey = 'football';
const file365 = path.join(root, 'output', 'football', '365_tomorrow_by_country.json');
const fileFlash = path.join(root, 'output', 'football', 'flashscore_tomorrow_all_countries.json');

if (!fs.existsSync(file365) || !fs.existsSync(fileFlash)) {
  console.error('Football snapshot files not found — run a football scan first.');
  process.exit(1);
}

const games365 = g.load365(file365, sportKey);
const gamesFlash = g.loadFlash(fileFlash, sportKey);
const by365 = g.groupByScope(games365, sportKey, '365');
const byFlash = g.groupByScope(gamesFlash, sportKey, 'flash');
const allKeys = [...new Set([...Object.keys(by365), ...Object.keys(byFlash)])];

function summarizeResult(result) {
  return {
    matched: result.matched_pairs.length,
    only365: result.so_no_365.length,
    onlyFlash: result.so_no_flash.length,
    timeDiff: result.divergencias_horario.length,
    statusDiff: result.divergencias_status.length,
    nameDiff: result.divergencias_nome.length,
  };
}

function runAllCountries() {
  const totals = {
    matched: 0,
    only365: 0,
    onlyFlash: 0,
    timeDiff: 0,
    statusDiff: 0,
    nameDiff: 0,
    scoreChecks: 0,
  };

  for (const key of allKeys) {
    const countryName = by365[key]?.countryName || byFlash[key]?.countryName?.replace(/[:.]+$/, '').trim() || key;
    // Match production runCompare: ignored comps stay in the matching pool and are
    // only suppressed in post-match so_no_* reporting inside compareCountry.
    const g365 = by365[key]?.games || [];
    const gFlash = byFlash[key]?.games || [];
    if (!g365.length && !gFlash.length) continue;

    const started = process.hrtime.bigint();
    const result = g.compareCountry(countryName, g365, gFlash, sportKey);
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
    totals.scoreChecks += g365.length * gFlash.length;

    const summary = summarizeResult(result);
    for (const metric of Object.keys(summary)) totals[metric] += summary[metric];

    if (g365.length * gFlash.length >= 100 || countryName.toLowerCase().includes('international')) {
      console.log(`${countryName}: ${g365.length}×${gFlash.length} cartesian → ${elapsedMs.toFixed(1)}ms | matched ${summary.matched}`);
    }
  }

  return totals;
}

const started = process.hrtime.bigint();
const totals = runAllCountries();
const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;

console.log('\nbenchmark-compare-index summary');
console.log(JSON.stringify({ elapsedMs: Math.round(elapsedMs), ...totals }, null, 2));
