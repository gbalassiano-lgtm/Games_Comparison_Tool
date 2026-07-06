const fs = require('fs');
const path = require('path');
const { filter365Grouped, filterFlashFlat } = require('./latam-filter');

const ROOT = path.join(__dirname, '..');

const FILE_NAMES = {
  football: {
    s365: '365_tomorrow_by_country.json',
    flash: 'flashscore_tomorrow_all_countries.json',
  },
  basketball: {
    s365: '365_tomorrow_basketball_by_country.json',
    flash: 'flashscore_tomorrow_basketball_all_countries.json',
  },
  hockey: {
    s365: '365_tomorrow_hockey_by_country.json',
    flash: 'flashscore_tomorrow_hockey_all_countries.json',
  },
  volleyball: {
    s365: '365_tomorrow_volleyball_by_country.json',
    flash: 'flashscore_tomorrow_volleyball_all_countries.json',
  },
  tennis: {
    s365: '365_tomorrow_tennis_by_country.json',
    flash: 'flashscore_tomorrow_tennis_all_countries.json',
  },
};

function count365Games(data = []) {
  return data.reduce((sum, group) => (
    sum + (group.competitions || []).reduce((inner, comp) => inner + (comp.matches?.length || 0), 0)
  ), 0);
}

function countFlashGames(data = []) {
  return data.length;
}

function filterLatamSport(sportKey) {
  const names = FILE_NAMES[sportKey];
  if (!names) throw new Error(`Unknown sport for LATAM filter: ${sportKey}`);

  const full365 = path.join(ROOT, 'output', sportKey, names.s365);
  const fullFlash = path.join(ROOT, 'output', sportKey, names.flash);
  const latamDir = path.join(ROOT, 'output', 'latam', sportKey);

  if (!fs.existsSync(full365)) throw new Error(`Missing 365 file: ${full365}`);
  if (!fs.existsSync(fullFlash)) throw new Error(`Missing Flash file: ${fullFlash}`);

  const data365 = JSON.parse(fs.readFileSync(full365, 'utf-8'));
  const dataFlash = JSON.parse(fs.readFileSync(fullFlash, 'utf-8'));
  const filtered365 = filter365Grouped(data365, sportKey);
  const filteredFlash = filterFlashFlat(dataFlash, sportKey);

  fs.mkdirSync(latamDir, { recursive: true });
  fs.writeFileSync(path.join(latamDir, names.s365), JSON.stringify(filtered365, null, 2), 'utf-8');
  fs.writeFileSync(path.join(latamDir, names.flash), JSON.stringify(filteredFlash, null, 2), 'utf-8');

  const summary = {
    sportKey,
    groups365: filtered365.length,
    games365: count365Games(filtered365),
    gamesFlash: countFlashGames(filteredFlash),
    outputDir: latamDir,
  };

  console.log(
    `LATAM ${sportKey}: 365=${summary.games365} games (${summary.groups365} groups) | Flash=${summary.gamesFlash} games`
  );

  return summary;
}

if (require.main === module) {
  const sportKey = process.argv[2];
  if (!sportKey) {
    console.error('Usage: node scrapers/filter-latam-sport.js <sportKey>');
    process.exit(1);
  }

  try {
    filterLatamSport(sportKey);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { FILE_NAMES, filterLatamSport };
