const { run365ApiScraper, SPORT_TYPE_IDS, formatApiError } = require('./365-api');

run365ApiScraper({
  sportKey: 'basketball',
  sportTypeId: SPORT_TYPE_IDS.basketball,
  outputFile: 'output/basketball/365_tomorrow_basketball_by_country.json',
}).catch(error => {
  console.error(`ERROR: ${formatApiError(error)}`);
  process.exit(1);
});
