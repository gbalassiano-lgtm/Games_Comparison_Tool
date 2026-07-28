const assert = require('assert');
const {
  localDateTimeInZoneToUtc,
  formatLocalDateTimeFromUtc,
} = require('../lib/scan-timezone');
const {
  makeMobileApiUrl,
  parseMobileSTimeParts,
  normalizeMobileApiPayload,
  parseGames,
} = require('../scrapers/365-api');

const TARGET_TZ = 'America/Sao_Paulo';
const SOURCE_TZ = 'Asia/Jerusalem';

function convertMobileSTime(stime) {
  const raw = parseMobileSTimeParts(stime);
  const utcDate = localDateTimeInZoneToUtc(raw.dateKey, raw.time, SOURCE_TZ);
  return formatLocalDateTimeFromUtc(utcDate, TARGET_TZ);
}

assert.match(
  makeMobileApiUrl(1, '2026-07-03'),
  /mobileapi\.365scores\.com\/Data\/Games\/\?.*startdate=03%2F07%2F2026.*sports=1/
);

assert.deepStrictEqual(
  parseMobileSTimeParts('03-07-2026 15:30'),
  { dateKey: '2026-07-03', time: '15:30' }
);

assert.deepStrictEqual(
  convertMobileSTime('03-07-2026 21:00'),
  { dateKey: '2026-07-03', time: '15:00' }
);

assert.deepStrictEqual(
  convertMobileSTime('03-07-2026 15:00'),
  { dateKey: '2026-07-03', time: '09:00' }
);

const normalized = normalizeMobileApiPayload({
  Countries: [{ ID: 18, Name: 'USA' }],
  Competitions: [{ ID: 5663, Name: 'USL Championship', CID: 18 }],
  Games: [{
    ID: 1,
    Comp: 5663,
    STime: '03-07-2026 20:00',
    IsFinished: false,
    Active: false,
    Comps: [
      { Name: 'Home FC', SymbolicName: 'HOM' },
      { Name: 'Away FC', SymbolicName: 'AWY' },
    ],
  }],
});

const rows = parseGames(normalized, { sportKey: 'football', targetDate: '2026-07-03' });
assert.strictEqual(rows.length, 1);
assert.strictEqual(rows[0].home, 'Home FC');
assert.strictEqual(rows[0].away, 'Away FC');
assert.strictEqual(rows[0].dateKey, '2026-07-03');
assert.strictEqual(rows[0].time, '14:00');

const postponedPayload = normalizeMobileApiPayload({
  Countries: [{ ID: 21, Name: 'Brazil' }],
  Competitions: [{ ID: 113, Name: 'Brasileirão Série A', CID: 21 }],
  Games: [{
    ID: 4632745,
    Comp: 113,
    STime: '29-07-2026 20:00',
    IsFinished: true,
    Active: false,
    NotPlaying: true,
    STID: 5,
    Comps: [
      { Name: 'Botafogo', SymbolicName: 'BOT' },
      { Name: 'Gremio', SymbolicName: 'GRE' },
    ],
  }],
});

assert.strictEqual(
  require('../scrapers/365-api').mobileGameStatus({
    IsFinished: true,
    Active: false,
    NotPlaying: true,
    STID: 5,
  }),
  'postponed'
);
assert.strictEqual(
  require('../scrapers/365-api').mobileGameStatus({
    IsFinished: true,
    Active: false,
    NotPlaying: true,
    STID: 119,
  }),
  'cancelled'
);

const postponedRows = parseGames(postponedPayload, {
  sportKey: 'football',
  targetDate: '2026-07-29',
  now: new Date('2026-07-28T12:00:00-03:00'),
});
assert.strictEqual(postponedRows.length, 1);
assert.strictEqual(postponedRows[0].home, 'Botafogo');
assert.strictEqual(postponedRows[0].away, 'Gremio');
assert.strictEqual(postponedRows[0].status, 'postponed');

const nextDayJerusalem = normalizeMobileApiPayload({
  Countries: [
    { ID: 18, Name: 'USA' },
    { ID: 21, Name: 'Ecuador' },
  ],
  Competitions: [
    { ID: 5663, Name: 'USL Championship', CID: 18 },
    { ID: 5062, Name: 'Liga Pro', CID: 21 },
  ],
  Games: [
    {
      ID: 2,
      Comp: 5663,
      STime: '04-07-2026 02:00',
      IsFinished: false,
      Active: false,
      Comps: [
        { Name: 'Loudoun United FC', SymbolicName: 'LOU' },
        { Name: 'Sporting JAX', SymbolicName: 'JAX' },
      ],
    },
    {
      ID: 3,
      Comp: 5062,
      STime: '04-07-2026 03:00',
      IsFinished: false,
      Active: false,
      Comps: [
        { Name: 'Independiente del Valle', SymbolicName: 'IDV' },
        { Name: 'Manta', SymbolicName: 'MAN' },
      ],
    },
  ],
});

const nextDayRows = parseGames(nextDayJerusalem, { sportKey: 'football', targetDate: '2026-07-03' });
assert.strictEqual(nextDayRows.length, 2);
assert.deepStrictEqual(
  nextDayRows.map(row => [row.home, row.away, row.time, row.dateKey]).sort(),
  [
    ['Independiente del Valle', 'Manta', '21:00', '2026-07-03'],
    ['Loudoun United FC', 'Sporting JAX', '20:00', '2026-07-03'],
  ].sort()
);

console.log('test-365-mobile-api: ok');
