const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IMPORTS = path.join(ROOT, 'config', 'imports');
const OUT_DIR = path.join(ROOT, 'config');

const SPORT_FILES = {
  football: {
    xlsx: 'football_competitions_365scores.xlsx',
    out: 'football_365_competitions.json',
    legacy: path.join(OUT_DIR, 'football_365_competitions.json'),
  },
  basketball: {
    xlsx: 'basketball_competitions_365scores.xlsx',
    out: 'basketball_365_competitions.json',
    legacy: null,
  },
  hockey: {
    xlsx: 'hockey.xlsx',
    out: 'hockey_365_competitions.json',
    legacy: null,
  },
  tennis: {
    xlsx: 'tenis.xlsx',
    out: 'tennis_365_competitions.json',
    legacy: null,
  },
  baseball: {
    xlsx: 'beisebol.xlsx',
    out: 'baseball_365_competitions.json',
    legacy: null,
  },
  american_football: {
    xlsx: 'futebol americano.xlsx',
    out: 'american_football_365_competitions.json',
    legacy: null,
  },
};

const JUNK_PATTERNS = [
  /testfake/i,
  /testcountry/i,
  /\badi\s*cup\b/i,
  /\bfifa\s*ranking/i,
  /\bwomen\s*fifa\s*rankings/i,
  /\btech\s*a\s*(win|dream)\b/i,
  /\bstay\s*home\b/i,
  /\bfms\s+(mexico|caribe)\b/i,
  /\bcopa\s*365\b/i,
  /\bfifa\s*copa\s*365\b/i,
];

function cellVal(v) {
  if (v == null) return '';
  if (typeof v === 'object' && v.text != null) return String(v.text).trim();
  if (typeof v === 'object' && v.result != null) return String(v.result).trim();
  if (v instanceof Date) return v.toISOString();
  return String(v).trim();
}

function normKey(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function isJunk(row) {
  const hay = `${row.competition} ${row.country} ${row.id}`;
  return JUNK_PATTERNS.some(re => re.test(hay));
}

function pickColumns(headers) {
  const norm = headers.map(h => normKey(h).replace(/[^a-z0-9]/g, ''));
  const find = (...candidates) => {
    for (const c of candidates) {
      const i = norm.indexOf(c);
      if (i !== -1) return i;
    }
    for (let i = 0; i < norm.length; i++) {
      if (candidates.some(c => norm[i].includes(c))) return i;
    }
    return -1;
  };

  const idIdx = find('id', 'competitionid', 'compid', 'leagueid');
  const nameIdx = find('competition', 'competitionname', 'name', 'league', 'leaguename');
  const countryIdx = find('country', 'nation', 'region', 'scope');

  if (idIdx === -1 || nameIdx === -1) {
    throw new Error(`Could not detect columns from headers: ${JSON.stringify(headers)}`);
  }

  return { idIdx, nameIdx, countryIdx };
}

async function readSpreadsheet(filePath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(filePath);
  const ws = wb.worksheets[0];
  const rawRows = [];
  ws.eachRow((row, rowNumber) => {
    const vals = row.values.slice(1).map(cellVal);
    rawRows.push({ rowNumber, vals });
  });
  if (!rawRows.length) throw new Error(`Empty sheet: ${filePath}`);

  const headers = rawRows[0].vals;
  const { idIdx, nameIdx, countryIdx } = pickColumns(headers);

  const rows = [];
  for (const { rowNumber, vals } of rawRows.slice(1)) {
    const id = String(vals[idIdx] ?? '').trim();
    const competition = String(vals[nameIdx] ?? '').trim();
    const country = countryIdx >= 0 ? String(vals[countryIdx] ?? '').trim() : '';
    if (!id && !competition) continue;
    rows.push({ rowNumber, id, competition, country });
  }

  return { headers, sheetName: ws.name, rows };
}

function dedupeRows(rows) {
  const byId = new Map();
  const duplicateIds = [];

  for (const row of rows) {
    const key = row.id || `__non_id__:${normKey(row.country)}|||${normKey(row.competition)}`;
    if (byId.has(key)) {
      duplicateIds.push({ id: row.id, existing: byId.get(key), duplicate: row });
      continue;
    }
    byId.set(key, row);
  }

  return { rows: [...byId.values()], duplicateIds };
}

function toCatalogEntry(row) {
  return {
    id: String(row.id),
    competition: row.competition,
    country: row.country || 'Unknown',
  };
}

function compareLegacy(legacyPath, rows) {
  if (!legacyPath || !fs.existsSync(legacyPath)) return null;
  const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
  const list = Array.isArray(legacy) ? legacy : Object.values(legacy);
  const legacyIds = new Set(list.map(e => String(e.id)));
  const sheetIds = new Set(rows.map(r => String(r.id)).filter(Boolean));
  const overlap = [...sheetIds].filter(id => legacyIds.has(id));
  const newInSheet = [...sheetIds].filter(id => !legacyIds.has(id));
  const inLegacyNotSheet = [...legacyIds].filter(id => !sheetIds.has(id));
  return {
    legacyCount: list.length,
    sheetUniqueIds: sheetIds.size,
    overlapCount: overlap.length,
    newInSpreadsheetCount: newInSheet.length,
    inLegacyNotSpreadsheetCount: inLegacyNotSheet.length,
    inLegacyNotSpreadsheetSample: inLegacyNotSheet.slice(0, 20),
  };
}

function buildReport(sport, parsed, deduped, catalog, comparison) {
  const countries = new Set(catalog.map(r => r.country).filter(Boolean));
  const nameCounts = new Map();
  for (const r of catalog) {
    const k = normKey(r.competition);
    nameCounts.set(k, (nameCounts.get(k) || 0) + 1);
  }
  const duplicateNames = [...nameCounts.entries()]
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }));

  const junkRemoved = deduped.rows.filter(isJunk);

  return {
    sport,
    source: SPORT_FILES[sport].xlsx,
    sheetName: parsed.sheetName,
    headers: parsed.headers,
    rawRowCount: parsed.rows.length,
    duplicateIdGroups: deduped.duplicateIds.length,
    catalogCount: catalog.length,
    junkRemovedCount: junkRemoved.length,
    uniqueCountries: countries.size,
    duplicateCompetitionNames: duplicateNames,
    legacyComparison: comparison,
    junkSample: junkRemoved.slice(0, 15).map(r => ({ id: r.id, competition: r.competition, country: r.country })),
    sample: catalog.slice(0, 8),
  };
}

async function processSport(sport) {
  const cfg = SPORT_FILES[sport];
  const filePath = path.join(IMPORTS, cfg.xlsx);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing spreadsheet: ${filePath}`);
  }

  const parsed = await readSpreadsheet(filePath);
  const deduped = dedupeRows(parsed.rows);
  const clean = deduped.rows.filter(r => !isJunk(r));
  const catalog = clean
    .map(toCatalogEntry)
    .sort((a, b) => {
      const country = a.country.localeCompare(b.country);
      if (country !== 0) return country;
      return a.competition.localeCompare(b.competition);
    });

  const comparison = compareLegacy(cfg.legacy, clean);

  const outPath = path.join(OUT_DIR, cfg.out);
  fs.writeFileSync(outPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  const report = buildReport(sport, parsed, deduped, catalog, comparison);
  report.outputFile = cfg.out;
  return report;
}

async function main() {
  const reports = {};
  for (const sport of Object.keys(SPORT_FILES)) {
    reports[sport] = await processSport(sport);
  }

  const reportPath = path.join(OUT_DIR, '365_competitions_import_report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), reports }, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ reports, reportPath }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
