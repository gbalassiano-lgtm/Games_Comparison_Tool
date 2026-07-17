require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function runNodeScript(script, label) {
  return new Promise((resolve, reject) => {
    const file = path.join(__dirname, script);

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`▶ [${label}] Executando: ${script}`);
    console.log(`${'─'.repeat(60)}`);

    const child = spawn(process.execPath, [file], {
      cwd: __dirname,
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

// ─────────────────────────────────────────────────────────────────
// Roda o shared_competitions para um esporte específico
// ─────────────────────────────────────────────────────────────────
function buildMemory(sportKey, label) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`🧠 [${label}] Atualizando memória de competições...`);
    console.log(`${'─'.repeat(60)}`);

    const file = path.join(__dirname, 'shared_competitions.js');
    const child = spawn(process.execPath, [file, sportKey], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: false,
    });

    child.on('error', reject);

    child.on('close', code => {
      if (code === 0) {
        console.log(`✅ Memória de ${label} atualizada`);
        resolve();
      } else {
        // Não quebra o pipeline se a memória falhar
        console.warn(`⚠️  shared_competitions saiu com código ${code} — continuando mesmo assim`);
        resolve();
      }
    });
  });
}

async function sendResumoPipeline(stats) {
  // UI scans set UI_SCAN_MODE=1 so compare.js skips Telegram; this must too.
  if (process.env.UI_SCAN_MODE === '1') {
    console.log('\n📤 Telegram resumo ignorado (modo UI).');
    return;
  }
  if (!BOT_TOKEN || !CHAT_ID) return;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const d = `${String(tomorrow.getDate()).padStart(2, '0')}/${String(tomorrow.getMonth() + 1).padStart(2, '0')}/${tomorrow.getFullYear()}`;

  let msg = `🗓 *Resumo Geral — Auditoria ${d}*\n\n`;

  for (const row of stats) {
    if (row.erro) {
      msg += `*${row.label}*\n  🚨 Erro no pipeline\n\n`;
      continue;
    }

    msg +=
      `*${row.label}*\n` +
      `  365: ${row.total365} jogos\n` +
      `  🌸 Status: ${row.divStatus}\n` +
      `  🟤 Horário: ${row.divHorario}\n` +
      `  🟢 Nome: ${row.divNome}\n\n`;
  }

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: msg,
      parse_mode: 'Markdown',
    }),
  });

  if (res.ok) console.log('\n✅ Telegram: resumo geral enviado');
  else console.error('❌ Telegram erro:', await res.text());
}

function count365Games(raw365) {
  return raw365.reduce(
    (sumCountries, countryOrGroup) =>
      sumCountries +
      (countryOrGroup.competitions || []).reduce(
        (sumCompetitions, comp) => sumCompetitions + (comp.matches?.length || 0),
        0
      ),
    0
  );
}

async function processSport(sport, JSON_PATHS) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🏅 Iniciando: ${sport.label}`);
  console.log(`${'═'.repeat(60)}`);

  try {
    // 1️⃣ Scrapers em paralelo
    console.log(`\n⚡ Rodando scrapers de ${sport.label} em paralelo...\n`);
    await Promise.all([
      runNodeScript(sport.scraper365, `${sport.label} | 365`),
      runNodeScript(sport.scraperFlash, `${sport.label} | Flash`),
    ]);
    console.log(`\n✅ Scrapers de ${sport.label} concluídos`);

    // 2️⃣ Atualiza memória de competições compartilhadas (UI já atualiza no compare)
    if (process.env.UI_SCAN_MODE !== '1') {
      await buildMemory(sport.key, sport.label);
    } else {
      console.log(`\n🧠 Memória de ${sport.label} ignorada (modo UI).`);
    }

    // 3️⃣ Compare
    console.log(`\n🔍 Rodando compare de ${sport.label}...\n`);
    const targetDate = String(process.env.TARGET_DATE || process.env.SCAN_DATE || '').trim();
    console.log(`📅 TARGET_DATE=${targetDate || '(default tomorrow)'}`);
    const { runCompare } = require('./compare.js');
    const allResults = await runCompare(sport.key);

    const snapshotPath = path.join(__dirname, 'output', sport.key, 'compare_snapshot.json');
    fs.writeFileSync(snapshotPath, JSON.stringify({
      targetDate: /^\d{4}-\d{2}-\d{2}$/.test(targetDate) ? targetDate : '',
      savedAt: new Date().toISOString(),
      results: allResults,
    }));

    const divStatus = allResults.reduce(
      (s, r) => s + (r.result.divergencias_status?.length || 0), 0
    );
    const divHorario = allResults.reduce(
      (s, r) => s + (r.result.divergencias_horario?.length || 0), 0
    );
    const divNome = allResults.reduce(
      (s, r) => s + (r.result.divergencias_nome?.length || 0), 0
    );

    const gamesPath365 = path.join(__dirname, 'output', sport.key, JSON_PATHS[sport.key].s365);
    const raw365 = fs.existsSync(gamesPath365)
      ? JSON.parse(fs.readFileSync(gamesPath365, 'utf-8'))
      : [];

    console.log(`✅ ${sport.label} finalizado`);

    return {
      sport   : sport.key,
      label   : sport.label,
      total365: count365Games(raw365),
      divStatus,
      divHorario,
      divNome,
      erro    : false,
    };
  } catch (e) {
    console.error(`\n🚨 Erro em ${sport.label}: ${e.message}`);
    return {
      sport   : sport.key,
      label   : sport.label,
      total365: 0,
      divStatus : 0,
      divHorario: 0,
      divNome   : 0,
      erro      : true,
    };
  }
}

(async () => {
  const start = Date.now();
  console.log('\n🚀 Pipeline iniciado:', new Date().toLocaleString('pt-BR'));
  console.log('⚙️  Modo: 1 esporte por vez | 2 scrapers em paralelo | memória atualizada antes do compare');

  const sports = [
    { key: 'football',   label: 'Futebol',  scraper365: 'scrapers/365-football.js',    scraperFlash: 'scrapers/flashscore-football.js'    },
    { key: 'basketball', label: 'Basquete', scraper365: 'scrapers/365-basketball.js',  scraperFlash: 'scrapers/flashscore-basketball.js'  },
    { key: 'hockey',     label: 'Hockey',   scraper365: 'scrapers/365-hockey.js',      scraperFlash: 'scrapers/flashscore-hockey.js'      },
    { key: 'volleyball', label: 'Vôlei',    scraper365: 'scrapers/365-volleyball.js',  scraperFlash: 'scrapers/flashscore-volleyball.js'  },
    { key: 'tennis',     label: 'Tênis',    scraper365: 'scrapers/365-tennis.js',      scraperFlash: 'scrapers/flashscore-tennis.js'      },
  ];

  const JSON_PATHS = {
    football  : { s365: '365_tomorrow_by_country.json',              flash: 'flashscore_tomorrow_all_countries.json'              },
    basketball: { s365: '365_tomorrow_basketball_by_country.json',   flash: 'flashscore_tomorrow_basketball_all_countries.json'   },
    hockey    : { s365: '365_tomorrow_hockey_by_country.json',       flash: 'flashscore_tomorrow_hockey_all_countries.json'       },
    volleyball: { s365: '365_tomorrow_volleyball_by_country.json',   flash: 'flashscore_tomorrow_volleyball_all_countries.json'   },
    tennis    : { s365: '365_tomorrow_tennis_by_country.json',       flash: 'flashscore_tomorrow_tennis_all_countries.json'       },
  };

  const stats = [];
  for (const sport of sports) {
    const result = await processSport(sport, JSON_PATHS);
    stats.push(result);
  }

  const elapsed = ((Date.now() - start) / 1000 / 60).toFixed(1);
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ Pipeline concluído em ${elapsed} minutos`);

  await sendResumoPipeline(stats);
})();