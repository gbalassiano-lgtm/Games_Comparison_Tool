function logStep(message = '') {
  const text = String(message).trimEnd();
  if (!text) return;
  process.stdout.write(`${text}\n`);
}

// #region agent log
function debugLog(location, message, data = {}, hypothesisId = '') {
  fetch('http://127.0.0.1:7430/ingest/c8d358be-4a2a-4b6d-97fd-c259b0f5f7cc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '5ecd08' },
    body: JSON.stringify({
      sessionId: '5ecd08',
      location,
      message,
      data,
      hypothesisId,
      timestamp: Date.now(),
      runId: process.env.DEBUG_RUN_ID || 'pre-fix',
    }),
  }).catch(() => {});
}
// #endregion

async function optimizePageForScraping(page) {
  await page.route('**/*', route => {
    const resourceType = route.request().resourceType();
    if (['image', 'font', 'media'].includes(resourceType)) {
      return route.abort();
    }
    return route.continue();
  });
}

function norm(text = '') {
  return String(text)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanText(text = '') {
  return norm(
    String(text)
      .replace(/SRF/gi, ' ')
      .replace(/FRO/gi, ' ')
      .replace(/FRO/gi, ' ')
      .replace(/somente\s+o\s+resultado\s+final/gi, ' ')
      .replace(/somente\s+resultado\s+final/gi, ' ')
      .replace(/--+/g, ' ')
      .replace(/Live Bet Icon/gi, ' ')
      .replace(/Preview/gi, ' ')
      .replace(/Tabela/gi, ' ')
      .replace(/Classificação/gi, ' ')
      .replace(/Table/gi, ' ')
      .replace(/Standings/gi, ' ')
  );
}

const FLASH_TIME_EVAL_HELPERS = String.raw`
function stripScheduleMarkers(text = '') {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/SRF/gi, ' ')
    .replace(/FRO/gi, ' ')
    .replace(/somente\s+(o\s+)?resultado\s+final/gi, ' ')
    .replace(/final\s+result\s+only/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isScheduleMarker(text = '') {
  const value = stripScheduleMarkers(text).toLowerCase();
  return !value ||
    /^srf$/i.test(String(text || '').trim()) ||
    /^fro$/i.test(String(text || '').trim()) ||
    /^(somente\s+)?(o\s+)?resultado\s+final$/i.test(value) ||
    /^final\s+result\s+only$/i.test(value);
}

function extractMatchTime(matchNode, rawClean = '') {
  const attrSources = [
    matchNode?.getAttribute?.('data-starttime'),
    matchNode?.getAttribute?.('data-time'),
    matchNode?.getAttribute?.('title'),
    matchNode?.querySelector?.('[data-starttime]')?.getAttribute?.('data-starttime'),
    matchNode?.querySelector?.('[data-time]')?.getAttribute?.('data-time'),
  ];

  for (const value of attrSources) {
    const text = stripScheduleMarkers(String(value || ''));
    const match = text.match(/\d{1,2}:\d{2}/);
    if (match) return match[0];
  }

  const selectors = ['.event__time', '.event__stage', '.event__stage--block', '.event__stage--pkv'];
  for (const selector of selectors) {
    const elements = Array.from(matchNode.querySelectorAll(selector));
    for (const el of elements) {
      const text = stripScheduleMarkers(el.textContent || '');
      const embedded = text.match(/^(\d{1,2}\.\d{1,2}\.\s*\d{1,2}:\d{2})/);
      if (embedded) return embedded[1];
      if (/^\d{1,2}:\d{2}$/.test(text)) return text;
      const match = text.match(/\d{1,2}:\d{2}/);
      if (match) return match[0];
    }
  }

  for (const el of Array.from(matchNode.querySelectorAll('div, span'))) {
    const text = stripScheduleMarkers(el.textContent || '');
    const embedded = text.match(/^(\d{1,2}\.\d{1,2}\.\s*\d{1,2}:\d{2})/);
    if (embedded) return embedded[1];
    if (/^\d{1,2}:\d{2}$/.test(text)) return text;
    const match = text.match(/^\d{1,2}:\d{2}/);
    if (match) return match[0];
  }

  const rawText = stripScheduleMarkers(rawClean);
  const embeddedRaw = rawText.match(/^(\d{1,2}\.\d{1,2}\.\s*\d{1,2}:\d{2})/);
  if (embeddedRaw) return embeddedRaw[1];
  const rawMatch = rawText.match(/\d{1,2}:\d{2}/);
  return rawMatch ? rawMatch[0] : '';
}
`;

function formatLocalDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

const {
  resolveScanTimezone,
  tomorrowIsoInTimezone,
  todayIsoInTimezone,
  resolveScanTargetDate,
  isStaleFinishedGameStatus,
  formatDateKeyInTimezone,
  gameBelongsToScanTarget,
  daysBetweenIso,
} = require('../lib/scan-timezone');

function scanTimezone() {
  return resolveScanTimezone();
}

function tomorrowIso() {
  return tomorrowIsoInTimezone(scanTimezone());
}

function resolveTargetDate(rawDate) {
  return resolveScanTargetDate(rawDate, scanTimezone());
}

function parseEmbeddedFlashSchedule(time = '', targetDate = '') {
  const text = String(time || '').trim();
  const match = text.match(/^(\d{1,2})\.(\d{1,2})\.\s*(.*)$/);
  if (!match) return null;

  const year = String(targetDate || '').split('-')[0];
  if (!year) return null;

  const [, dayRaw, monthRaw, rest] = match;
  const timeMatch = String(rest || '').match(/\d{1,2}:\d{2}/);

  return {
    dateKey: `${year}-${monthRaw.padStart(2, '0')}-${dayRaw.padStart(2, '0')}`,
    time: timeMatch ? timeMatch[0] : String(rest || '').trim(),
  };
}

function normalizeFlashGameForScanTarget(game = {}, targetDate = '', options = {}) {
  const next = { ...game };
  const embedded = parseEmbeddedFlashSchedule(next.time, targetDate);
  if (embedded) {
    next.time = embedded.time || next.time;
    next.dateKey = embedded.dateKey;
  }

  if (!next.dateKey && next.startTime) {
    const raw = Number(next.startTime);
    if (Number.isFinite(raw) && raw > 0) {
      const timestampMs = raw > 1e12 ? raw : raw * 1000;
      next.dateKey = formatDateKeyInTimezone(new Date(timestampMs), scanTimezone());
    }
  }

  if (
    !next.dateKey &&
    targetDate &&
    options.assignTimeOnlyDate &&
    /^\d{1,2}:\d{2}$/.test(String(next.time || '').trim())
  ) {
    next.dateKey = targetDate;
  }

  delete next.startTime;
  return next;
}

function assessPageDateContent(sample = {}, targetDate = '') {
  const today = sample.today || todayIsoInTimezone(scanTimezone());

  if (!targetDate) return { ok: true, reason: 'no-target' };
  if (sample.sampleCount === 0) return { ok: true, reason: 'empty-schedule' };

  const { uniqueDateKeys = [], dateKeys = [] } = sample;
  if (uniqueDateKeys.length === 0) {
    return { ok: null, reason: 'time-only-matches' };
  }

  const todayCount = dateKeys.filter(d => d === today).length;
  const targetCount = dateKeys.filter(d => d === targetDate).length;

  if (targetCount > 0 && todayCount === 0) {
    return { ok: true, reason: 'starttimes-match-target' };
  }
  if (todayCount > 0 && targetCount === 0) {
    return { ok: false, reason: 'starttimes-are-today' };
  }
  if (targetCount > 0 && todayCount > 0) {
    return { ok: targetCount >= todayCount, reason: 'mixed-dates' };
  }

  return { ok: uniqueDateKeys.includes(targetDate), reason: 'other-dates-only' };
}

async function validateVisiblePageDate(page, targetDate) {
  const sample = await sampleVisibleMatchDates(page, targetDate);
  const assessment = assessPageDateContent(sample, targetDate);

  if (assessment.ok === true) {
    return { valid: true, sample, assessment };
  }
  if (assessment.ok === false) {
    return { valid: false, sample, assessment };
  }

  const pickerText = await readPickerDateText(page);
  if (matchesFlashscoreDateOption(pickerText, targetDate)) {
    return { valid: true, sample, assessment: { ...assessment, pickerConfirmed: true } };
  }

  return { valid: false, sample, assessment: { ...assessment, pickerText } };
}

function filterFlashGamesForScanTarget(games = [], targetDate = '', options = {}) {
  const normalized = (games || [])
    .map(game => normalizeFlashGameForScanTarget(game, targetDate, options))
    .filter(game => !isStaleFinishedGameStatus(game.status));

  const passed = normalized.filter(game => {
    if (!targetDate) return true;
    if (!game.dateKey) return false;
    return gameBelongsToScanTarget(game.dateKey, targetDate);
  });

  // #region agent log
  const noDateKeyPassed = passed.filter(g => !g.dateKey);
  const wrongDateKeyPassed = passed.filter(g => g.dateKey && targetDate && g.dateKey !== targetDate);
  if (targetDate && (noDateKeyPassed.length || wrongDateKeyPassed.length)) {
    debugLog('flashscore-shared.js:filterFlashGamesForScanTarget', 'date filter leak', {
      targetDate,
      rawCount: games.length,
      passedCount: passed.length,
      noDateKeyPassed: noDateKeyPassed.length,
      wrongDateKeyPassed: wrongDateKeyPassed.length,
      sampleNoDateKey: noDateKeyPassed.slice(0, 3).map(g => ({
        home: g.home,
        away: g.away,
        time: g.time,
        competition: g.competition,
      })),
      sampleWrongDateKey: wrongDateKeyPassed.slice(0, 3).map(g => ({
        home: g.home,
        away: g.away,
        time: g.time,
        dateKey: g.dateKey,
      })),
    }, 'C');
  }
  // #endregion

  return passed;
}

function flashscoreDatePrefix(targetDate) {
  const [, month, day] = String(targetDate).split('-');
  return `${day}/${month}`;
}

function matchesFlashscoreDateOption(text = '', targetDate = '') {
  const cleaned = cleanText(text);
  if (!cleaned) return false;
  if (cleaned.startsWith(flashscoreDatePrefix(targetDate))) return true;
  if (targetDate === todayIsoInTimezone(scanTimezone()) && /^(today|hoje|oggi|aujourd)/i.test(cleaned)) return true;
  return false;
}

function urlHasTargetDate(url = '', targetDate = '') {
  if (!targetDate) return false;
  const value = String(url || '');
  return value.includes(`date=${targetDate}`);
}

async function readPickerDateText(page) {
  return page.evaluate(() => {
    const button =
      document.querySelector('[data-testid="wcl-dayPickerButton"]') ||
      document.querySelector('button[role="combobox"]');
    return button?.innerText || '';
  }).catch(() => '');
}

async function isDateAlreadySelected(page, targetDate) {
  const pickerText = await readPickerDateText(page);
  return matchesFlashscoreDateOption(pickerText, targetDate);
}

async function closeDatePickerIfOpen(page) {
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(150);
}

function dedupeFlashGames(games = []) {
  const unique = [];
  const seen = new Set();

  for (const game of games) {
    const key = [
      game.country,
      game.competition,
      game.time,
      game.status,
      game.home,
      game.away,
    ].join('__');
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(game);
  }

  return unique;
}

function sportSlugFromUrl(url = '') {
  const match = String(url).match(/flashscore\.com\/([^/?#]+)/i);
  return match?.[1] || '';
}

function buildFlashscoreSportUrl(sportOrUrl, targetDate) {
  const slug = String(sportOrUrl).includes('flashscore.com')
    ? sportSlugFromUrl(sportOrUrl)
    : String(sportOrUrl).replace(/^\/+|\/+$/g, '');
  return `https://www.flashscore.com/${slug}/?date=${targetDate}`;
}

function isSportPageUrl(href = '', expectedSlug = '') {
  const slug = String(expectedSlug || '').replace(/^\/+|\/+$/g, '');
  if (!slug) return false;
  return href.includes(`/${slug}/`) || href.endsWith(`/${slug}`);
}

async function waitForSportUrl(page, expectedSlug, timeoutMs = 12000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (isSportPageUrl(page.url(), expectedSlug)) return true;
    await page.waitForTimeout(250);
  }
  return isSportPageUrl(page.url(), expectedSlug);
}

async function assertSportPage(page, expectedSlug) {
  const href = page.url();
  if (!isSportPageUrl(href, expectedSlug)) {
    throw new Error(`Flashscore redirecionou para esporte errado: ${href} (esperado: ${expectedSlug})`);
  }
  return href;
}

async function openSportPage(page, expectedSlug, targetDate) {
  const fallback = buildFlashscoreSportUrl(expectedSlug, targetDate);
  await page.goto(fallback, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await acceptCookiesIfPresent(page);
  await waitForSportUrl(page, expectedSlug);
  await page.waitForTimeout(300);
}

async function ensureOnSportPage(page, expectedSlug, targetDate, options = {}) {
  const maxAttempts = options.maxAttempts || 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const href = page.url();
    if (isSportPageUrl(href, expectedSlug)) {
      return href;
    }

    const fallback = buildFlashscoreSportUrl(expectedSlug, targetDate);
    logStep(`WARN: redirect detectado (${href}) — reabrindo ${fallback} (tentativa ${attempt}/${maxAttempts})`);
    await openSportPage(page, expectedSlug, targetDate);
  }

  return assertSportPage(page, expectedSlug);
}

async function recoverSportPageAfterScroll(page, expectedSlug, targetDate, label = 'page', options = {}) {
  const minMatches = Number(options.minMatches || 0);
  const visibleMatches = await countVisibleMatches(page);
  const onWrongPage = !isSportPageUrl(page.url(), expectedSlug);
  const tooFewMatches = minMatches > 0 && visibleMatches < minMatches;

  if (!onWrongPage && !tooFewMatches) return;

  const reason = onWrongPage
    ? `redirect após scroll (${page.url()})`
    : `apenas ${visibleMatches} jogos visíveis (mínimo ${minMatches})`;
  logStep(`WARN: ${reason} — recuperando ${expectedSlug}...`);
  await openSportPage(page, expectedSlug, targetDate);
  if (!isSportPageUrl(page.url(), expectedSlug)) {
    throw new Error(`Flashscore redirecionou para esporte errado: ${page.url()} (esperado: ${expectedSlug})`);
  }

  await ensureTargetDate(page, targetDate, expectedSlug);
  await waitForMatchList(page);
  await loadAllVisibleMatches(page, `${label} (recovery)`, {
    expandPasses: 2,
    expandRounds: 6,
    expandOptions: {
      maxClicksPerRound: 10,
      maxTotalClicks: 40,
    },
  });
}

async function acceptCookiesIfPresent(page) {
  const cookieButtonPattern = /^(Accept|Accept all|I agree|OK|Got it|Aceitar|Entendi)$/i;

  try {
    const button = page.getByRole('button', { name: cookieButtonPattern }).first();
    if (await button.isVisible({ timeout: 800 }).catch(() => false)) {
      await button.click({ timeout: 1200 });
      await page.waitForTimeout(150);
      return true;
    }
  } catch {}

  const selectors = [
    '#onetrust-accept-btn-handler',
    'button[id*="accept" i]',
    'button[class*="accept" i]',
  ];

  for (const selector of selectors) {
    const button = page.locator(selector).first();
    if (await button.isVisible({ timeout: 250 }).catch(() => false)) {
      await button.click({ timeout: 1200 }).catch(() => {});
      await page.waitForTimeout(150);
      return true;
    }
  }

  for (const txt of ['Aceitar', 'Accept', 'OK', 'Entendi']) {
    try {
      const btn = page.getByText(txt, { exact: false });
      if (await btn.count()) {
        await btn.first().click({ timeout: 1500 });
        await page.waitForTimeout(1500);
        return true;
      }
    } catch {}
  }

  return false;
}

async function selectDateViaPicker(page, targetDate) {
  const targetPrefix = flashscoreDatePrefix(targetDate);
  const picker = page.getByTestId('wcl-dayPickerButton');

  try {
    await picker.click({ timeout: 8000, force: true });
  } catch {
    await picker.evaluate(el => el.click());
  }
  await page.waitForTimeout(500);

  const options = page.getByRole('option');
  const optionCount = await options.count();

  for (let i = 0; i < optionCount; i++) {
    const option = options.nth(i);
    const text = cleanText(await option.innerText().catch(() => ''));
    if (matchesFlashscoreDateOption(text, targetDate)) {
      try {
        await option.click({ timeout: 3000, force: true });
      } catch {
        try {
          await option.hover({ timeout: 2500, force: true });
          await page.keyboard.press('Enter');
        } catch {
          await option.evaluate(el => {
            el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            el.click();
          });
        }
      }
      logStep(`DATA SELECIONADA: ${text}`);
      return text;
    }
  }

  throw new Error(`A data ${targetPrefix} não aparece no seletor de datas do Flashscore.`);
}

function parsePickerDateKey(pickerText = '', yearHint = '') {
  const match = cleanText(pickerText).match(/^(\d{1,2})\/(\d{1,2})/);
  if (!match) return null;
  const [, day, month] = match;
  const year = yearHint || String(new Date().getFullYear());
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildFlashDateSelectionError(targetDate, pickerText = '', context = '') {
  const prefix = flashscoreDatePrefix(targetDate);
  const tz = scanTimezone();
  const today = todayIsoInTimezone(tz);
  const daysAhead = daysBetweenIso(today, targetDate);
  const visiblePicker = cleanText(pickerText) || '?';

  let hint = 'A página ainda parece mostrar outro dia — o scan foi cancelado para evitar jogos errados.';
  if (daysAhead > 7) {
    hint = `Esta data está ${daysAhead} dias à frente; o Flashscore normalmente só lista cerca de 7 dias à frente.`;
  } else if (daysAhead < 0) {
    hint = 'Esta data está no passado; confira se a data do scan está correta.';
  }

  const suffix = context ? ` (${context})` : '';
  return (
    `Flashscore não mudou para ${targetDate} (esperado ${prefix})${suffix}. ` +
    `Picker atual: "${visiblePicker}". ${hint}`
  );
}

async function clickPickerNextDay(page) {
  const selectors = [
    '.calendarnavigation--tomorrow',
    '[class*="calendarnavigation"][class*="tomorrow"]',
    'button[data-testid*="next"]',
    'button[aria-label*="Next" i]',
    'button[aria-label*="Próximo" i]',
    'button[aria-label*="Próxima" i]',
  ];

  for (const selector of selectors) {
    const button = page.locator(selector).first();
    if (await button.isVisible({ timeout: 400 }).catch(() => false)) {
      await button.click({ timeout: 2000, force: true }).catch(() => {});
      await page.waitForTimeout(450);
      return true;
    }
  }

  return page.evaluate(() => {
    const button = document.querySelector(
      '.calendarnavigation--tomorrow, [class*="calendarnavigation--tomorrow"]'
    );
    if (!button) return false;
    button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    button.click();
    return true;
  }).catch(() => false);
}

async function advancePickerToTargetDate(page, targetDate) {
  const tz = scanTimezone();
  const today = todayIsoInTimezone(tz);
  const yearHint = String(targetDate).split('-')[0];
  const stepsNeeded = Math.max(daysBetweenIso(today, targetDate), 0);
  const maxSteps = Math.min(Math.max(stepsNeeded + 2, 1), 14);

  for (let step = 0; step < maxSteps; step++) {
    if (await isDateAlreadySelected(page, targetDate)) {
      logStep(`DATA SELECIONADA (calendário +${step}): ${await readPickerDateText(page)}`);
      return true;
    }

    const pickerText = await readPickerDateText(page);
    const currentKey = parsePickerDateKey(pickerText, yearHint);
    if (currentKey && daysBetweenIso(currentKey, targetDate) <= 0) {
      break;
    }

    const clicked = await clickPickerNextDay(page);
    if (!clicked) {
      logStep(`WARN: botão "próximo dia" indisponível após ${step} passo(s)`);
      break;
    }

    await waitForMatchList(page).catch(() => {});
  }

  return isDateAlreadySelected(page, targetDate);
}

async function navigateToTargetDateViaCalendar(page, sportSlug, targetDate) {
  const slug = String(sportSlug || '').replace(/^\/+|\/+$/g, '');
  if (!slug) return false;

  const baseUrl = `https://www.flashscore.com/${slug}/`;
  logStep(`Navegando dia a dia no calendário (${baseUrl} → ${targetDate})...`);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await acceptCookiesIfPresent(page);
  await ensureOnSportPage(page, slug, targetDate);
  await waitForMatchList(page);
  return advancePickerToTargetDate(page, targetDate);
}

async function waitForSelectedDateInPicker(page, targetDate, options = {}) {
  const targetPrefix = flashscoreDatePrefix(targetDate);
  const allowUrlFallback = options.allowUrlFallback !== false;

  for (let attempt = 0; attempt < 40; attempt++) {
    const pickerText = await readPickerDateText(page);
    if (matchesFlashscoreDateOption(pickerText, targetDate)) return;
    if (allowUrlFallback && urlHasTargetDate(page.url(), targetDate)) return;
    await page.waitForTimeout(500);
  }

  if (allowUrlFallback && urlHasTargetDate(page.url(), targetDate)) {
    logStep(`WARN: Picker label does not confirm ${targetPrefix}, but URL has date=${targetDate}.`);
    return;
  }

  throw new Error(`Flashscore did not switch to date ${targetPrefix}.`);
}

async function sampleVisibleMatchDates(page, targetDate) {
  const tz = scanTimezone();
  const samples = await page.evaluate(() => {
    const rows = [];
    for (const node of Array.from(document.querySelectorAll('div.event__match')).slice(0, 25)) {
      const raw =
        node.getAttribute('data-starttime') ||
        node.querySelector('[data-starttime]')?.getAttribute('data-starttime') ||
        '';
      const timeText = (
        node.querySelector('.event__time, .event__stage, .event__stage--block')?.textContent || ''
      ).replace(/\u00a0/g, ' ').trim();
      rows.push({ startTime: raw, timeText });
    }
    return rows;
  }).catch(() => []);

  const dateKeys = samples.map(row => {
    const raw = Number(row.startTime);
    if (!Number.isFinite(raw) || raw <= 0) return null;
    const timestampMs = raw > 1e12 ? raw : raw * 1000;
    return formatDateKeyInTimezone(new Date(timestampMs), tz);
  }).filter(Boolean);

  return {
    sampleCount: samples.length,
    dateKeys,
    uniqueDateKeys: [...new Set(dateKeys)],
    timeOnlyCount: samples.filter(s => /^\d{1,2}:\d{2}$/.test(String(s.timeText || '').trim())).length,
    targetDate,
    today: todayIsoInTimezone(tz),
  };
}

async function assertTargetDateOnPage(page, targetDate, context = '') {
  const validation = await validateVisiblePageDate(page, targetDate);
  // #region agent log
  debugLog('flashscore-shared.js:assertTargetDateOnPage', context || 'validate', {
    targetDate,
    valid: validation.valid,
    assessment: validation.assessment,
    sample: validation.sample,
    url: page.url(),
    pickerText: await readPickerDateText(page),
  }, 'A');
  // #endregion

  if (validation.valid) return validation;

  const pickerText = await readPickerDateText(page);
  throw new Error(buildFlashDateSelectionError(targetDate, pickerText, context));
}

async function ensureTargetDate(page, targetDate, sportSlug) {
  const targetPrefix = flashscoreDatePrefix(targetDate);
  const slug = String(sportSlug || sportSlugFromUrl(page.url()) || '').replace(/^\/+|\/+$/g, '');
  const pickerTextInitial = await readPickerDateText(page);
  const urlInitial = page.url();

  // #region agent log
  debugLog('flashscore-shared.js:ensureTargetDate', 'entry', {
    targetDate,
    targetPrefix,
    slug,
    urlInitial,
    pickerTextInitial,
    pickerMatches: matchesFlashscoreDateOption(pickerTextInitial, targetDate),
    urlHasDate: urlHasTargetDate(urlInitial, targetDate),
  }, 'A');
  // #endregion

  if (await isDateAlreadySelected(page, targetDate)) {
    await assertTargetDateOnPage(page, targetDate, 'picker-already-selected');
    return;
  }

  try {
    await selectDateViaPicker(page, targetDate);
    await waitForSelectedDateInPicker(page, targetDate, { allowUrlFallback: false });
    await assertTargetDateOnPage(page, targetDate, 'picker-selected');
    return;
  } catch (pickerError) {
    await closeDatePickerIfOpen(page);

    if (slug) {
      logStep(`WARN: ${pickerError.message} — tentando avançar no calendário...`);
      if (await advancePickerToTargetDate(page, targetDate)) {
        await assertTargetDateOnPage(page, targetDate, 'calendar-advance');
        return;
      }

      if (await navigateToTargetDateViaCalendar(page, slug, targetDate)) {
        await assertTargetDateOnPage(page, targetDate, 'calendar-reset-advance');
        return;
      }

      const pickerText = await readPickerDateText(page);
      throw new Error(buildFlashDateSelectionError(targetDate, pickerText, 'seleção de data'));
    }

    throw pickerError;
  }
}

async function waitForMatchList(page) {
  await Promise.race([
    page.locator('div.event__match').first().waitFor({ state: 'attached', timeout: 20000 }),
    page.locator('div.headerLeague__wrapper').first().waitFor({ state: 'attached', timeout: 20000 }),
    page.getByText(/no match/i).first().waitFor({ state: 'visible', timeout: 20000 }),
  ]).catch(() => {});
}

async function evaluateWithTimeout(page, fn, arg, timeoutMs = 10000) {
  let timer = null;
  try {
    return await Promise.race([
      arg === undefined ? page.evaluate(fn) : page.evaluate(fn, arg),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`page evaluate timeout after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const DEFAULT_FLASH_EXPAND_OPTIONS = {
  maxClicksPerRound: 15,
  maxTotalClicks: 120,
  stopAtMatches: 0,
};

const DEFAULT_FLASH_LOAD_OPTIONS = {
  expandRounds: 12,
  expandPasses: 6,
  expandOptions: DEFAULT_FLASH_EXPAND_OPTIONS,
};

async function deepScrollToLoadAll(page, label = 'page', options = {}) {
  let lastHeight = 0;
  let stableRounds = 0;
  const maxRounds = options.light ? 12 : 28;
  const delayMs = options.light ? 120 : 160;

  for (let i = 0; i < maxRounds; i++) {
    if (i === 0 || (i + 1) % 3 === 0) {
      logStep(`Scrolling ${label}... ${i + 1}/${maxRounds}`);
    }

    try {
      await evaluateWithTimeout(
        page,
        () => {
          const height = Math.max(
            document.documentElement.scrollHeight,
            document.body?.scrollHeight || 0
          );
          window.scrollTo(0, height);
          window.scrollBy(0, Math.max(1800, window.innerHeight * 1.5));
        },
        undefined,
        8000
      );
    } catch (error) {
      logStep(`WARN scroll (${label}): ${error.message}`);
      break;
    }

    await page.waitForTimeout(delayMs);

    const newHeight = await page.evaluate(() => document.documentElement.scrollHeight).catch(() => lastHeight);

    if (newHeight === lastHeight) {
      stableRounds++;
    } else {
      stableRounds = 0;
      lastHeight = newHeight;
    }

    if (stableRounds >= 3) break;
  }

  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  await page.waitForTimeout(120);
}

async function countVisibleMatches(page) {
  return page.locator('div.event__match').count().catch(() => 0);
}

async function expandAllShowGames(page, maxRounds = 12, options = {}) {
  const maxClicksPerRound = options.maxClicksPerRound ?? DEFAULT_FLASH_EXPAND_OPTIONS.maxClicksPerRound;
  const maxTotalClicks = options.maxTotalClicks ?? DEFAULT_FLASH_EXPAND_OPTIONS.maxTotalClicks;
  const stopAtMatches = options.stopAtMatches ?? DEFAULT_FLASH_EXPAND_OPTIONS.stopAtMatches;
  let totalClicks = 0;

  for (let round = 1; round <= maxRounds; round++) {
    const visibleMatches = await countVisibleMatches(page);
    if (stopAtMatches > 0 && visibleMatches >= stopAtMatches) {
      logStep(`Rodada ${round}: ${visibleMatches} jogos visíveis — expansão suficiente.`);
      break;
    }

    const roundClicks = await page.evaluate(limit => {
      const pattern = /^(Show matches|Show more matches|Show games|Display matches|Show more|Exibir jogos|Mostrar mais jogos|Mostrar jogos|Mostrar partidas|Exibir partidas|Afficher les matchs)(\s*\(\d+\))?$/i;
      const clean = text => String(text || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
      const candidates = Array.from(document.querySelectorAll('button, a, div, span'))
        .filter(el => {
          const text = clean(el.textContent || '');
          if (!pattern.test(text)) return false;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .slice(0, limit);

      for (const el of candidates) {
        el.scrollIntoView({ block: 'center', inline: 'center' });
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        el.click();
      }

      return candidates.length;
    }, maxClicksPerRound);

    if (!roundClicks) {
      logStep(`Rodada ${round}: nenhum botão encontrado`);
      break;
    }

    totalClicks += roundClicks;
    logStep(`Rodada ${round}: ${roundClicks} cliques em "Show matches" (total ${totalClicks})`);

    if (totalClicks >= maxTotalClicks) {
      logStep(`Limite de ${maxTotalClicks} cliques em "Show matches" atingido.`);
      break;
    }

    await deepScrollToLoadAll(page, 'matches', { light: true });
    await page.waitForTimeout(220);
  }

  logStep(`Total "Show matches" clicks: ${totalClicks}`);
  return totalClicks;
}

async function loadAllVisibleMatches(page, label = 'page', options = {}) {
  const expandRounds = options.expandRounds ?? DEFAULT_FLASH_LOAD_OPTIONS.expandRounds;
  const expandPasses = options.expandPasses ?? DEFAULT_FLASH_LOAD_OPTIONS.expandPasses;
  const expandOptions = {
    ...DEFAULT_FLASH_EXPAND_OPTIONS,
    ...(options.expandOptions || {}),
  };

  let prevCount = 0;
  let stablePasses = 0;
  let totalClicks = 0;

  for (let pass = 1; pass <= expandPasses; pass++) {
    await deepScrollToLoadAll(page, label, { light: pass > 1 });
    const clicks = await expandAllShowGames(page, expandRounds, expandOptions);
    totalClicks += clicks;
    await deepScrollToLoadAll(page, label);

    const count = await countVisibleMatches(page);
    logStep(`Pass ${pass}/${expandPasses}: ${count} jogos visíveis (${totalClicks} expansões no total)`);

    if (count > prevCount) {
      prevCount = count;
      stablePasses = 0;
      continue;
    }

    stablePasses += 1;
    if (stablePasses >= 2) break;
  }

  await deepScrollToLoadAll(page, label);
  const finalCount = await countVisibleMatches(page);
  logStep(`Carregamento concluído: ${finalCount} jogos visíveis.`);
  return { matchCount: finalCount, totalClicks };
}

async function extractMatchesFromPage(page, readFn, label = 'page', timeoutMs = 90000, targetDate = '') {
  logStep(`Extraindo jogos do DOM (${label})...`);
  let timer = null;
  const results = await Promise.race([
    readFn(page),
    new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`DOM extraction timed out after ${Math.round(timeoutMs / 1000)}s`)),
        timeoutMs
      );
    }),
  ]).finally(() => {
    if (timer) clearTimeout(timer);
  });
  logStep(`Extração concluída: ${results.length} jogos (${label}).`);
  const deduped = dedupeFlashGames(results);
  // #region agent log
  const preFilterSample = deduped.slice(0, 5).map(g => ({
    home: g.home,
    away: g.away,
    time: g.time,
    startTime: g.startTime || null,
  }));
  debugLog('flashscore-shared.js:extractMatchesFromPage', 'pre-filter sample', {
    targetDate,
    label,
    rawCount: results.length,
    dedupedCount: deduped.length,
    preFilterSample,
  }, 'D');
  // #endregion
  return filterFlashGamesForScanTarget(deduped, targetDate, { assignTimeOnlyDate: true });
}

async function runFlashscorePipeline(page, targetDate, label, steps = {}) {
  const {
    beforeScroll,
    afterScroll,
    expandRounds = DEFAULT_FLASH_LOAD_OPTIONS.expandRounds,
    expandPasses = DEFAULT_FLASH_LOAD_OPTIONS.expandPasses,
  } = steps;

  logStep(`Abrindo página Flashscore (${label})...`);
  const sportSlug = steps.sportSlug || sportSlugFromUrl(steps.url) || label;
  const targetUrl = steps.url?.includes('date=')
    ? steps.url
    : buildFlashscoreSportUrl(sportSlug, targetDate);

  logStep(`Opening: ${targetUrl}`);
  await page.goto(targetUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  logStep('Página carregada. Aceitando cookies...');

  await acceptCookiesIfPresent(page);
  await ensureOnSportPage(page, sportSlug, targetDate);
  logStep('Selecionando data...');
  await ensureTargetDate(page, targetDate, sportSlug);
  await waitForMatchList(page);

  logStep('Carregando jogos (scroll)...');
  if (beforeScroll) await beforeScroll(page);
  await loadAllVisibleMatches(page, label, {
    expandRounds,
    expandPasses,
    expandOptions: steps.expandOptions,
  });
  if (afterScroll) await afterScroll(page);
  await recoverSportPageAfterScroll(page, sportSlug, targetDate, label, {
    minMatches: steps.minMatchesAfterScroll || 0,
  });
  logStep('Extração da página concluída.');
}

async function scrapeFlashscoreDates(page, targetDate, label, steps, readFn) {
  await runFlashscorePipeline(page, targetDate, label, steps);
  return extractMatchesFromPage(page, readFn, label, 90000, targetDate);
}

async function runWithRetry(runOnce, label, options = {}) {
  const maxAttempts = options.retry === false ? 1 : (options.maxAttempts || 3);
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt > 1) {
        logStep(`\nRetrying ${label} (${attempt}/${maxAttempts})...`);
      }
      return await runOnce();
    } catch (error) {
      lastError = error;
      logStep(`\nERROR (attempt ${attempt}/${maxAttempts}): ${error.message}\n`);
    }
  }

  throw lastError || new Error(`${label} failed.`);
}

module.exports = {
  norm,
  cleanText,
  logStep,
  formatLocalDate,
  tomorrowIso,
  resolveTargetDate,
  flashscoreDatePrefix,
  sportSlugFromUrl,
  buildFlashscoreSportUrl,
  isSportPageUrl,
  ensureOnSportPage,
  recoverSportPageAfterScroll,
  acceptCookiesIfPresent,
  selectDateViaPicker,
  waitForSelectedDateInPicker,
  ensureTargetDate,
  urlHasTargetDate,
  isDateAlreadySelected,
  waitForMatchList,
  optimizePageForScraping,
  deepScrollToLoadAll,
  expandAllShowGames,
  loadAllVisibleMatches,
  DEFAULT_FLASH_EXPAND_OPTIONS,
  DEFAULT_FLASH_LOAD_OPTIONS,
  FLASH_TIME_EVAL_HELPERS,
  extractMatchesFromPage,
  runFlashscorePipeline,
  scrapeFlashscoreDates,
  dedupeFlashGames,
  filterFlashGamesForScanTarget,
  normalizeFlashGameForScanTarget,
  parseEmbeddedFlashSchedule,
  matchesFlashscoreDateOption,
  assessPageDateContent,
  buildFlashDateSelectionError,
  parsePickerDateKey,
  assertSportPage,
  runWithRetry,
};
