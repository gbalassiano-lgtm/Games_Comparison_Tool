const { launchBrowser, newPageInScanTimezone, closeBrowserSafe, exitScript } = require('./launch-browser');
const fs = require('fs');
const path = require('path');
const {
  runWithRetry,
  logStep,
  resolveTargetDate,
  scrapeFlashscoreDates,
  optimizePageForScraping: sharedOptimizePage,
  FLASH_TIME_EVAL_HELPERS,
} = require('./flashscore-shared');
const {
  filterFootballFlashMatches,
  assertFootballFlashScrapeQuality,
} = require('../lib/football-flash-filter');

const SPORT = 'football';
const FLASH_SCORE_BASE_URL = 'https://www.flashscore.com/football';
const DEFAULT_OUTPUT_FILE = 'flashscore_tomorrow_all_countries.json';

// ─── Utilities ────────────────────────────────────────────────────────────────

function normalizeWhitespace(text = '') {
  return String(text)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanText(text = '') {
  return normalizeWhitespace(
    String(text)
      .replace(/SRF/gi, ' ')
      .replace(/FRO/gi, ' ')
      .replace(/--+/g, ' ')
      .replace(/Live Bet Icon/gi, ' ')
      .replace(/Preview/gi, ' ')
      .replace(/Table/gi, ' ')
      .replace(/Standings/gi, ' ')
      .replace(/Classification/gi, ' ')
      .replace(/Tabela/gi, ' ')
      .replace(/Classificação/gi, ' ')
  );
}

function isStatusText(text = '') {
  const t = cleanText(text).toLowerCase();
  return [
    'postponed', 'cancelled', 'canceled', 'suspended', 'interrupted',
    'abandoned', 'awarded', 'walkover', 'after penalties', 'after extra time',
    'finished', 'full time', 'half time', 'delayed',
    // Compatibility with older localized pages.
    'adiado', 'cancelado', 'anulado', 'interrompido', 'suspenso', 'abandonado',
  ].includes(t);
}

function isAggregateText(text = '') {
  const t = cleanText(text).toLowerCase();
  return /^agregado\b/.test(t) || /^aggregate\b/.test(t);
}

function isPlaceholderParticipant(text = '') {
  const t = cleanText(text).toLowerCase();
  return !t ||
    t === 'fro' ||
    t === 'srf' ||
    /^\d{1,2}:\d{2}\s*fro$/.test(t) ||
    /^(preview|table|standings|classification|live bet icon|final result|full time result)$/i.test(t);
}

function removeAggregateSegments(text = '') {
  let t = String(text);
  t = t.replace(/agregado\s*\d+\s*-\s*\d+/gi, ' ');
  t = t.replace(/aggregate\s*\d+\s*-\s*\d+/gi, ' ');
  t = t.replace(/agregado/gi, ' ');
  t = t.replace(/aggregate/gi, ' ');
  return cleanText(t);
}

function formatLocalDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}


function getOutputFilePath(outputFileName = DEFAULT_OUTPUT_FILE) {
  const outputDir = path.join(__dirname, '..', 'output', SPORT);
  fs.mkdirSync(outputDir, { recursive: true });
  return path.join(outputDir, outputFileName);
}

async function optimizePageForScraping(page) {
  return sharedOptimizePage(page);
}

// ─── DOM extraction ───────────────────────────────────────────────────────────

async function readAllLeaguesAndMatches(page) {
  return await page.evaluate((helpersSource) => {
    eval(helpersSource);

    function normalizeWhitespace(text = '') {
      return String(text).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function cleanText(text = '') {
      return normalizeWhitespace(
        String(text)
          .replace(/SRF/gi, ' ')
      .replace(/FRO/gi, ' ')
          .replace(/FRO/gi, ' ')
          .replace(/--+/g, ' ')
          .replace(/Live Bet Icon/gi, ' ')
          .replace(/Preview/gi, ' ')
          .replace(/Table/gi, ' ')
          .replace(/Standings/gi, ' ')
          .replace(/Classification/gi, ' ')
          .replace(/Tabela/gi, ' ')
          .replace(/Classificação/gi, ' ')
      );
    }

    function isStatusText(text = '') {
      const t = cleanText(text).toLowerCase();
      return [
        'postponed', 'cancelled', 'canceled', 'suspended', 'interrupted',
        'abandoned', 'awarded', 'walkover', 'after penalties', 'after extra time',
        'finished', 'full time', 'half time', 'delayed',
        'adiado', 'cancelado', 'anulado', 'interrompido', 'suspenso', 'abandonado',
      ].includes(t);
    }

    function isAggregateText(text = '') {
      const t = cleanText(text).toLowerCase();
      return /^agregado\b/.test(t) || /^aggregate\b/.test(t);
    }

    function isPlaceholderParticipant(text = '') {
      const t = cleanText(text).toLowerCase();
      return isScheduleMarker(text) ||
        t === 'fro' ||
        /^\d{1,2}:\d{2}\s*fro$/i.test(t) ||
        /^\d{1,2}:\d{2}\s*srf$/i.test(t) ||
        /^(preview|table|standings|classification|live bet icon|final result|full time result|resultado final|somente o resultado final|tabela|classificação)$/i.test(t);
    }

    function removeAggregateSegments(text = '') {
      let t = String(text);
      t = t.replace(/agregado\s*\d+\s*-\s*\d+/gi, ' ');
      t = t.replace(/aggregate\s*\d+\s*-\s*\d+/gi, ' ');
      t = t.replace(/agregado/gi, ' ');
      t = t.replace(/aggregate/gi, ' ');
      return cleanText(t);
    }

    function extractStatus(matchNode, rawClean) {
      const directTexts = Array.from(matchNode.querySelectorAll('div, span, a'))
        .map(el => cleanText(el.textContent || ''))
        .filter(Boolean);

      for (const txt of directTexts) {
        if (isStatusText(txt)) return txt;
      }

      const parts = rawClean.split(/\s+/).filter(Boolean);
      for (const part of parts) {
        if (isStatusText(part)) return part;
      }

      return '';
    }

    function extractTime(matchNode, rawClean) {
      return extractMatchTime(matchNode, rawClean);
    }

    function getTextCandidates(matchNode, time, status) {
      const candidates = [];
      const nodes = Array.from(matchNode.querySelectorAll('div, span, a'));

      for (const el of nodes) {
        let txt = cleanText(el.textContent || '');
        txt = removeAggregateSegments(txt);

        if (!txt) continue;
        if (isScheduleMarker(txt)) continue;
        if (isPlaceholderParticipant(txt)) continue;
        if (txt === time) continue;
        if (txt === status) continue;
        if (isStatusText(txt)) continue;
        if (isAggregateText(txt)) continue;
        if (/^\d{1,2}:\d{2}$/.test(txt)) continue;
        if (/^\d+$/.test(txt)) continue;
        if (/^(preview|table|standings|classification|live bet icon|final result|full time result|resultado final|somente o resultado final|tabela|classificação)$/i.test(txt)) continue;

        candidates.push(txt);
      }

      const unique = [];
      const seen = new Set();
      for (const item of candidates) {
        if (!seen.has(item)) { seen.add(item); unique.push(item); }
      }

      return unique;
    }

    function extractParticipants(matchNode, rawClean, time, status) {
      const directParticipants = Array.from(
        matchNode.querySelectorAll('.event__participant')
      )
        .map(el => removeAggregateSegments(el.textContent || ''))
        .filter(Boolean)
        .filter(t => !isPlaceholderParticipant(t))
        .filter(t => t !== status)
        .filter(t => !isStatusText(t))
        .filter(t => !isAggregateText(t));

      if (directParticipants.length >= 2) {
        return { home: directParticipants[0], away: directParticipants[1] };
      }

      const textCandidates = getTextCandidates(matchNode, time, status);
      if (textCandidates.length >= 2) {
        return { home: textCandidates[0], away: textCandidates[1] };
      }

      let fallback = removeAggregateSegments(rawClean);
      if (time) fallback = fallback.replace(time, ' ');
      if (status) fallback = fallback.replace(new RegExp(status, 'ig'), ' ');
      fallback = cleanText(fallback);

      const parts = fallback
        .split(/\s{2,}|\n+/)
        .map(t => removeAggregateSegments(t))
        .filter(Boolean)
        .filter(t => !isPlaceholderParticipant(t))
        .filter(t => !/^\d{1,2}:\d{2}$/.test(t))
        .filter(t => !isStatusText(t))
        .filter(t => !isAggregateText(t));

      if (parts.length >= 2) {
        return { home: parts[0], away: parts[1] };
      }

      return { home: '', away: '' };
    }

    function normalizeStatus(status = '') {
      if (!status) return 'scheduled';
      return status
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
    }

    function matchSportFromNode(matchNode) {
      const links = Array.from(matchNode.querySelectorAll('a[href*="/match/"]'));
      for (const link of links) {
        const href = link.getAttribute('href') || '';
        const sportMatch = href.match(/\/match\/([^/?#]+)/i);
        if (sportMatch?.[1]) return sportMatch[1].toLowerCase();
      }
      return '';
    }

    function isNonFootballSportSlug(slug = '') {
      const value = String(slug || '').toLowerCase();
      if (!value) return false;
      if (value === 'football' || value === 'soccer') return false;
      return [
        'snooker', 'darts', 'tennis', 'basketball', 'hockey', 'volleyball', 'baseball',
        'american-football', 'handball', 'rugby-union', 'rugby-league', 'cricket',
        'badminton', 'table-tennis', 'beach-volleyball', 'futsal', 'esports', 'mma',
        'boxing', 'motorsport', 'cycling', 'golf',
      ].includes(value);
    }

    function looksLikeIndividualParticipant(name = '') {
      const value = String(name || '').trim();
      if (!value) return false;
      if (/\//.test(value)) return true;
      if (/^[A-Za-zÀ-ÿ][\wÀ-ÿ.'-]*\s+[A-Z]\.$/.test(value)) return true;
      return false;
    }

    function competitionLooksNonFootball(competition = '') {
      const text = cleanText(competition).toLowerCase();
      if (!text) return false;
      return /\bchampionship league\b/.test(text) ||
        /\bworld snooker\b/.test(text) ||
        /\bworld darts\b/.test(text) ||
        /\bpremier league darts\b/.test(text);
    }

    const nodes = Array.from(
      document.querySelectorAll('div.headerLeague__wrapper, div.event__match')
    );

    let currentCountry = '';
    let currentCompetition = '';
    const rows = [];

    for (const node of nodes) {
      if (node.matches('div.headerLeague__wrapper')) {
        currentCountry = cleanText(
          (node.querySelector('.headerLeague__category')?.textContent || '').replace(/:$/, '')
        );
        currentCompetition = cleanText(
          node.querySelector('.headerLeague__title')?.textContent || ''
        );
        continue;
      }

      if (node.matches('div.event__match')) {
        const raw = removeAggregateSegments(node.textContent || '');
        const status = extractStatus(node, raw);
        const time = extractTime(node, raw);
        const { home, away } = extractParticipants(node, raw, time, status);
        const sportSlug = matchSportFromNode(node);
        const startTime =
          node.getAttribute('data-starttime') ||
          node.querySelector('[data-starttime]')?.getAttribute('data-starttime') ||
          null;

        if (
          isNonFootballSportSlug(sportSlug) ||
          (competitionLooksNonFootball(currentCompetition) &&
            looksLikeIndividualParticipant(home) &&
            looksLikeIndividualParticipant(away))
        ) {
          continue;
        }

        if (currentCompetition && home && away && !isPlaceholderParticipant(home) && !isPlaceholderParticipant(away)) {
          rows.push({
            country: currentCountry,
            competition: currentCompetition,
            home: cleanText(home),
            time: cleanText(time) || null,
            away: cleanText(away),
            status: normalizeStatus(status),
            sport: sportSlug || 'football',
            startTime,
          });
        }
      }
    }

    const unique = [];
    const seen = new Set();
    for (const row of rows) {
      const key = `${row.country}__${row.competition}__${row.time}__${row.status}__${row.home}__${row.away}`;
      if (!seen.has(key)) { seen.add(key); unique.push(row); }
    }

    return unique;
  }, FLASH_TIME_EVAL_HELPERS);
}

// Formats games into the exact nested schema expected by downstream compare code.
function formatFlashscoreToNestedJson(flatGames) {
  const countries = new Map();

  for (const game of flatGames) {
    let countryEntry = countries.get(game.country);
    if (!countryEntry) {
      countryEntry = { country: game.country, competitions: new Map() };
      countries.set(game.country, countryEntry);
    }

    let compEntry = countryEntry.competitions.get(game.competition);
    if (!compEntry) {
      compEntry = { name: game.competition, matches: [] };
      countryEntry.competitions.set(game.competition, compEntry);
    }

    compEntry.matches.push({
      home: game.home,
      away: game.away,
      time: game.time,
      status: game.status,
    });
  }

  return Array.from(countries.values())
    .map(entry => ({
      country: entry.country,
      competitions: Array.from(entry.competitions.values()),
    }))
    .sort((a, b) => a.country.localeCompare(b.country));
}

async function scrapeFlashscoreFootballOnce(options = {}) {
  const targetDate = resolveTargetDate(options.targetDate || process.argv[2]);
  const outputFile = options.outputFile || getOutputFilePath();

  logStep(`\nStarting Flashscore scraper (${SPORT}) for ${targetDate}...`);
  const browser = await launchBrowser();
  const page = await newPageInScanTimezone(browser, { viewport: { width: 1440, height: 2200 } });

  try {
    await optimizePageForScraping(page);

    const rawResults = await scrapeFlashscoreDates(
      page,
      targetDate,
      SPORT,
      { url: `${FLASH_SCORE_BASE_URL}/`, sportSlug: SPORT },
      readAllLeaguesAndMatches
    );

    const filteredResults = filterFootballFlashMatches(rawResults);
    assertFootballFlashScrapeQuality(rawResults.length, filteredResults);

    if (filteredResults.length === 0) {
      logStep(
        `WARN: No football matches found for ${targetDate}. ` +
        'Flashscore may not list fixtures this far ahead, or the day has no scheduled games.'
      );
    } else if (filteredResults.length < rawResults.length) {
      logStep(`Filtered ${rawResults.length - filteredResults.length} non-football matches from Flashscore output.`);
    }

    logStep('Formatando JSON...');
    const nestedResults = formatFlashscoreToNestedJson(filteredResults);

    logStep('Salvando arquivo JSON...');
    fs.writeFileSync(outputFile, JSON.stringify(nestedResults, null, 2), 'utf-8');

    logStep('Done. Extraction summary:');
    logStep(`   - Target date: ${targetDate}`);
    logStep(`   - Total matches: ${filteredResults.length}`);
    logStep(`   - Total countries: ${nestedResults.length}`);
    logStep(`Saved successfully to: ${outputFile}`);

    return nestedResults;

  } catch (error) {
    logStep(`ERROR: ${error.message}`);
    throw error;
  } finally {
    await closeBrowserSafe(browser, { label: SPORT });
  }
}

async function scrapeFlashscoreFootball(options = {}) {
  return runWithRetry(
    () => scrapeFlashscoreFootballOnce(options),
    'Flashscore football scraper',
    options
  );
}

if (require.main === module) {
  scrapeFlashscoreFootball()
    .then(() => {
      logStep('Scraper finished.');
      exitScript(0);
    })
    .catch(() => exitScript(1));
}

module.exports = {
  scrapeFlashscoreFootball,
  formatFlashscoreToNestedJson,
  readAllLeaguesAndMatches,
};