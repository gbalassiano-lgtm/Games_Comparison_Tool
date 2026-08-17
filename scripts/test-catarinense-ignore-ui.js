const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'ui.js'), 'utf8');

function noop() { return undefined; }
function stubEl() {
  return {
    addEventListener: noop,
    removeEventListener: noop,
    appendChild: noop,
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    style: {},
    dataset: {},
    querySelector: stubEl,
    querySelectorAll: () => [],
    setAttribute: noop,
    getAttribute: () => null,
    focus: noop,
    click: noop,
    closest: () => null,
    getBoundingClientRect: () => ({ top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }),
  };
}

const fakeDocument = {
  getElementById: () => stubEl(),
  querySelector: () => stubEl(),
  querySelectorAll: () => [],
  addEventListener: noop,
  removeEventListener: noop,
  createElement: () => stubEl(),
  body: stubEl(),
  documentElement: stubEl(),
};

const fakeWindow = {
  addEventListener: noop,
  removeEventListener: noop,
  location: { search: '', href: '', pathname: '/' },
  innerWidth: 1024,
  innerHeight: 768,
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  navigator: { language: 'pt-BR' },
  history: { replaceState: noop, pushState: noop },
};

const sandbox = {
  console,
  document: fakeDocument,
  window: fakeWindow,
  navigator: fakeWindow.navigator,
  localStorage: fakeWindow.localStorage,
  alert: (msg) => console.log('ALERT(suppressed):', msg),
  fetch: () => Promise.reject(new Error('fetch disabled in test sandbox')),
  URLSearchParams,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Promise,
  Intl,
  Date,
  Math,
  JSON,
  Array,
  Object,
  String,
  Number,
  Boolean,
  RegExp,
  Map,
  Set,
  encodeURIComponent,
  decodeURIComponent,
};
sandbox.globalThis = sandbox;
sandbox.window.document = fakeDocument;
sandbox.module = undefined;

vm.createContext(sandbox);

// ui.html loads lib/country-flags.js before ui.js, which populates
// window.CountryFlags.resolveScopeKey (used by normalizeRuleScope for Brazil/Brasil, etc.).
// Mirror that load order here so scope matching behaves like the real browser.
const countryFlagsCode = fs.readFileSync(path.join(root, 'lib', 'country-flags.js'), 'utf8');
try {
  vm.runInContext(countryFlagsCode, sandbox, { filename: 'lib/country-flags.js' });
} catch (e) {
  console.error('lib/country-flags.js load threw:', e.message);
}

try {
  vm.runInContext(code, sandbox, { filename: 'ui.js' });
} catch (e) {
  console.error('Top-level run threw (may be ok if after our target funcs):', e.message);
}

vm.runInContext(`
  globalOut = {
    rowIgnoredByRule: typeof rowIgnoredByRule !== 'undefined' ? rowIgnoredByRule : null,
    state: typeof state !== 'undefined' ? state : null,
  };
`, sandbox);

const { rowIgnoredByRule, state } = sandbox.globalOut;

if (!rowIgnoredByRule || !state) {
  console.error('FAIL | could not extract rowIgnoredByRule/state from ui.js sandbox');
  process.exit(1);
}

state.competitionRules = {
  football: {
    ignoreFlashOnly: [
      { scope: 'Brazil', competition: 'Catarinense 2', aliases: ['Catarinense - Serie B'] },
    ],
    ignore365Only: [],
  },
};

let failed = 0;
function assert(cond, msg) {
  if (!cond) { failed++; console.error('FAIL |', msg); }
  else console.log('OK   |', msg);
}

const rowFlashSide = { sport: 'football', country: 'Brasil', competitionFlash: 'Catarinense 2', type: 'onlyFlash' };
const row365Side = { sport: 'football', country: 'Brasil', competition365: 'Catarinense - Serie B', type: 'only365' };
const rowUnrelated = { sport: 'football', country: 'Brasil', competition365: 'Paulista Serie B', type: 'only365' };

assert(rowIgnoredByRule(rowFlashSide, null) === true, 'rowIgnoredByRule ignora lado Flash "Catarinense 2" direto');
assert(rowIgnoredByRule(row365Side, null) === true, 'rowIgnoredByRule ignora lado 365 "Catarinense - Serie B" via alias');
assert(rowIgnoredByRule(rowUnrelated, null) === false, 'rowIgnoredByRule NAO ignora competicao nao relacionada');

state.competitionRules.hockey = {
  ignoreFlashOnly: [{ scope: 'NEW ZEALAND', competition: 'NZIHL' }],
  ignore365Only: [],
};
const rowHockeyMatched = {
  sport: 'hockey',
  country: 'New Zealand',
  competition: 'NZIHL',
  competition365: 'NZIHL',
  competitionFlash: 'NZIHL - Play Offs',
  type: 'matched',
};
const rowHockeyOnlyFlash = {
  sport: 'hockey',
  country: 'New Zealand',
  competitionFlash: 'NZIHL',
  type: 'onlyFlash',
};
assert(rowIgnoredByRule(rowHockeyMatched, null) === false, 'rowIgnoredByRule NAO esconde jogos sincronizados');
assert(rowIgnoredByRule(rowHockeyOnlyFlash, null) === true, 'rowIgnoredByRule ainda esconde só-Flash ignorado');

if (failed) { console.error(`\n${failed} assertion(s) failed.`); process.exit(1); }
console.log('\ntest-catarinense-ignore-ui: ok');
