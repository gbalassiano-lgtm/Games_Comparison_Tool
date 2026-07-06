const { run365ApiScraper, SPORT_TYPE_IDS, formatApiError } = require('./365-api');

run365ApiScraper({
  sportKey: 'basketball',
  sportTypeId: SPORT_TYPE_IDS.basketball,
  outputFile: 'output/basketball_usa/365_tomorrow_basketball_usa_by_country.json',
  filterGrouped: require('./basketball-usa-filter').filter365Grouped,
  logLabel: '365Scores API (USA basketball)',
}).catch(error => {
  console.error(`ERROR: ${formatApiError(error)}`);
  process.exit(1);
});
