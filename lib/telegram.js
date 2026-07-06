const fetch = require('node-fetch');

function getBotToken() {
  return String(process.env.TELEGRAM_BOT_TOKEN || '').trim();
}

function getChatId() {
  return String(process.env.TELEGRAM_CHAT_ID || '').trim();
}

function isConfigured() {
  return Boolean(getBotToken() && getChatId());
}

async function sendTelegramMessage(text, { parseMode = 'Markdown' } = {}) {
  const token = getBotToken();
  const chatId = getChatId();
  if (!token || !chatId) {
    throw new Error('Telegram is not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env');
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: String(text || ''),
      parse_mode: parseMode,
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Telegram API error (${response.status})`);
  }

  return response.json();
}

module.exports = {
  isConfigured,
  sendTelegramMessage,
};
