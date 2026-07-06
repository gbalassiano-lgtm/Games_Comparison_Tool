const { run365ApiScraper, SPORT_TYPE_IDS, formatApiError } = require('./365-api');

run365ApiScraper({
  sportKey: 'baseball',
  sportTypeId: SPORT_TYPE_IDS.baseball,
  outputFile: 'output/baseball_usa/365_tomorrow_baseball_usa_by_country.json',
  filterGrouped: require('./basketball-usa-filter').filter365Grouped,
  logLabel: '365Scores API (USA baseball)',
}).catch(error => {
  console.error(`ERROR: ${formatApiError(error)}`);
  process.exit(1);
});
