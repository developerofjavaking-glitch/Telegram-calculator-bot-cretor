import {
  safeEvaluate,
  getCalculatorKeyboard,
  formatCalculatorMessage,
} from './calculator.js';
import { logger } from './logger.js';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

export interface BotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

// Memory store for active inline calculator sessions
// key: `${chatId}:${messageId}` -> current expression string
const calculatorSessions = new Map<string, { expr: string; lastResult?: string; updatedAt: number }>();

// Cleanup stale sessions after 1 hour
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of calculatorSessions.entries()) {
    if (now - session.updatedAt > 3600000) {
      calculatorSessions.delete(key);
    }
  }
}, 300000);

export async function fetchTelegramApi(token: string, method: string, payload?: any) {
  const url = `${TELEGRAM_API_BASE}/bot${token}/${method}`;
  const options: RequestInit = {
    method: payload ? 'POST' : 'GET',
    headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
  };

  const response = await fetch(url, options);
  const data = await response.json();
  return data;
}

export async function getBotInfo(token: string): Promise<{ ok: boolean; result?: BotInfo; description?: string }> {
  try {
    return await fetchTelegramApi(token, 'getMe');
  } catch (err: any) {
    return { ok: false, description: err?.message || 'Failed to connect to Telegram API' };
  }
}

export async function deleteBotWebhook(token: string): Promise<{ ok: boolean; result?: boolean; description?: string }> {
  try {
    return await fetchTelegramApi(token, 'deleteWebhook', { drop_pending_updates: false });
  } catch (err: any) {
    return { ok: false, description: err?.message || 'Failed to delete webhook' };
  }
}

export async function sendTelegramMessage(token: string, chatId: number | string, text: string, replyMarkup?: any) {
  try {
    return await fetchTelegramApi(token, 'sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      reply_markup: replyMarkup,
    });
  } catch (err: any) {
    logger.addLog('telegram', 'error', `Failed to send message to chat ${chatId}: ${err?.message || err}`);
    console.error('Error sending Telegram message:', err);
  }
}

export async function editTelegramMessage(
  token: string,
  chatId: number | string,
  messageId: number,
  text: string,
  replyMarkup?: any
) {
  try {
    return await fetchTelegramApi(token, 'editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'Markdown',
      reply_markup: replyMarkup,
    });
  } catch (err: any) {
    console.error('Error editing Telegram message:', err);
  }
}

export async function answerTelegramCallbackQuery(token: string, callbackQueryId: string, text?: string) {
  try {
    return await fetchTelegramApi(token, 'answerCallbackQuery', {
      callback_query_id: callbackQueryId,
      text,
    });
  } catch (err: any) {
    console.error('Error answering callback query:', err);
  }
}

// Process an incoming Telegram update (Message or CallbackQuery)
export async function processTelegramUpdate(token: string, update: any) {
  // 1. Handle Inline Keyboard button press (CallbackQuery)
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message?.chat?.id;
    const messageId = cq.message?.message_id;
    const action = cq.data || '';
    const userFrom = cq.from?.username ? `@${cq.from.username}` : (cq.from?.first_name || 'User');

    logger.addLog('keypad', 'info', `🔘 Button [${action.replace('calc:', '')}] clicked by ${userFrom}`);

    if (!chatId || !messageId) {
      await answerTelegramCallbackQuery(token, cq.id);
      return;
    }

    const sessionKey = `${chatId}:${messageId}`;
    let session = calculatorSessions.get(sessionKey) || { expr: '', updatedAt: Date.now() };
    let note: string | undefined;

    if (action === 'calc:ac') {
      session.expr = '';
      session.lastResult = undefined;
      await answerTelegramCallbackQuery(token, cq.id, 'Cleared');
      logger.addLog('calc', 'info', `🔄 Keypad display cleared for Chat ${chatId}`);
    } else if (action === 'calc:del') {
      if (session.expr.length > 0) {
        session.expr = session.expr.slice(0, -1);
      }
      await answerTelegramCallbackQuery(token, cq.id);
    } else if (action === 'calc:=') {
      if (!session.expr.trim()) {
        note = 'Please enter an expression first';
        await answerTelegramCallbackQuery(token, cq.id, 'Expression is empty');
      } else {
        const evalRes = safeEvaluate(session.expr);
        if (evalRes.success && evalRes.result !== undefined) {
          session.lastResult = evalRes.result;
          await answerTelegramCallbackQuery(token, cq.id, `= ${evalRes.result}`);
          logger.addLog('calc', 'success', `🧮 Keypad calculated: "${session.expr}" = ${evalRes.result} for ${userFrom}`);
        } else {
          note = evalRes.error || 'Calculation error';
          await answerTelegramCallbackQuery(token, cq.id, 'Error in calculation');
          logger.addLog('calc', 'warn', `⚠️ Keypad calculation error on "${session.expr}": ${note}`);
        }
      }
    } else if (action === 'calc:help') {
      await answerTelegramCallbackQuery(
        token,
        cq.id,
        'Type any math in chat e.g. 25*4 or sqrt(144) or use the buttons!'
      );
    } else if (action.startsWith('calc:')) {
      const char = action.replace('calc:', '');
      if (session.lastResult !== undefined && ['+', '-', '*', '/', '^', '%'].includes(char)) {
        session.expr = session.lastResult + char;
        session.lastResult = undefined;
      } else if (session.lastResult !== undefined && !['+', '-', '*', '/', '^', '%'].includes(char)) {
        session.expr = char;
        session.lastResult = undefined;
      } else {
        session.expr += char;
      }
      await answerTelegramCallbackQuery(token, cq.id);
    }

    session.updatedAt = Date.now();
    calculatorSessions.set(sessionKey, session);

    const updatedText = formatCalculatorMessage(session.expr, session.lastResult, note);
    await editTelegramMessage(
      token,
      chatId,
      messageId,
      updatedText,
      getCalculatorKeyboard(session.expr)
    );
    return;
  }

  // 2. Handle Text Message
  if (update.message && update.message.text) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const rawText = msg.text.trim();
    const userFirstName = msg.from?.first_name || 'Friend';
    const userHandle = msg.from?.username ? `@${msg.from.username}` : userFirstName;

    logger.addLog('telegram', 'info', `📥 Message from ${userHandle} (Chat ${chatId}): "${rawText}"`);

    // Start / Help / Calc command
    if (rawText.startsWith('/start') || rawText.startsWith('/help') || rawText === '/calc') {
      const welcomeText =
        `👋 *Hello ${userFirstName}!*\n` +
        `Welcome to your *JavaScript Telegram Calculator Bot* 🧮\n\n` +
        `*How to use:*\n` +
        `1️⃣ *Direct Message:* Send any math problem directly:\n` +
        `   • \`150 * 4 + 85\`\n` +
        `   • \`(1200 - 350) / 5\`\n` +
        `   • \`sqrt(144) + 2^4\`\n` +
        `   • \`15% of 850\`\n` +
        `   • \`sin(45 deg) * 10\`\n` +
        `   • \`২৫ * ৪ + ১০\` _(Bengali digits supported!)_\n\n` +
        `2️⃣ *Interactive Keypad:* Click the buttons below! 👇`;

      const sentMsg: any = await sendTelegramMessage(
        token,
        chatId,
        welcomeText,
        getCalculatorKeyboard('')
      );

      if (sentMsg?.result?.message_id) {
        calculatorSessions.set(`${chatId}:${sentMsg.result.message_id}`, {
          expr: '',
          updatedAt: Date.now(),
        });
      }

      logger.addLog('telegram', 'success', `📤 Sent welcome message & keypad to ${userHandle} (Chat ${chatId})`);
      return;
    }

    // Direct math expression handling
    let mathExpr = rawText;
    if (mathExpr.startsWith('/calc ')) {
      mathExpr = mathExpr.replace('/calc ', '').trim();
    }

    const evalRes = safeEvaluate(mathExpr);

    if (evalRes.success && evalRes.result !== undefined) {
      logger.addLog('calc', 'success', `🧮 Evaluated: "${mathExpr}" = ${evalRes.result} for ${userHandle}`);

      const reply =
        `🧮 *Calculation Result*\n━━━━━━━━━━━━━━━━━━━━\n` +
        `📥 *Input:* \`${mathExpr}\`\n` +
        `📤 *Result:* \`= ${evalRes.result}\`\n━━━━━━━━━━━━━━━━━━━━\n` +
        `💡 _Send another calculation anytime or type /calc for keypad!_`;

      await sendTelegramMessage(token, chatId, reply);
      logger.addLog('telegram', 'success', `📤 Reply sent to ${userHandle}: "= ${evalRes.result}"`);
    } else {
      const looksLikeMath = /[0-9\+\-\*\/\%\^\(\)\=]|sqrt|sin|cos|tan|pi|log/i.test(mathExpr);
      if (looksLikeMath || rawText.startsWith('/')) {
        logger.addLog('calc', 'warn', `⚠️ Math syntax error for "${mathExpr}": ${evalRes.error}`);
        const errorReply =
          `⚠️ *Could not calculate:*\n\`${mathExpr}\`\n\n` +
          `❌ *Error:* ${evalRes.error || 'Invalid syntax'}\n\n` +
          `💡 *Examples:*\n• \`25 * 40\`\n• \`sqrt(64) + 12\`\n• \`20% of 500\`\n• Type \`/calc\` for keypad`;
        await sendTelegramMessage(token, chatId, errorReply);
      } else {
        const hintReply =
          `🤖 *I am your Calculator Bot!*\n\n` +
          `Please send any mathematical expression (e.g. \`50 * 12 + 100\`) or type \`/calc\` to open the interactive keypad!`;
        await sendTelegramMessage(token, chatId, hintReply, getCalculatorKeyboard(''));
        logger.addLog('telegram', 'info', `📤 Sent hint guide to ${userHandle}`);
      }
    }
  }
}

// -------------------------------------------------------------
// Long Polling Controller (No Webhook Required!)
// -------------------------------------------------------------

interface PollingWorker {
  token: string;
  botInfo: BotInfo;
  isActive: boolean;
  offset: number;
  totalUpdates: number;
  startedAt: string;
}

let activeWorker: PollingWorker | null = null;
let pollLoopTimeout: NodeJS.Timeout | null = null;

export function getActiveWorkerStatus() {
  if (!activeWorker || !activeWorker.isActive) {
    return { isRunning: false };
  }
  return {
    isRunning: true,
    botInfo: activeWorker.botInfo,
    startedAt: activeWorker.startedAt,
    totalUpdates: activeWorker.totalUpdates,
  };
}

export async function stopBotPolling() {
  if (pollLoopTimeout) {
    clearTimeout(pollLoopTimeout);
    pollLoopTimeout = null;
  }
  if (activeWorker) {
    const username = activeWorker.botInfo.username;
    activeWorker.isActive = false;
    activeWorker = null;
    logger.addLog('system', 'warn', `⏹️ Stopped bot polling for @${username}`);
  }
  return { ok: true, message: 'Bot polling stopped' };
}

export async function startBotPolling(token: string): Promise<{ ok: boolean; botInfo?: BotInfo; description?: string }> {
  // Stop existing polling first
  await stopBotPolling();

  logger.addLog('system', 'info', 'Connecting to Telegram servers via Long Polling...');

  // Verify token
  const infoRes = await getBotInfo(token);
  if (!infoRes.ok || !infoRes.result) {
    logger.addLog('system', 'error', `Authentication failed: ${infoRes.description || 'Invalid token'}`);
    return { ok: false, description: infoRes.description || 'Invalid bot token' };
  }

  const botInfo = infoRes.result;

  // Clear any existing webhook so long polling works without conflict
  logger.addLog('system', 'info', `Removing any old webhook conflicts on @${botInfo.username}...`);
  const delRes = await deleteBotWebhook(token);
  if (!delRes.ok) {
    logger.addLog('system', 'warn', `Notice on deleteWebhook: ${delRes.description}`);
  } else {
    logger.addLog('system', 'success', 'Webhook disabled. Switched to direct Long Polling mode.');
  }

  // Set up active worker
  activeWorker = {
    token,
    botInfo,
    isActive: true,
    offset: 0,
    totalUpdates: 0,
    startedAt: new Date().toLocaleTimeString(),
  };

  logger.addLog('system', 'success', `🚀 Bot @${botInfo.username} is now ONLINE and polling Telegram in real-time!`);

  // Start loop
  runPollingLoop();

  return { ok: true, botInfo };
}

async function runPollingLoop() {
  if (!activeWorker || !activeWorker.isActive) return;

  const currentWorker = activeWorker;
  const token = currentWorker.token;

  try {
    const params = new URLSearchParams({
      offset: String(currentWorker.offset),
      timeout: '25', // Long polling wait up to 25 seconds
      allowed_updates: JSON.stringify(['message', 'callback_query']),
    });

    const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/getUpdates?${params.toString()}`);
    const data = await response.json();

    if (!activeWorker || !activeWorker.isActive || activeWorker.token !== token) {
      return; // stopped
    }

    if (data.ok && Array.isArray(data.result)) {
      const updates = data.result;

      for (const update of updates) {
        currentWorker.offset = update.update_id + 1;
        currentWorker.totalUpdates += 1;

        // Process message or button click asynchronously
        processTelegramUpdate(token, update).catch((err) => {
          logger.addLog('telegram', 'error', `Update processing error: ${err?.message || err}`);
        });
      }
    } else if (!data.ok) {
      logger.addLog('telegram', 'error', `Telegram getUpdates returned: ${data.description}`);
      // If unauthorized, stop polling
      if (data.error_code === 401) {
        logger.addLog('system', 'error', 'Token is unauthorized/invalid. Stopping bot.');
        stopBotPolling();
        return;
      }
    }
  } catch (err: any) {
    // Timeout or network glitch
    if (activeWorker && activeWorker.isActive) {
      // Don't flood logs on normal aborts, only if worker still wants to run
      console.warn('Long polling network glitch (retrying):', err?.message);
    }
  }

  // Next iteration
  if (activeWorker && activeWorker.isActive) {
    pollLoopTimeout = setTimeout(runPollingLoop, 500);
  }
}
