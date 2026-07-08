/**
 * One-off: send both Asana→Telegram reminder message types (before + due).
 * Does not enable ASANA_REMINDER_ENABLED polling.
 */
require('dotenv').config();

const telegram = require('../lib/telegram');
const { buildReminderMessage } = require('../lib/asana-reminders');

async function main() {
  if (!telegram.isConfigured()) {
    console.error('❌ Telegram não configurado. Defina TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID no .env');
    process.exit(1);
  }

  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  const sampleTask = {
    gid: 'test-telegram-gid',
    name: '[TESTE] Daily Futebol',
    dueAt: inOneHour.toISOString(),
    completed: false,
    mapped: true,
    assignee: { name: 'Teste' },
    sportKey: 'football',
    suggestedScanDate: now.toISOString().slice(0, 10),
    permalink: 'https://app.asana.com/0/0/0',
  };

  const beforeMsg = buildReminderMessage(sampleTask, { kind: 'before', minutesBefore: 60 });
  const dueMsg = buildReminderMessage(
    { ...sampleTask, dueAt: now.toISOString() },
    { kind: 'due' }
  );

  console.log('📤 Enviando mensagem 1/2 (antes do vencimento)...');
  console.log(beforeMsg);
  await telegram.sendTelegramMessage(beforeMsg);
  console.log('✅ Mensagem "before" enviada\n');

  console.log('📤 Enviando mensagem 2/2 (vencida)...');
  console.log(dueMsg);
  await telegram.sendTelegramMessage(dueMsg);
  console.log('✅ Mensagem "due" enviada\n');

  console.log('🎉 Teste Telegram ok — confira o chat.');
}

main().catch((err) => {
  console.error('❌ Falha no teste Telegram:', err.message || err);
  process.exit(1);
});
