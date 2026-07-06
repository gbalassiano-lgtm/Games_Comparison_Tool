require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { filterLatamSport } = require('./scrapers/filter-latam-sport');

function runNodeScript(script, label, env = {}) {
  return new Promise((resolve, reject) => {
    const file = path.join(__dirname, script);

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`▶ [${label}] Executando: ${script}`);
    console.log(`${'─'.repeat(60)}`);

    const child = spawn(process.execPath, [file], {
      cwd: __dirname,
      env: { ...process.env, ...env },
      stdio: 'inherit',
      shell: false,
    });

    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`${script} saiu com código ${code}`));
    });
  });
}

async function processSport(sport, env) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🌎 LATAM | ${sport.label}`);
  console.log(`${'═'.repeat(60)}`);

  try {
    console.log(`\n⚡ Rodando scrapers de ${sport.label} em paralelo...\n`);
    await Promise.all([
      runNodeScript(sport.scraper365, `${sport.label} | 365`, env),
      runNodeScript(sport.scraperFlash, `${sport.label} | Flash`, env),
    ]);

    console.log(`\n🌎 Filtrando países LATAM para ${sport.label}...`);
    const filtered = filterLatamSport(sport.key);

    console.log(`\n🔍 Rodando compare LATAM de ${sport.label}...\n`);
    delete require.cache[require.resolve('./compare.js')];
    const { runCompareLatam } = require('./compare.js');
    await runCompareLatam(sport.key);

    console.log(`✅ ${sport.label} LATAM finalizado`);
    return { ...filtered, label: sport.label, erro: false };
  } catch (error) {
    console.error(`\n🚨 Erro em ${sport.label} LATAM: ${error.message}`);
    return {
      sportKey: sport.key,
      label: sport.label,
      games365: 0,
      gamesFlash: 0,
      erro: true,
      error: error.message,
    };
  }
}

(async () => {
  const start = Date.now();
  const env = {
    SCAN_DATE: process.env.SCAN_DATE || process.env.TARGET_DATE,
    TARGET_DATE: process.env.TARGET_DATE || process.env.SCAN_DATE,
  };

  console.log('\n🌎 Pipeline LATAM iniciado:', new Date().toLocaleString('pt-BR'));
  if (env.TARGET_DATE) console.log(`📅 Data alvo: ${env.TARGET_DATE}`);

  const sports = [
    { key: 'football', label: 'Futebol', scraper365: 'scrapers/365-football.js', scraperFlash: 'scrapers/flashscore-football.js' },
    { key: 'basketball', label: 'Basquete', scraper365: 'scrapers/365-basketball.js', scraperFlash: 'scrapers/flashscore-basketball.js' },
  ];

  const stats = [];
  for (const sport of sports) {
    stats.push(await processSport(sport, env));
  }

  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ Pipeline LATAM concluído em ${elapsed} minutos`);

  const summaryFile = path.join(__dirname, 'output', 'latam', 'pipeline_summary.json');
  fs.mkdirSync(path.dirname(summaryFile), { recursive: true });
  fs.writeFileSync(summaryFile, JSON.stringify({ finishedAt: new Date().toISOString(), stats }, null, 2), 'utf-8');
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});
