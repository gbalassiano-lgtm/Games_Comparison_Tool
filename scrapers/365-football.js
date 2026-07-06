const { run365ApiScraper, SPORT_TYPE_IDS, formatApiError } = require('./365-api');

run365ApiScraper({
  sportKey: 'football',
  sportTypeId: SPORT_TYPE_IDS.football,
  outputFile: 'output/football/365_tomorrow_by_country.json',
}).catch(error => {
  console.error(`ERROR: ${formatApiError(error)}`);
  process.exit(1);
});
