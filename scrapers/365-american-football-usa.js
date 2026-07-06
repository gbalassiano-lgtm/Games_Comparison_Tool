const { run365ApiScraper, SPORT_TYPE_IDS, formatApiError } = require('./365-api');

run365ApiScraper({
  sportKey: 'americanFootball',
  sportTypeId: SPORT_TYPE_IDS.americanFootball,
  outputFile: 'output/american_football_usa/365_tomorrow_american_football_usa_by_country.json',
  filterGrouped: require('./basketball-usa-filter').filter365Grouped,
  logLabel: '365Scores API (USA american football)',
}).catch(error => {
  console.error(`ERROR: ${formatApiError(error)}`);
  process.exit(1);
});
