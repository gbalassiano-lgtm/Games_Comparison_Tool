const assert = require('assert');
const path = require('path');

process.chdir(path.join(__dirname, '..'));

delete require.cache[require.resolve('../server.js')];
delete require.cache[require.resolve('../compare.js')];

const { normalizeCompTerm } = require('../server.js');
const { isCompKnownShared } = require('../compare.js');

assert.strictEqual(
  normalizeCompTerm('LNB 2 - Play Offs', 'basketball'),
  normalizeCompTerm('LNB 2', 'basketball'),
  'Play Offs suffix should normalize to the same competition term as LNB 2'
);

assert.strictEqual(
  normalizeCompTerm('LNB 2 - Play Out', 'basketball'),
  normalizeCompTerm('LNB 2', 'basketball'),
  'Play Out suffix should normalize to the same competition term as LNB 2'
);

assert.strictEqual(
  isCompKnownShared('basketball', 'LNB 2 - Play Offs', 'flash', 'Chile'),
  true,
  'LNB 2 - Play Offs should be known as Chile LNB 2 via shared_competitions'
);

assert.strictEqual(
  isCompKnownShared('basketball', 'LNB 2 - Play Out', 'flash', 'Chile'),
  true,
  'LNB 2 - Play Out should be known as Chile LNB 2 via shared_competitions'
);

console.log('test-lnb2-shared-competition: ok');
