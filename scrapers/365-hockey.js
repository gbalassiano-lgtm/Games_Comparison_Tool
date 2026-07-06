const { run365ApiScraper, SPORT_TYPE_IDS, formatApiError } = require('./365-api');

run365ApiScraper({
  sportKey: 'hockey',
  sportTypeId: SPORT_TYPE_IDS.hockey,
  outputFile: 'output/hockey/365_tomorrow_hockey_by_country.json',
}).catch(error => {
  console.error(`ERROR: ${formatApiError(error)}`);
  process.exit(1);
});
