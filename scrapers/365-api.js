const fs = require('fs');
const path = require('path');
const https = require('https');

const API_FETCH_TIMEOUT_MS = Number(process.env.API_365_TIMEOUT_MS || 120000);
const API_FETCH_MAX_ATTEMPTS = Number(process.env.API_365_MAX_ATTEMPTS || 3);
const {
  resolveScanTimezone,
  SCAN_TIMEZONE,
  ISRAEL_SCAN_TIMEZONE,
  tomorrowIsoInTimezone,
  resolveScanTargetDate,
  isStaleFinishedGameStatus,
  gameBelongsToScanTarget,
  localDateTimeInZoneToUtc,
  formatLocalDateTimeFromUtc,
  addDaysIso,
} = require('../lib/scan-timezone');

const MOBILE_STIME_SOURCE_TZ = ISRAEL_SCAN_TIMEZONE;

const API_BASE_URL = 'https://mobileapi.365scores.com/Data/Games/';
const TIMEZONE = resolveScanTimezone();
const TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const SPORT_TYPE_IDS = {
  football: 1,
  basketball: 2,
  tennis: 3,
  hockey: 4,
  handball: 5,
  americanFootball: 6,
  baseball: 7,
  volleyball: 8,
};

function cleanText(text = '') {
  return String(text || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeKey(text = '') {
  return cleanText(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function localDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function tomorrowIso() {
  return tomorrowIsoInTimezone(TIMEZONE);
}

function resolveTargetDate(rawDate) {
  return resolveScanTargetDate(rawDate, TIMEZONE);
}

function apiDate(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

function formatTime(startTime) {
  if (!startTime) return null;
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return null;
  return TIME_FORMATTER.format(date);
}

function formatDateKey(startTime) {
  if (!startTime) return null;
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return null;
  return DATE_FORMATTER.format(date);
}

function normalizeStatus(status = '') {
  const key = normalizeKey(status || 'scheduled');
  if (!key || key === 'sched' || key === 'scheduled') return 'scheduled';
  return key;
}

function firstName(...values) {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return '';
}

function competitorPair(game) {
  const home = firstName(
    game.homeCompetitor?.name,
    game.homeCompetitor?.shortName,
    game.homeCompetitor?.nameForURL
  );
  const away = firstName(
    game.awayCompetitor?.name,
    game.awayCompetitor?.shortName,
    game.awayCompetitor?.nameForURL
  );

  if (home && away) return { home, away };

  if (Array.isArray(game.competitors) && game.competitors.length >= 2) {
    return {
      home: firstName(game.competitors[0]?.name, game.competitors[0]?.shortName),
      away: firstName(game.competitors[1]?.name, game.competitors[1]?.shortName),
    };
  }

  return { home: '', away: '' };
}

function mobileTimezoneId(timezone = TIMEZONE) {
  const map = {
    'America/Sao_Paulo': 15,
    'America/Argentina/Buenos_Aires': 15,
    'America/New_York': 12,
    'Asia/Jerusalem': 11,
  };
  return map[timezone] || 15;
}

function makeMobileApiUrl(sportTypeId, startDate, endDate = startDate) {
  const params = new URLSearchParams({
    startdate: apiDate(startDate),
    endDate: apiDate(endDate),
    FullCurrTime: 'true',
    onlyvideos: 'false',
    sports: String(sportTypeId),
    onlymajorgames: 'false',
    withExpanded: 'true',
    light: 'true',
    ShowNAOdds: 'true',
    OddsFormat: '1',
    AppVersion: '1478',
    tz: String(mobileTimezoneId()),
    StoreVersion: '1478',
    theme: 'dark',
    lang: '1',
    athletesSupported: 'true',
    AppType: '2',
    UserCurrency: '1',
    uc: '10',
  });
  return `${API_BASE_URL}?${params.toString()}`;
}

function parseMobileSTimeParts(stime = '') {
  const match = String(stime).match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const [, day, month, year, hour, minute] = match;
  return {
    dateKey: `${year}-${month}-${day}`,
    time: `${hour.padStart(2, '0')}:${minute}`,
  };
}

function convertMobileScheduleToScanTimezone(schedule) {
  if (!schedule) return null;
  if (MOBILE_STIME_SOURCE_TZ === TIMEZONE) return schedule;

  const utcDate = localDateTimeInZoneToUtc(
    schedule.dateKey,
    schedule.time,
    MOBILE_STIME_SOURCE_TZ
  );
  return formatLocalDateTimeFromUtc(utcDate, TIMEZONE);
}

function mobileGameStatus(game = {}) {
  if (game.IsFinished) return 'ended';
  if (game.Active) return 'live';
  return 'scheduled';
}

function normalizeMobileApiPayload(json = {}) {
  const countries = (json.Countries || []).map(country => ({
    id: country.ID,
    name: country.Name,
  }));
  const competitions = (json.Competitions || []).map(competition => ({
    id: competition.ID,
    name: competition.Name,
    countryId: competition.CID,
  }));
  const games = (json.Games || []).map(game => {
    const comps = Array.isArray(game.Comps) ? game.Comps : [];
    const rawSchedule = parseMobileSTimeParts(game.STime);
    const schedule = convertMobileScheduleToScanTimezone(rawSchedule);

    return {
      id: game.ID,
      startTime: game.STime || null,
      mobileDateKey: schedule?.dateKey || null,
      mobileTime: schedule?.time || null,
      competitionId: game.Comp,
      statusText: mobileGameStatus(game),
      homeCompetitor: comps[0]
        ? { name: comps[0].Name, shortName: comps[0].SymbolicName || comps[0].Name }
        : null,
      awayCompetitor: comps[1]
        ? { name: comps[1].Name, shortName: comps[1].SymbolicName || comps[1].Name }
        : null,
      competitors: comps.map(comp => ({
        name: comp.Name,
        shortName: comp.SymbolicName || comp.Name,
      })),
      stageName: '',
    };
  });

  return { countries, competitions, games };
}

function formatApiError(error) {
  const cause = error?.cause || error;
  if (Array.isArray(cause?.errors) && cause.errors.length) {
    return formatApiError(cause.errors[0]);
  }
  const code = cause?.code ? `${cause.code}: ` : '';
  const message = cause?.message || error?.message || String(error);
  if (message === 'AggregateError' && cause?.code) {
    return String(cause.code);
  }
  return `${code}${message}`.trim();
}

function fetch365ScoresGamesOnce(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        accept: 'application/json',
        'user-agent': 'Mozilla/5.0',
        referer: 'https://www.365scores.com/',
      },
      timeout: API_FETCH_TIMEOUT_MS,
    }, response => {
      const { statusCode } = response;
      const chunks = [];

      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');
        if (statusCode < 200 || statusCode >= 300) {
          reject(new Error(`365Scores API returned ${statusCode} ${response.statusMessage || ''}`.trim()));
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error(`365Scores API returned invalid JSON: ${formatApiError(error)}`));
        }
      });
    });

    request.on('timeout', () => {
      request.destroy(new Error(`365Scores API timed out after ${API_FETCH_TIMEOUT_MS}ms`));
    });
    request.on('error', reject);
  });
}

async function fetch365ScoresGames(sportTypeId, startDate, endDate = startDate) {
  const url = makeMobileApiUrl(sportTypeId, startDate, endDate);
  console.log(`365Scores API: ${url}`);

  let lastError;
  for (let attempt = 1; attempt <= API_FETCH_MAX_ATTEMPTS; attempt++) {
    try {
      const raw = await fetch365ScoresGamesOnce(url);
      return normalizeMobileApiPayload(raw);
    } catch (error) {
      lastError = error;
      if (attempt < API_FETCH_MAX_ATTEMPTS) {
        console.log(`WARN: 365Scores API attempt ${attempt}/${API_FETCH_MAX_ATTEMPTS} failed (${formatApiError(error)}). Retrying...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
  }

  throw new Error(`365Scores API request failed: ${formatApiError(lastError)}`);
}

function shouldIncludeGameForScan(gameDateKey, targetDate) {
  return gameBelongsToScanTarget(gameDateKey, targetDate);
}

function apiFetchWindow(targetDate) {
  // Mobile API indexes STime by Israel calendar day; evening Americas games often
  // land on the next Jerusalem date but convert to targetDate in SCAN_TIMEZONE.
  return { startDate: targetDate, endDate: addDaysIso(targetDate, 1) };
}

function parseGames(json, { sportKey, targetDate }) {
  const countriesById = new Map((json?.countries || []).map(country => [country.id, country]));
  const competitionsById = new Map((json?.competitions || []).map(competition => [competition.id, competition]));
  const rows = [];

  for (const game of json?.games || []) {
    const gameDateKey = game.mobileDateKey || formatDateKey(game.startTime);
    const time = game.mobileTime || formatTime(game.startTime);
    if (!shouldIncludeGameForScan(gameDateKey, targetDate)) continue;

    const { home, away } = competitorPair(game);
    if (!home || !away) continue;

    const status = normalizeStatus(game.statusText || game.shortStatusText);
    if (isStaleFinishedGameStatus(status)) continue;

    const competitionInfo = competitionsById.get(game.competitionId);
    const countryInfo = countriesById.get(competitionInfo?.countryId);
    const competition = firstName(
      competitionInfo?.name,
      game.competitionDisplayName,
      game.competition?.name,
      game.league?.name,
      'Sem competição'
    );
    const displayCompetition = firstName(
      game.competitionDisplayName,
      competitionInfo?.name,
      game.competition?.name,
      game.league?.name,
      competition
    );
    const groupName = firstName(
      game.countryName,
      game.competitionCountryName,
      game.regionName,
      game.competition?.countryName,
      countryInfo?.name,
      'International'
    );

    rows.push({
      groupName,
      competition,
      displayCompetition,
      home,
      away,
      time,
      status,
      dateKey: gameDateKey,
      gameId: String(game.id || ''),
      stageName: cleanText(game.stageName || ''),
      isTennisDoubles: sportKey === 'tennis' && `${home} ${away}`.includes('/'),
    });
  }

  return rows;
}

function matchRowKey(row) {
  return [
    normalizeKey(row.groupName),
    normalizeKey(row.competition),
    normalizeKey(row.home),
    normalizeKey(row.away),
    row.time || '',
  ].join('__');
}

function dedupe365Rows(rows, targetDate) {
  const bestByKey = new Map();

  for (const row of rows) {
    if (targetDate && row.dateKey && row.dateKey !== targetDate) continue;
    const key = matchRowKey(row);
    const existing = bestByKey.get(key);
    if (!existing) {
      bestByKey.set(key, row);
      continue;
    }

    const existingOnTarget = existing.dateKey === targetDate;
    const rowOnTarget = row.dateKey === targetDate;
    if (!existingOnTarget && rowOnTarget) {
      bestByKey.set(key, row);
    }
  }

  return [...bestByKey.values()];
}

function tennisTourName(row) {
  const base = cleanText(row.groupName) || 'Tennis';
  if (row.isTennisDoubles && !/-D$/i.test(base)) return `${base}-D`;
  return base;
}

function groupRows(rows, sportKey) {
  const groupMap = new Map();

  for (const row of rows) {
    const groupName = sportKey === 'tennis' ? tennisTourName(row) : row.groupName;
    const groupKey = normalizeKey(groupName);
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        label: groupName,
        competitions: new Map(),
        totalFound: 0,
      });
    }

    const group = groupMap.get(groupKey);
    const compKey = normalizeKey(row.competition);
    if (!group.competitions.has(compKey)) {
      group.competitions.set(compKey, {
        name: row.competition,
        matches: [],
      });
    }

    group.totalFound += 1;
    group.competitions.get(compKey).matches.push({
      home: row.home,
      away: row.away,
      time: row.time,
      status: row.status,
      dateKey: row.dateKey,
      ...(sportKey === 'tennis' ? {
        competition: row.displayCompetition,
        stageName: row.stageName,
        gameId: row.gameId,
      } : {}),
    });
  }

  return [...groupMap.values()]
    .sort((a, b) => a.label.localeCompare(b.label))
    .map(group => {
      const competitions = [...group.competitions.values()]
        .sort((a, b) => a.name.localeCompare(b.name));

      if (sportKey === 'tennis') {
        return {
          tour: group.label,
          count: group.totalFound,
          totalFound: group.totalFound,
          competitions,
        };
      }

      return {
        country: group.label,
        competitions,
      };
    });
}

async function run365ApiScraper(config) {
  const targetDate = resolveTargetDate(process.argv[2]);
  const sportTypeId = config.sportTypeId || SPORT_TYPE_IDS[config.sportKey];
  if (!sportTypeId) throw new Error(`Missing 365Scores sport type id for "${config.sportKey}".`);

  const outputFile = path.resolve(__dirname, '..', config.outputFile);
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });

  console.log(config.logLabel || 'Starting 365Scores API scrape');
  console.log(`Sport: ${config.sportKey} (${sportTypeId})`);
  console.log(`Date: ${targetDate} (${TIMEZONE})`);

  const { startDate, endDate } = apiFetchWindow(targetDate);
  const json = await fetch365ScoresGames(
    sportTypeId,
    startDate,
    endDate
  );
  const rows = dedupe365Rows(
    parseGames(json, { sportKey: config.sportKey, targetDate }),
    targetDate
  );
  let grouped = groupRows(rows, config.sportKey);
  if (typeof config.filterGrouped === 'function') {
    grouped = config.filterGrouped(grouped);
  }
  const totalGames = grouped.reduce((sum, group) => (
    sum + (group.competitions || []).reduce((inner, competition) => inner + (competition.matches?.length || 0), 0)
  ), 0);

  fs.writeFileSync(outputFile, JSON.stringify(grouped, null, 2), 'utf-8');

  console.log(`Done. 365Scores API saved ${totalGames} games in ${grouped.length} groups.`);
  console.log(`Saved successfully to: ${outputFile}`);
}

module.exports = {
  SPORT_TYPE_IDS,
  run365ApiScraper,
  resolveTargetDate,
  shouldIncludeGameForScan,
  apiFetchWindow,
  parseGames,
  dedupe365Rows,
  fetch365ScoresGames,
  formatApiError,
  makeMobileApiUrl,
  normalizeMobileApiPayload,
  parseMobileSTimeParts,
};
