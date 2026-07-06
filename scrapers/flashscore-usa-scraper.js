const fs = require('fs');
const path = require('path');
const { exitScript } = require('./launch-browser');
const { logStep } = require('./flashscore-shared');
const { filterFlashFlat } = require('./basketball-usa-filter');

function createUsaFlashScraper({ scrapeFn, outputDirName, outputFileName, logLabel }) {
  return async function runUsaFlashScraper() {
    const outputDir = path.join(__dirname, '..', 'output', outputDirName);
    const outputFile = path.join(outputDir, outputFileName);
    fs.mkdirSync(outputDir, { recursive: true });

    logStep(`Starting ${logLabel}`);
    const results = await scrapeFn({ writeFile: false });
    const filtered = filterFlashFlat(results);

    if (!filtered.length) {
      if (!results.length) {
        logStep(`WARN: ${logLabel} found 0 games for the target date`);
      } else {
        logStep(`WARN: ${logLabel} found ${results.length} games but USA filter kept 0`);
      }
    }

    fs.writeFileSync(outputFile, JSON.stringify(filtered, null, 2), 'utf-8');
    logStep(`TOTAL DE JOGOS USA: ${filtered.length}`);
    logStep(`Arquivo salvo: ${outputFile}`);
  };
}

function runUsaFlashScraperMain(run) {
  run()
    .then(() => {
      logStep('Scraper finished.');
      exitScript(0);
    })
    .catch(error => {
      logStep(`ERROR: ${error.message}`);
      exitScript(1);
    });
}

module.exports = {
  createUsaFlashScraper,
  runUsaFlashScraperMain,
};
