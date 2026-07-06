const { createUsaFlashScraper, runUsaFlashScraperMain } = require('./flashscore-usa-scraper');
const { scrapeFlashscoreBaseball } = require('./flashscore-baseball');

const run = createUsaFlashScraper({
  scrapeFn: scrapeFlashscoreBaseball,
  outputDirName: 'baseball_usa',
  outputFileName: 'flashscore_tomorrow_baseball_usa.json',
  logLabel: 'Flashscore baseball scraper (USA filter)',
});

if (require.main === module) {
  runUsaFlashScraperMain(run);
}

module.exports = { run };
