export function generateCalculatorBotJs(botToken: string = 'YOUR_BOT_TOKEN_HERE'): string {
  return `/**
 * ============================================================
 * 🤖 JavaScript Telegram Calculator Bot (টেলিগ্রাম ক্যালকুলেটর বট)
 * ============================================================
 * Mode: Long Polling (কোনো Webhook বা সার্ভার পোর্ট প্রয়োজন নেই!)
 * Features:
 *  - Interactive Inline Keyboard Calculator (AC, DEL, +, -, *, /, =, sqrt, ^, %)
 *  - Direct text math calculation (e.g., "25 * 4 + 10", "sqrt(144)", "20% of 500")
 *  - Bengali & Arabic numeral support (০-৯, ٠-٩)
 *  - Safe math AST evaluation (mathjs)
 *  - Built-in real-time terminal logger
 * 
 * Quick Start:
 *  1. npm install mathjs
 *  2. node calculator-bot.js
 * ============================================================
 */

import * as math from 'mathjs';

// Telegram Bot Token
const BOT_TOKEN = process.env.BOT_TOKEN || '${botToken}';
const TELEGRAM_API = \`https://api.telegram.org/bot\${BOT_TOKEN}\`;

// Memory store for inline keypad calculator state
const sessions = new Map();

// Real-time Console Logger
function log(level, category, message) {
  const time = new Date().toLocaleTimeString();
  const icons = { info: 'ℹ️', success: '✅', warn: '⚠️', error: '❌' };
  console.log(\`[\${time}] \${icons[level] || '•'} [\${category.toUpperCase()}] \${message}\`);
}

// Helper: Convert Bengali & Arabic digits to standard ASCII digits
function normalizeDigits(input) {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let res = input;
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(bengaliDigits[i], i.toString());
    res = res.replaceAll(arabicDigits[i], i.toString());
  }
  return res;
}

// Safe Math Evaluator
function safeCalculate(rawExpr) {
  try {
    let expr = normalizeDigits(rawExpr.trim())
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/,/g, '');

    // Handle "20% of 500" -> "(20/100) * 500"
    expr = expr.replace(/(\\d+(\\.\\d+)?)\\s*%\\s*(?:of|\\*)\\s*(\\d+(\\.\\d+)?)/gi, '($1 / 100) * $3');
    // Handle "100 + 15%" -> "100 + (100 * 0.15)"
    expr = expr.replace(/(\\d+(\\.\\d+)?)\\s*([+\\-])\\s*(\\d+(\\.\\d+)?)\\s*%/gi, '$1 $3 ($1 * ($4 / 100))');
    // Handle standalone "%"
    expr = expr.replace(/(\\d+(\\.\\d+)?)\\s*%/g, '($1 / 100)');

    const result = math.evaluate(expr, {});
    if (result === undefined || result === null || !isFinite(result)) {
      return { success: false, error: 'Undefined result or division by zero' };
    }
    return { success: true, result: String(result) };
  } catch (err) {
    return { success: false, error: err.message || 'Invalid expression' };
  }
}

// Telegram API Call
async function callTelegram(method, payload) {
  const res = await fetch(\`\${TELEGRAM_API}/\${method}\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

// Inline Keyboard Layout
function getKeypad() {
  return {
    inline_keyboard: [
      [
        { text: 'AC', callback_data: 'calc:ac' },
        { text: '(', callback_data: 'calc:(' },
        { text: ')', callback_data: 'calc:)' },
        { text: '⌫ DEL', callback_data: 'calc:del' },
      ],
      [
        { text: '7', callback_data: 'calc:7' },
        { text: '8', callback_data: 'calc:8' },
        { text: '9', callback_data: 'calc:9' },
        { text: '÷', callback_data: 'calc:/' },
      ],
      [
        { text: '4', callback_data: 'calc:4' },
        { text: '5', callback_data: 'calc:5' },
        { text: '6', callback_data: 'calc:6' },
        { text: '×', callback_data: 'calc:*' },
      ],
      [
        { text: '1', callback_data: 'calc:1' },
        { text: '2', callback_data: 'calc:2' },
        { text: '3', callback_data: 'calc:3' },
        { text: '-', callback_data: 'calc:-' },
      ],
      [
        { text: '0', callback_data: 'calc:0' },
        { text: '.', callback_data: 'calc:.' },
        { text: '=', callback_data: 'calc:=' },
        { text: '+', callback_data: 'calc:+' },
      ],
      [
        { text: '√ sqrt', callback_data: 'calc:sqrt(' },
        { text: '^ pow', callback_data: 'calc:^' },
        { text: '%', callback_data: 'calc:%' },
        { text: 'ℹ️ Help', callback_data: 'calc:help' },
      ],
    ],
  };
}

function formatMessage(expr, result, note) {
  let msg = '🧮 *Telegram Calculator Bot*\\n━━━━━━━━━━━━━━━━━━━━\\n';
  msg += \`📝 *Expression:* \`\${expr || '0'}\`\\n\`;
  if (result !== undefined) {
    msg += \`🎯 *Result:* \`= \${result}\`\\n\`;
  }
  if (note) {
    msg += \`\\n⚠️ _\${note}_\\n\`;
  }
  msg += '━━━━━━━━━━━━━━━━━━━━\\n✨ _Press keypad or send any math problem!_';
  return msg;
}

// Process Telegram Updates
async function handleUpdate(update) {
  // 1. Inline Keypad clicks
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message.chat.id;
    const messageId = cq.message.message_id;
    const key = \`\${chatId}:\${messageId}\`;
    const action = cq.data || '';
    const user = cq.from.username ? \`@\${cq.from.username}\` : cq.from.first_name;

    log('info', 'KEYPAD', \`Button \${action.replace('calc:', '')} pressed by \${user}\`);

    let session = sessions.get(key) || { expr: '' };
    let note;

    if (action === 'calc:ac') {
      session.expr = '';
      session.lastResult = undefined;
    } else if (action === 'calc:del') {
      session.expr = session.expr.slice(0, -1);
    } else if (action === 'calc:=') {
      const evalRes = safeCalculate(session.expr);
      if (evalRes.success) {
        session.lastResult = evalRes.result;
        log('success', 'CALC', \`Keypad evaluation: \${session.expr} = \${evalRes.result}\`);
      } else {
        note = evalRes.error;
        log('warn', 'CALC', \`Calculation error: \${evalRes.error}\`);
      }
    } else if (action.startsWith('calc:')) {
      const char = action.replace('calc:', '');
      if (session.lastResult !== undefined && ['+', '-', '*', '/', '^', '%'].includes(char)) {
        session.expr = session.lastResult + char;
        session.lastResult = undefined;
      } else if (session.lastResult !== undefined) {
        session.expr = char;
        session.lastResult = undefined;
      } else {
        session.expr += char;
      }
    }

    sessions.set(key, session);
    await callTelegram('answerCallbackQuery', { callback_query_id: cq.id });
    await callTelegram('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text: formatMessage(session.expr, session.lastResult, note),
      parse_mode: 'Markdown',
      reply_markup: getKeypad(),
    });
    return;
  }

  // 2. Incoming Text message
  if (update.message && update.message.text) {
    const msg = update.message;
    const text = msg.text.trim();
    const chatId = msg.chat.id;
    const user = msg.from.username ? \`@\${msg.from.username}\` : msg.from.first_name;

    log('info', 'MESSAGE', \`Received from \${user}: "\${text}"\`);

    if (text === '/start' || text === '/calc' || text === '/help') {
      const welcome =
        '👋 *Welcome to Calculator Bot!* 🧮\\n\\n' +
        'Send any math expression directly (e.g. \`50 * 12 + 100\`, \`sqrt(144)\`, \`20% of 500\`)' +
        '\\nor use the interactive keypad below:';
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: welcome,
        parse_mode: 'Markdown',
        reply_markup: getKeypad(),
      });
      log('success', 'REPLY', \`Sent keypad to \${user}\`);
      return;
    }

    const evalRes = safeCalculate(text.replace('/calc ', ''));
    if (evalRes.success) {
      log('success', 'CALC', \`Evaluated: \${text} = \${evalRes.result}\`);
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: \`🧮 *Result:*\\n\`\${text} = \${evalRes.result}\`\`,
        parse_mode: 'Markdown',
      });
    } else {
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: \`⚠️ *Could not calculate:* \${evalRes.error}\\n💡 Try \`25 * 4 + 10\` or type /calc\`,
        parse_mode: 'Markdown',
      });
    }
  }
}

// Long Polling Main Loop
async function startBot() {
  log('info', 'SYSTEM', 'Starting Telegram Calculator Bot...');

  // 1. Verify Bot Token
  const me = await callTelegram('getMe', {});
  if (!me.ok) {
    log('error', 'AUTH', \`Bot Token verification failed: \${me.description}\`);
    process.exit(1);
  }

  log('success', 'AUTH', \`Connected as @\${me.result.username} (\${me.result.first_name})\`);

  // 2. Clear any old webhook so Long Polling works flawlessly
  await callTelegram('deleteWebhook', { drop_pending_updates: false });
  log('info', 'POLLING', 'Webhook cleared. Starting continuous long-polling listener...');

  let offset = 0;
  while (true) {
    try {
      const res = await fetch(\`\${TELEGRAM_API}/getUpdates?offset=\${offset}&timeout=20\`);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          await handleUpdate(update);
        }
      }
    } catch (err) {
      log('warn', 'NETWORK', \`Polling timeout/retry: \${err.message}\`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

startBot();
`;
}
