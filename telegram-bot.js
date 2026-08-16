const { TelegramBot } = require('node-telegram-bot-api');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BOT_API_TOKEN = process.env.PORTAL_BOT_TOKEN;
const API_BASE = process.env.PORTAL_API_URL || 'http://localhost:3000';

// Optional: comma-separated Telegram chat ids allowed to add links.
// Leave unset to allow anyone who knows the bot to add links.
const ALLOWED_CHAT_IDS = (process.env.TELEGRAM_ALLOWED_CHAT_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

if (!TELEGRAM_TOKEN) {
  console.error('Missing TELEGRAM_BOT_TOKEN env var. Get one from @BotFather on Telegram.');
  process.exit(1);
}
if (!BOT_API_TOKEN) {
  console.error('Missing PORTAL_BOT_TOKEN env var. Set the same value as the server\'s PORTAL_BOT_TOKEN.');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const URL_REGEX = /https?:\/\/\S+/i;

bot.on('polling_error', err => console.error('Polling error:', err.message));

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  console.log(`Message from chat id ${chatId}`);

  if (ALLOWED_CHAT_IDS.length && !ALLOWED_CHAT_IDS.includes(String(chatId))) {
    return; // Silently ignore messages from chats that aren't on the allow list
  }

  const match = (msg.text || '').match(URL_REGEX);
  if (!match) {
    bot.sendMessage(chatId, 'Mandami un link da salvare nel portal.');
    return;
  }

  const url = match[0];
  try {
    const response = await fetch(`${API_BASE}/api/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Bot-Token': BOT_API_TOKEN
      },
      body: JSON.stringify({ url })
    });

    if (response.ok) {
      const link = await response.json();
      bot.sendMessage(chatId, `Aggiunto: ${link.title}`);
    } else {
      const err = await response.json().catch(() => ({}));
      bot.sendMessage(chatId, `Errore aggiunta link: ${err.error || response.status}`);
    }
  } catch (err) {
    console.error('Error adding link:', err.message);
    bot.sendMessage(chatId, 'Errore nel salvataggio del link.');
  }
});

console.log('Telegram bot avviato (polling)');
