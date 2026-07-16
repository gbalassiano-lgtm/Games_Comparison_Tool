/**
 * Rebuild the dedicated tennis history entry for 2026-07-16 with current matcher logic.
 * Requires scrapes in output/tennis/_rebuild_2026-07-16/{365.json,flash.json}
 * or regenerates 365 from API and expects flash.json already present.
 *
 * Usage:
 *   $env:TARGET_DATE='2026-07-16'; node scrapers/flashscore-tennis.js 2026-07-16
 *   Copy flash output into _rebuild folder, then:
 *   node scripts/rebuild-tennis-history-uts.js
 */
const fs = require('fs');
const path = require('path');

process.env.TARGET_DATE = process.env.TARGET_DATE || '2026-07-16';
process.env.SCAN_DATE = process.env.SCAN_DATE || process.env.TARGET_DATE;

const {
  fetch365ScoresGames,
  apiFetchWindow,
  parseGames,
  dedupe365Rows,
} = require('../scrapers/365-api');
const { runCompare } = require('../compare');

const ROOT = path.join(__dirname, '..');
const HISTORY_FILE = path.join(ROOT, 'db', 'scan_history.json');
const TARGET_DATE = process.env.TARGET_DATE;
const SCAN_ID = Number(process.env.TENNIS_HISTORY_SCAN_ID || 1784138542065);
const REBUILD_DIR = path.join(ROOT, 'output', 'tennis', `_rebuild_${TARGET_DATE}`);
const PARSE_NOW = new Date(`${TARGET_DATE}T12:00:00-03:00`);

function groupTennisRows(rows) {
  const by = new Map();
  for (const row of rows) {
    const tour = row.groupName || 'Tennis';
    const key = String(tour).toLowerCase();
    if (!by.has(key)) by.set(key, { tour, totalFound: 0, competitions: new Map() });
    const group = by.get(key);
    group.totalFound += 1;
    const compKey = String(row.competition || '').toLowerCase();
    if (!group.competitions.has(compKey)) {
      group.competitions.set(compKey, { name: row.competition, matches: [] });
    }
    group.competitions.get(compKey).matches.push({
      home: row.home,
      away: row.away,
      time: row.time,
      status: row.status,
      dateKey: row.dateKey,
      competition: row.displayCompetition,
      stageName: row.stageName || '',
      gameId: row.gameId || '',
    });
  }

  return [...by.values()].map(group => ({
    tour: group.tour,
    count: group.totalFound,
    totalFound: group.totalFound,
    competitions: [...group.competitions.values()],
  }));
}

function compactGame(country, type, game, extra = {}) {
  return {
    country,
    type,
    competition: game.competicao || game.competition || game.competicao_365 || game.competicao_flash || '',
    competition365: game.competicao_365 || game.competition365 || '',
    competitionFlash: game.competicao_flash || game.competitionFlash || '',
    home: game.home || game.home_365 || game.home365 || '',
    away: game.away || game.away_365 || game.away365 || '',
    home365: game.home_365 || game.home365 || '',
    away365: game.away_365 || game.away365 || '',
    homeFlash: game.home_flash || game.homeFlash || '',
    awayFlash: game.away_flash || game.awayFlash || '',
    time: game.horario || game.time || game.horario_365 || game.time365 || '',
    status: game.status || game.status_365 || game.status365 || '',
    sport: 'tennis',
    sportLabel: 'Tennis',
    ...extra,
  };
}

function buildDetails(allResults) {
  const problematic = [];
  const matched = [];

  for (const { country, result } of allResults) {
    for (const game of result?.so_no_365 || []) {
      problematic.push(compactGame(country, 'only365', game, {
        competition365: game.competicao || '',
        home365: game.home || '',
        away365: game.away || '',
        badge: 'Missing on Flashscore',
        severity: 'warning',
      }));
    }
    for (const game of result?.so_no_flash || []) {
      problematic.push(compactGame(country, 'onlyFlash', game, {
        competitionFlash: game.competicao || '',
        homeFlash: game.home || '',
        awayFlash: game.away || '',
        badge: 'Missing on 365Scores',
        severity: 'warning',
      }));
    }
    for (const game of result?.divergencias_horario || []) {
      problematic.push(compactGame(country, 'timeDiff', game, {
        competition: game.competicao_365 || game.competicao_flash || '',
        competition365: game.competicao_365 || '',
        competitionFlash: game.competicao_flash || '',
        home365: game.home_365 || game.home || '',
        away365: game.away_365 || game.away || '',
        homeFlash: game.home_flash || '',
        awayFlash: game.away_flash || '',
        time365: game.horario_365 || '',
        timeFlash: game.horario_flash || '',
        badge: `365Scores: ${game.horario_365 || '-'} | Flashscore: ${game.horario_flash || '-'}`,
        severity: 'danger',
      }));
    }
    for (const game of result?.divergencias_status || []) {
      problematic.push(compactGame(country, 'statusDiff', game, {
        competition: game.competicao_365 || game.competicao_flash || '',
        competition365: game.competicao_365 || '',
        competitionFlash: game.competicao_flash || '',
        home365: game.home_365 || game.home || '',
        away365: game.away_365 || game.away || '',
        homeFlash: game.home_flash || '',
        awayFlash: game.away_flash || '',
        status365: game.status_365 || '',
        statusFlash: game.status_flash || '',
        badge: 'Status mismatch',
        severity: 'warning',
      }));
    }
    for (const pair of result?.matched_pairs || []) {
      matched.push(compactGame(country, 'matched', {
        competition: pair.competition365 || pair.competitionFlash,
        home: pair.home365,
        away: pair.away365,
      }, {
        competition365: pair.competition365 || '',
        competitionFlash: pair.competitionFlash || '',
        home365: pair.home365 || '',
        away365: pair.away365 || '',
        homeFlash: pair.homeFlash || '',
        awayFlash: pair.awayFlash || '',
        time365: pair.time365 || '',
        timeFlash: pair.timeFlash || '',
        status365: pair.status365 || '',
        statusFlash: pair.statusFlash || '',
        badge: 'Synced',
        severity: 'ok',
      }));
    }
  }

  return { problematic, matched };
}

async function main() {
  fs.mkdirSync(REBUILD_DIR, { recursive: true });
  const flashPath = path.join(REBUILD_DIR, 'flash.json');
  if (!fs.existsSync(flashPath)) {
    throw new Error(`Missing ${flashPath}. Scrape Flash for ${TARGET_DATE} first.`);
  }

  const { startDate, endDate } = apiFetchWindow(TARGET_DATE);
  const json = await fetch365ScoresGames(3, startDate, endDate);
  const rows = dedupe365Rows(
    parseGames(json, { sportKey: 'tennis', targetDate: TARGET_DATE, now: PARSE_NOW }),
    TARGET_DATE
  );
  const file365 = path.join(REBUILD_DIR, '365.json');
  fs.writeFileSync(file365, JSON.stringify(groupTennisRows(rows), null, 2));

  const allResults = await runCompare('tennis', {
    label: 'Tenis',
    file365,
    fileFlash: flashPath,
    xlsxOut: path.join(REBUILD_DIR, 'out.xlsx'),
  }, { skipTelegram: true, skipXlsx: true });

  const details = buildDetails(allResults);
  const flashCount = JSON.parse(fs.readFileSync(flashPath, 'utf8')).length;
  const summary = {
    total365: rows.length,
    totalFlash: flashCount,
    matched: details.matched.length,
    only365: details.problematic.filter(row => row.type === 'only365').length,
    onlyFlash: details.problematic.filter(row => row.type === 'onlyFlash').length,
    timeDiff: details.problematic.filter(row => row.type === 'timeDiff').length,
    statusDiff: details.problematic.filter(row => row.type === 'statusDiff').length,
    nameDiff: allResults.reduce((sum, row) => sum + (row.result?.divergencias_nome || []).length, 0),
  };

  const utsMatched = details.matched.filter(row => /uts/i.test(row.competition || ''));
  const utsOnlyFlash = details.problematic.filter(row =>
    row.type === 'onlyFlash' && /uts/i.test(row.competition || '')
  );
  if (utsMatched.length < 4) throw new Error(`Expected >=4 UTS matches, got ${utsMatched.length}`);
  if (utsOnlyFlash.length) throw new Error(`UTS onlyFlash still present: ${utsOnlyFlash.length}`);

  const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  const index = history.findIndex(item => Number(item.id) === SCAN_ID);
  if (index < 0) throw new Error(`Scan ${SCAN_ID} not found`);

  const previous = history[index];
  history[index] = {
    ...previous,
    finalizedAt: new Date().toISOString(),
    result: {
      ...previous.result,
      summary,
      details,
      countries: allResults.map(row => ({ country: row.country, result: row.result })),
    },
  };
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history));
  console.log(`Updated scan ${SCAN_ID}: UTS matched=${utsMatched.length}, onlyFlash UTS=${utsOnlyFlash.length}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
