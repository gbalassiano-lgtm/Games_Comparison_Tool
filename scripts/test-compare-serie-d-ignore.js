const assert = require('assert');
const fs = require('fs');
const path = require('path');

process.env.TARGET_DATE = '2026-06-29';
process.env.SCAN_DATE = '2026-06-29';
process.env.SCAN_TIMEZONE = 'America/Sao_Paulo';
process.env.UI_SCAN_MODE = '1';

delete require.cache[require.resolve('../lib/scan-timezone')];
delete require.cache[require.resolve('../compare.js')];

const { runCompare } = require('../compare.js');

(async () => {
  const results = await runCompare('football', null, { skipTelegram: true, skipXlsx: true });
  const brazil = results.find(entry => entry.country === 'Brazil');
  assert.ok(brazil, 'Brazil result missing');

  const democrataMissing = (brazil.result.so_no_365 || []).some(row =>
    row.home === 'Democrata GV' && row.away === 'Ivinhema'
  );
  assert.strictEqual(democrataMissing, false, 'Democrata GV should match, not stay only on 365');

  const democrataMatched = (brazil.result.matched_pairs || []).some(row =>
    row.home365 === 'Democrata GV' && row.away365 === 'Ivinhema'
  );
  assert.strictEqual(democrataMatched, true, 'Democrata GV should appear in matched_pairs');

  console.log('test-compare-serie-d-ignore: ok');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
