process.env.TARGET_DATE = '2026-06-29';
process.env.SCAN_DATE = '2026-06-29';

delete require.cache[require.resolve('../compare.js')];
const compare = require('../compare.js');

// Access internal helpers via a minimal compareCountry simulation
const fs = require('fs');
const path = require('path');

// Load compare module internals by requiring and running runCompare is heavy.
// Instead duplicate the key check using exported runCompare on real files.
(async () => {
  process.env.UI_SCAN_MODE = '1';
  delete require.cache[require.resolve('../lib/scan-timezone')];
  delete require.cache[require.resolve('../compare.js')];
  const { runCompare } = require('../compare.js');
  const results = await runCompare('football', null, { skipTelegram: true, skipXlsx: true });
  const peru = results.find(r => r.country === 'Peru');
  const melgarMissing = (peru?.result?.so_no_365 || []).some(g => g.home === 'FBC Melgar');
  const melgarMatched = (peru?.result?.matched_pairs || []).some(g => g.home365 === 'FBC Melgar');
  console.log(JSON.stringify({ melgarMissing, melgarMatched, peru: peru?.result }, null, 2));
})();
