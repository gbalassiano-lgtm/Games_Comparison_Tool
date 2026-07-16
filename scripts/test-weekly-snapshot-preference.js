const assert = require('assert');
const { shouldReplaceWeeklySnapshot } = require('../server');

assert.strictEqual(
  shouldReplaceWeeklySnapshot(null, { stamp: 'a', dedicated: false }),
  true
);

assert.strictEqual(
  shouldReplaceWeeklySnapshot(
    { stamp: '2026-07-15T18:00:00.000Z|1', dedicated: true },
    { stamp: '2026-07-16T15:00:00.000Z|2', dedicated: false }
  ),
  true,
  'newer all scan must replace older dedicated scan'
);

assert.strictEqual(
  shouldReplaceWeeklySnapshot(
    { stamp: '2026-07-16T15:00:00.000Z|2', dedicated: false },
    { stamp: '2026-07-15T18:00:00.000Z|1', dedicated: true }
  ),
  false,
  'older dedicated must not replace newer all scan'
);

assert.strictEqual(
  shouldReplaceWeeklySnapshot(
    { stamp: '2026-07-16T15:00:00.000Z|2', dedicated: false },
    { stamp: '2026-07-16T15:00:00.000Z|2', dedicated: true }
  ),
  true,
  'dedicated wins on equal stamp'
);

assert.strictEqual(
  shouldReplaceWeeklySnapshot(
    { stamp: '2026-07-16T15:00:00.000Z|2', dedicated: true },
    { stamp: '2026-07-16T15:00:00.000Z|2', dedicated: false }
  ),
  false
);

console.log('test-weekly-snapshot-preference: ok');
