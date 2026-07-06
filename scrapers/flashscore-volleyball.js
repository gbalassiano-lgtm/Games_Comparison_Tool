const { launchBrowser, newPageInScanTimezone, closeBrowserSafe, exitScript } = require('./launch-browser');
const fs = require('fs');
const path = require('path');
const {
  norm,
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
        'suspended', 'interrupted', 'awarded', 'walkover',
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
        if (txt === time) continue;
        if (txt === status) continue;
        if (isStatusText(txt)) continue;
        if (isAggregateText(txt)) continue;
        if (/^\d{1,2}:\d{2}$/.test(txt)) continue;
        if (/^\d+$/.test(txt)) continue;
        if (/^(preview|tabela|classificação|live bet icon|resultado final|somente o resultado final)$/i.test(txt)) continue;

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
        .filter(t => t !== 'SRF')
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

    // ── Leitura do DOM ──────────────────────────────────────────────────────

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

    // Deduplica
    const unique = [];
    const seen = new Set();
    for (const row of rows) {
      const key = `${row.country}__${row.competition}__${row.time}__${row.status}__${row.home}__${row.away}`;
      if (!seen.has(key)) { seen.add(key); unique.push(row); }
    }

    return unique;
  }, FLASH_TIME_EVAL_HELPERS);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function scrapeFlashscoreVolleyballOnce(options = {}) {
  const SPORT = 'volleyball';
  const targetDate = resolveTargetDate(options.targetDate || process.argv[2]);
  const outputDir = path.join(__dirname, '..', 'output', options.outputDir || SPORT);
  const outputFile = options.outputFile || path.join(outputDir, 'flashscore_tomorrow_volleyball_all_countries.json');
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await launchBrowser();
  const page = await newPageInScanTimezone(browser, { viewport: { width: 1440, height: 2200 } });

  try {
    logStep(`Starting Flashscore volleyball scraper for ${targetDate}`);
    await optimizePageForScraping(page);
    await runFlashscorePipeline(page, targetDate, 'volleyball', {
      url: 'https://www.flashscore.com/volleyball/',
    });

    const totalMatchNodes = await page.locator('div.event__match').count();
    logStep(`TOTAL DE NODES event__match NA PÁGINA: ${totalMatchNodes}`);

    const results = await extractMatchesFromPage(page, readAllLeaguesAndMatches, 'volleyball');

    if (options.writeFile !== false) {
      fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf-8');
      logStep(`Arquivo salvo: ${outputFile}`);
    }

    return results;
  } finally {
    await closeBrowserSafe(browser, { label: SPORT });
  }
}

async function scrapeFlashscoreVolleyball(options = {}) {
  return runWithRetry(
    () => scrapeFlashscoreVolleyballOnce(options),
    'Flashscore volleyball scraper',
    options
  );
}

module.exports = { scrapeFlashscoreVolleyball };

if (require.main === module) {
  scrapeFlashscoreVolleyball()
    .then(() => {
      logStep('Scraper finished.');
      exitScript(0);
    })
    .catch(error => {
      logStep(`ERROR: ${error.message}`);
      exitScript(1);
    });
}