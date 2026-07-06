const assert = require('assert');

process.env.TARGET_DATE = '2026-06-29';
process.env.SCAN_DATE = '2026-06-29';
process.env.SCAN_TIMEZONE = 'America/Sao_Paulo';
process.env.UI_SCAN_MODE = '1';

delete require.cache[require.resolve('../lib/scan-timezone')];
delete require.cache[require.resolve('../compare.js')];

const { runCompare } = require('../compare.js');

function normalizeRuleScope(value = '') {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return ['', '*', 'all', 'world', 'mundo', 'international', 'internacional', 'global'].includes(normalized)
    ? 'international'
    : normalized;
}

function normalizeRuleCompetition(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function rowIgnoredByRule(row, sportRules = {}) {
  const rules = sportRules.ignoreFlashOnly || [];
  const rowScope = normalizeRuleScope(row.country || '');
  const rowCompetition = row.competitionFlash || row.competition || '';
  return rules.some(rule => {
    const ruleScope = normalizeRuleScope(rule.scope || '');
    const scopeMatches = ruleScope === '*' || ruleScope === rowScope;
    const ruleComp = normalizeRuleCompetition(rule.competition || '');
    const rowComp = normalizeRuleCompetition(rowCompetition);
    return scopeMatches && (ruleComp === '*' || ruleComp === rowComp || rowComp.startsWith(`${ruleComp} `));
  });
}

function filterReportRowsLikeUi(rows, sportRules) {
  return (rows || []).filter(row => !rowIgnoredByRule(row, sportRules));
}

(async () => {
  const results = await runCompare('football', null, { skipTelegram: true, skipXlsx: true });
  const clubFriendlyOnlyFlash = results.flatMap(entry =>
    (entry.result?.so_no_flash || [])
      .filter(row => String(row.competicao || '').toLowerCase().includes('club friendly'))
      .map(row => ({ ...row, country: entry.country }))
  );
  assert.ok(clubFriendlyOnlyFlash.length >= 1, 'Club Friendly games should remain in compare so_no_flash');

  const sportRules = require('../config/competition_rules.json').football;
  const reportRows = clubFriendlyOnlyFlash.map(game => ({
    type: 'onlyFlash',
    country: game.country || 'International',
    competitionFlash: game.competicao,
    competition: game.competicao,
    homeFlash: game.home,
    awayFlash: game.away,
  }));

  const visible = filterReportRowsLikeUi(reportRows, sportRules);
  assert.strictEqual(
    visible.length,
    reportRows.length,
    'Club Friendly onlyFlash rows must not be hidden by ignoreFlashOnly anymore'
  );

  const { isCompetitionTermFixSuppressed } = require('../compare.js');
  const sampleCountry = clubFriendlyOnlyFlash[0]?.country || 'International';
  assert.strictEqual(
    isCompetitionTermFixSuppressed('football', sampleCountry, 'Club Friendly', 'flash', {
      so_no_flash: clubFriendlyOnlyFlash,
      matched_pairs: [],
    }),
    false,
    'Club Friendly should not be suppressed from Term Fix unless it matched in this scan'
  );

  console.log('test-club-friendly-missing365-report: ok');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
