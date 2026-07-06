const { run365ApiScraper, SPORT_TYPE_IDS, formatApiError } = require('./365-api');

run365ApiScraper({
  sportKey: 'tennis',
  sportTypeId: SPORT_TYPE_IDS.tennis,
  outputFile: 'output/tennis/365_tomorrow_tennis_by_country.json',
}).catch(error => {
  console.error(`ERROR: ${formatApiError(error)}`);
  process.exit(1);
});
