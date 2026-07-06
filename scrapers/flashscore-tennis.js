const { launchBrowser, newPageInScanTimezone, closeBrowserSafe, exitScript } = require('./launch-browser');
const fs = require('fs');
const path = require('path');
const {
  cleanText,
  resolveTargetDate,
  runFlashscorePipeline,
  logStep,
  optimizePageForScraping,
  extractMatchesFromPage,
  runWithRetry,
  FLASH_TIME_EVAL_HELPERS,
} = require('./flashscore-shared');

// ─── Utils ────────────────────────────────────────────────────────────────────

function isStatusText(text = '') {
  const t = cleanText(text).toLowerCase();
  return [
    'adiado', 'cancelado', 'anulado', 'interrompido', 'suspenso',
    'abandonado', 'postponed', 'cancelled', 'canceled',
    'suspended', 'interrupted', 'awarded', 'walkover',
    'w/o',
  ].includes(t);
}

function isAggregateText(text = '') {
  const t = cleanText(text).toLowerCase();
  return /^agregado\b/.test(t) || /^aggregate\b/.test(t);
}

function removeAggregateSegments(text = '') {
  let t = String(text);
  t = t.replace(/agregado\s*\d+\s*-\s*\d+/gi, ' ');
  t = t.replace(/aggregate\s*\d+\s*-\s*\d+/gi, ' ');
  t = t.replace(/agregado/gi, ' ');
  t = t.replace(/aggregate/gi, ' ');
  return cleanText(t);
}

function isDoublesCompetition(country = '', competition = '') {
  const text = cleanText(`${country} ${competition}`).toLowerCase();
  return text.includes('duplas') || text.includes('doubles');
}

function cleanPlayerName(text = '') {
  return cleanText(text)
    .replace(/\s+/g, ' ')
    .replace(/^\-+|\-+$/g, '')
    .trim();
}

function buildTennisSides(playerNames, country = '', competition = '') {
  const names = (playerNames || []).map(cleanPlayerName).filter(Boolean);
  const doubles = isDoublesCompetition(country, competition);

  if (doubles) {
    if (names.length >= 4) {
      return {
        home: `${names[0]} / ${names[1]}`,
        away: `${names[2]} / ${names[3]}`,
      };
    }

    if (names.length === 2) {
      return {
        home: names[0],
        away: names[1],
      };
    }

    return { home: '', away: '' };
  }

  if (names.length >= 2) {
    return {
      home: names[0],
      away: names[1],
    };
  }

  return { home: '', away: '' };
}

// ─── Lê ligas e jogos ─────────────────────────────────────────────────────────

async function readAllLeaguesAndMatches(page) {
  return await page.evaluate((helpersSource) => {
    eval(helpersSource);

    function norm(text = '') {
      return String(text).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function cleanText(text = '') {
      return norm(
        String(text)
          .replace(/SRF/gi, ' ')
          .replace(/FRO/gi, ' ')
          .replace(/--+/g, ' ')
          .replace(/Live Bet Icon/gi, ' ')
          .replace(/Preview/gi, ' ')
          .replace(/Tabela/gi, ' ')
          .replace(/Classificação/gi, ' ')
      );
    }

    function isStatusText(text = '') {
      const t = cleanText(text).toLowerCase();
      return [
        'adiado', 'cancelado', 'anulado', 'interrompido', 'suspenso',
        'abandonado', 'postponed', 'cancelled', 'canceled',
        'suspended', 'interrupted', 'awarded', 'walkover', 'w/o',
      ].includes(t);
    }

    function isAggregateText(text = '') {
      const t = cleanText(text).toLowerCase();
      return /^agregado\b/.test(t) || /^aggregate\b/.test(t);
    }

    function removeAggregateSegments(text = '') {
      let t = String(text);
      t = t.replace(/agregado\s*\d+\s*-\s*\d+/gi, ' ');
      t = t.replace(/aggregate\s*\d+\s*-\s*\d+/gi, ' ');
      t = t.replace(/agregado/gi, ' ');
      t = t.replace(/aggregate/gi, ' ');
      return cleanText(t);
    }

    function cleanPlayerName(text = '') {
      return cleanText(text)
        .replace(/\s+/g, ' ')
        .replace(/^\-+|\-+$/g, '')
        .trim();
    }

    function isDoublesCompetition(country = '', competition = '') {
      const text = cleanText(`${country} ${competition}`).toLowerCase();
      return text.includes('duplas') || text.includes('doubles');
    }

    function buildTennisSides(playerNames, country = '', competition = '') {
      const names = (playerNames || []).map(cleanPlayerName).filter(Boolean);
      const doubles = isDoublesCompetition(country, competition);

      if (doubles) {
        if (names.length >= 4) {
          return {
            home: `${names[0]} / ${names[1]}`,
            away: `${names[2]} / ${names[3]}`,
          };
        }

        if (names.length === 2) {
          return {
            home: names[0],
            away: names[1],
          };
        }

        return { home: '', away: '' };
      }

      if (names.length >= 2) {
        return {
          home: names[0],
          away: names[1],
        };
      }

      return { home: '', away: '' };
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
      const participants = Array.from(matchNode.querySelectorAll('.event__participant, .event__participantName'))
        .map(el => cleanText(el.innerText || el.textContent || ''))
        .map(removeAggregateSegments)
        .map(cleanPlayerName)
        .filter(Boolean);
      if (participants.length >= 2) return participants;

      const home = cleanPlayerName(matchNode.querySelector('.event__homeParticipant')?.innerText || '');
      const away = cleanPlayerName(matchNode.querySelector('.event__awayParticipant')?.innerText || '');
      if (home && away) return [home, away];

      return [];
    }

    function extractParticipantNames(matchNode, rawClean, time, status) {
      const directParticipants = Array.from(
        matchNode.querySelectorAll('.event__participant')
      )
        .map(el => removeAggregateSegments(el.innerText || el.textContent || ''))
        .map(cleanPlayerName)
        .filter(Boolean)
        .filter(t => t !== 'SRF')
        .filter(t => t !== status)
        .filter(t => !isStatusText(t))
        .filter(t => !isAggregateText(t))
        .filter(t => !/^\d+-\d+$/.test(t));

      if (directParticipants.length >= 2) {
        return directParticipants;
      }

      const textCandidates = getTextCandidates(matchNode, time, status)
        .map(cleanPlayerName)
        .filter(Boolean)
        .filter(t => !/^\d+-\d+$/.test(t));

      if (textCandidates.length >= 2) {
        return textCandidates;
      }

      let fallback = removeAggregateSegments(rawClean);
      if (time) fallback = fallback.replace(time, ' ');
      if (status) fallback = fallback.replace(new RegExp(status, 'ig'), ' ');
      fallback = cleanText(fallback);

      const parts = fallback
        .split(/\s{2,}|\n+/)
        .map(t => removeAggregateSegments(t))
        .map(cleanPlayerName)
        .filter(Boolean)
        .filter(t => !/^\d{1,2}:\d{2}$/.test(t))
        .filter(t => !isStatusText(t))
        .filter(t => !isAggregateText(t))
        .filter(t => !/^\d+-\d+$/.test(t));

      if (parts.length >= 2) {
        return parts;
      }

      return [];
    }

    function normalizeStatus(status = '') {
      if (!status) return 'scheduled';
      return status
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
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
        const raw = removeAggregateSegments(node.innerText || node.textContent || '');
        const status = extractStatus(node, raw);
        const time = extractTime(node, raw);

        const participantNames = extractParticipantNames(node, raw, time, status);
        const { home, away } = buildTennisSides(
          participantNames,
          currentCountry,
          currentCompetition
        );

        if (currentCompetition && (home || away || time || status)) {
          rows.push({
            country: currentCountry,
            competition: currentCompetition,
            home: cleanText(home),
            time: cleanText(time) || null,
            away: cleanText(away),
            status: normalizeStatus(status),
          });
        }
      }
    }

    const unique = [];
    const seen = new Set();

    for (const row of rows) {
      const key = `${row.country}__${row.competition}__${row.time}__${row.status}__${row.home}__${row.away}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(row);
      }
    }

    return unique;
  }, FLASH_TIME_EVAL_HELPERS);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function scrapeFlashscoreTennisOnce(options = {}) {
  const SPORT = 'tennis';
  const targetDate = resolveTargetDate(options.targetDate || process.argv[2]);
  const outputDir = path.join(__dirname, '..', 'output', options.outputDir || SPORT);
  const outputFile = options.outputFile || path.join(outputDir, 'flashscore_tomorrow_tennis_all_countries.json');
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await launchBrowser();
  const page = await newPageInScanTimezone(browser, { viewport: { width: 1440, height: 2200 } });

  try {
    logStep(`Starting Flashscore tennis scraper for ${targetDate}`);
    await optimizePageForScraping(page);
    await runFlashscorePipeline(page, targetDate, 'tennis', {
      url: 'https://www.flashscore.com/tennis/',
    });

    const totalMatchNodes = await page.locator('div.event__match').count();
    logStep(`TOTAL DE NODES event__match NA PÁGINA: ${totalMatchNodes}`);

    const results = await extractMatchesFromPage(page, readAllLeaguesAndMatches, 'tennis', 120000);

    if (options.writeFile !== false) {
      fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf-8');
      logStep(`Arquivo salvo: ${outputFile}`);
    }

    return results;
  } finally {
    await closeBrowserSafe(browser, { label: SPORT });
  }
}

async function scrapeFlashscoreTennis(options = {}) {
  return runWithRetry(
    () => scrapeFlashscoreTennisOnce(options),
    'Flashscore tennis scraper',
    options
  );
}

module.exports = { scrapeFlashscoreTennis };

if (require.main === module) {
  scrapeFlashscoreTennis()
    .then(() => {
      logStep('Scraper finished.');
      exitScript(0);
    })
    .catch(error => {
      logStep(`ERROR: ${error.message}`);
      exitScript(1);
    });
}