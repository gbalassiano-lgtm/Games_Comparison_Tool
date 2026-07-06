const fs = require('fs');
const path = require('path');
const { exitScript } = require('./launch-browser');
const { logStep } = require('./flashscore-shared');
const { scrapeFlashscoreBasketball } = require('./flashscore-basketball');
const { filterFlashFlat } = require('./basketball-usa-filter');

async function runUsaBasketballFlashScraper() {
  const outputDir = path.join(__dirname, '..', 'output', 'basketball_usa');
  const outputFile = path.join(outputDir, 'flashscore_tomorrow_basketball_usa.json');
  fs.mkdirSync(outputDir, { recursive: true });

  logStep('Starting Flashscore basketball scraper (USA filter)');
  const results = await scrapeFlashscoreBasketball({ writeFile: false });
  const filtered = filterFlashFlat(results);

  fs.writeFileSync(outputFile, JSON.stringify(filtered, null, 2), 'utf-8');
  logStep(`TOTAL DE JOGOS USA: ${filtered.length}`);
  logStep(`Arquivo salvo: ${outputFile}`);
}

runUsaBasketballFlashScraper()
  .then(() => {
    logStep('Scraper finished.');
    exitScript(0);
  })
  .catch(error => {
    logStep(`ERROR: ${error.message}`);
    exitScript(1);
  });
