const { createUsaFlashScraper, runUsaFlashScraperMain } = require('./flashscore-usa-scraper');
const { scrapeFlashscoreAmericanFootball } = require('./flashscore-american-football');

const run = createUsaFlashScraper({
  scrapeFn: scrapeFlashscoreAmericanFootball,
  outputDirName: 'american_football_usa',
  outputFileName: 'flashscore_tomorrow_american_football_usa.json',
  logLabel: 'Flashscore american football scraper (USA filter)',
});

if (require.main === module) {
  runUsaFlashScraperMain(run);
}

module.exports = { run };
