const { run365ApiScraper, SPORT_TYPE_IDS, formatApiError } = require('./365-api');

run365ApiScraper({
  sportKey: 'volleyball',
  sportTypeId: SPORT_TYPE_IDS.volleyball,
  outputFile: 'output/volleyball/365_tomorrow_volleyball_by_country.json',
}).catch(error => {
  console.error(`ERROR: ${formatApiError(error)}`);
  process.exit(1);
});
