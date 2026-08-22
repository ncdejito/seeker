import 'dotenv/config';

/** Sends one message to the user's configured Telegram chat. Requires TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID. */
export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set in .env');
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });

  if (!res.ok) {
    throw new Error(`Telegram send failed: ${res.status} ${await res.text()}`);
  }
}

// CLI usage: node dist/scripts/send-telegram.js "message text"
if (require.main === module) {
  const text = process.argv.slice(2).join(' ');
  if (!text) {
    console.error('Usage: node dist/scripts/send-telegram.js "message text"');
    process.exit(1);
  }
  sendTelegramMessage(text)
    .then(() => console.log('Sent.'))
    .catch(err => {
      console.error(err.message);
      process.exit(1);
    });
}
