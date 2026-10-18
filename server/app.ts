import express from 'express';
import dotenv from 'dotenv';
import {
  getBotInfo,
  startBotPolling,
  stopBotPolling,
  getActiveWorkerStatus,
  setBotWebhook,
  deleteBotWebhook,
  processTelegramUpdate,
} from './telegram.js';
import { logger } from './logger.js';
import { safeEvaluate } from './calculator.js';
import { generateCalculatorBotJs } from './codeGenerator.js';

dotenv.config();

export const app = express();

// Parse JSON and form bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to determine public base URL (supports Vercel, Cloud Run, custom domains)
export function getBaseUrl(req: express.Request): string {
  // If VERCEL_URL is provided by Vercel
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  }

  // If APP_URL is provided by AI Studio / Cloud Run
  if (process.env.APP_URL && process.env.APP_URL.startsWith('http')) {
    return process.env.APP_URL.replace(/\/$/, '');
  }

  // Forwarded headers from Vercel / Cloud Run / reverse proxies
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:3000';
  return `${proto}://${host}`.replace(/\/$/, '');
}

// -------------------------------------------------------------
// API Endpoints (Vercel & Node.js Universal)
// -------------------------------------------------------------

// 1. System Info
app.get('/api/system/info', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const isVercel = Boolean(process.env.VERCEL || req.headers['x-vercel-id']);
  res.json({
    status: 'online',
    isVercel,
    baseUrl,
    timestamp: new Date().toISOString(),
  });
});

// 2. Verify Bot Token
app.post('/api/bot/verify', async (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string' || !token.includes(':')) {
    res.status(400).json({
      ok: false,
      description: 'Invalid token format. A Telegram token usually looks like: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ',
    });
    return;
  }

  const cleanToken = token.trim();
  const botInfo = await getBotInfo(cleanToken);

  if (!botInfo.ok) {
    res.status(400).json(botInfo);
    return;
  }

  res.json(botInfo);
});

// 3. Start Bot (Smart Mode: Webhook for Vercel, Polling for Node Server)
app.post('/api/bot/start', async (req, res) => {
  const { token, mode, targetUrl } = req.body;
  if (!token || typeof token !== 'string') {
    res.status(400).json({ ok: false, description: 'Token is required' });
    return;
  }

  const cleanToken = token.trim();
  const isVercel = Boolean(process.env.VERCEL || req.headers['x-vercel-id'] || mode === 'webhook');

  // Verify token first
  const verifyRes = await getBotInfo(cleanToken);
  if (!verifyRes.ok || !verifyRes.result) {
    res.status(400).json({ ok: false, description: verifyRes.description || 'Invalid token' });
    return;
  }

  const botInfo = verifyRes.result;

  // On Vercel: Use Webhook mode (Vercel serverless functions cannot run infinite polling loops)
  if (isVercel) {
    const baseUrl = targetUrl ? targetUrl.replace(/\/$/, '') : getBaseUrl(req);
    const webhookUrl = `${baseUrl}/api/webhook/${cleanToken}`;

    logger.addLog('system', 'info', `Configuring Vercel Serverless Webhook on @${botInfo.username}...`);
    const webhookRes = await setBotWebhook(cleanToken, webhookUrl);

    if (!webhookRes.ok) {
      logger.addLog('system', 'error', `Failed to set webhook: ${webhookRes.description}`);
      res.status(400).json({
        ok: false,
        description: webhookRes.description || 'Failed to set Telegram webhook on Vercel',
      });
      return;
    }

    logger.addLog('system', 'success', `🚀 Bot @${botInfo.username} active in Vercel Webhook mode!`, {
      user: `@${botInfo.username}`,
      opType: 'system',
    });

    res.json({
      ok: true,
      mode: 'webhook',
      message: 'Bot activated successfully in Vercel Serverless Webhook mode!',
      webhookUrl,
      botInfo,
      directTelegramLink: botInfo.username ? `https://t.me/${botInfo.username}` : null,
    });
    return;
  }

  // On Node.js / Local / AI Studio: Use Long Polling
  const pollResult = await startBotPolling(cleanToken);
  if (!pollResult.ok) {
    res.status(400).json(pollResult);
    return;
  }

  res.json({
    ok: true,
    mode: 'polling',
    message: 'Bot started polling Telegram successfully!',
    botInfo: pollResult.botInfo,
    directTelegramLink: pollResult.botInfo?.username ? `https://t.me/${pollResult.botInfo.username}` : null,
  });
});

// 4. Set Webhook Explicitly (For Vercel or any cloud hosting)
app.post('/api/bot/set-webhook', async (req, res) => {
  const { token, targetUrl } = req.body;
  if (!token) {
    res.status(400).json({ ok: false, description: 'Token is required' });
    return;
  }

  const cleanToken = token.trim();
  const baseUrl = targetUrl ? targetUrl.replace(/\/$/, '') : getBaseUrl(req);
  const webhookUrl = `${baseUrl}/api/webhook/${cleanToken}`;

  const botInfo = await getBotInfo(cleanToken);
  const setResult = await setBotWebhook(cleanToken, webhookUrl);

  if (setResult.ok) {
    logger.addLog('system', 'success', `Webhook registered at: ${webhookUrl}`);
  } else {
    logger.addLog('system', 'error', `Webhook failed: ${setResult.description}`);
  }

  res.json({
    ok: setResult.ok,
    webhookUrl,
    botInfo: botInfo.result,
    result: setResult,
  });
});

// 5. Telegram Webhook Receiver (Essential for Vercel Serverless Hosting)
app.post('/api/webhook/:token', async (req, res) => {
  const { token } = req.params;
  // Always return 200 OK immediately so Telegram doesn't retry
  res.sendStatus(200);

  try {
    await processTelegramUpdate(token, req.body);
  } catch (err) {
    console.error(`[Webhook Error for bot ${token.slice(0, 8)}...]:`, err);
  }
});

app.get('/api/webhook/:token', (_req, res) => {
  res.send('<h1>✅ Telegram Calculator Webhook Receiver is Active!</h1><p>Ready to receive updates.</p>');
});

// 6. Stop Bot
app.post('/api/bot/stop', async (_req, res) => {
  const result = await stopBotPolling();
  res.json(result);
});

// 7. Bot Status
app.get('/api/bot/status', (req, res) => {
  const status = getActiveWorkerStatus();
  const isVercel = Boolean(process.env.VERCEL || req.headers['x-vercel-id']);
  res.json({ ...status, isVercel });
});

// 8. Logs API
app.get('/api/logs', (req, res) => {
  const since = req.query.since ? Number(req.query.since) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const category = req.query.category as string | undefined;
  const level = req.query.level as string | undefined;
  const logs = logger.getLogs(since, limit, category, level);
  const stats = logger.getStats();
  res.json({ logs, stats });
});

// 9. Telemetry Stats
app.get('/api/logs/stats', (_req, res) => {
  res.json(logger.getStats());
});

// 10. SSE Stream
app.get('/api/logs/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'init', stats: logger.getStats() })}\n\n`);

  const unsubscribe = logger.subscribe((entry) => {
    res.write(`data: ${JSON.stringify({ type: 'log', entry, stats: logger.getStats() })}\n\n`);
  });

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

// 11. Clear Logs
app.post('/api/logs/clear', (_req, res) => {
  logger.clearLogs();
  res.json({ ok: true, message: 'Logs cleared', stats: logger.getStats() });
});

// 12. Test Traffic Generator
app.post('/api/logs/test', (req, res) => {
  const sampleUsers = ['@alex_dev', '@sarah_k', '@rahim_99', '@tanvir_pro', '@math_lover'];
  const sampleExpressions = ['25 * 4 + 10', 'sqrt(144) + 2^4', '20% of 850', '1200 / (15 + 5)', '২৫ * ৪ + ১০'];
  const user = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
  const expr = (req.body?.expression as string) || sampleExpressions[Math.floor(Math.random() * sampleExpressions.length)];

  const tStart = performance.now();
  const evalRes = safeEvaluate(expr);
  const durationMs = Math.round((performance.now() - tStart) * 10) / 10;

  logger.addLog('telegram', 'info', `📥 Message from ${user}: "${expr}"`, {
    user,
    userId: Math.floor(100000000 + Math.random() * 900000000),
    chatId: Math.floor(100000000 + Math.random() * 900000000),
    rawText: expr,
    input: expr,
    opType: 'arithmetic',
  });

  if (evalRes.success && evalRes.result !== undefined) {
    logger.addLog('calc', 'success', `🧮 Evaluated: "${expr}" = ${evalRes.result} (${durationMs}ms)`, {
      user,
      input: expr,
      result: evalRes.result,
      durationMs,
      opType: expr.includes('%') ? 'percentage' : expr.includes('sqrt') ? 'root' : 'arithmetic',
    });
  }

  res.json({ ok: true, expr, result: evalRes.result, user });
});

// 13. Simulator Endpoint
app.post('/api/bot/simulate', (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    res.json({ success: false, error: 'Expression is required' });
    return;
  }

  const clean = text.trim();
  logger.addLog('calc', 'info', `[Web Simulator] Testing math expression: "${clean}"`, {
    user: 'Web Simulator',
    rawText: clean,
    input: clean,
    opType: 'arithmetic',
  });

  if (clean === '/start' || clean === '/help' || clean === '/calc') {
    res.json({
      success: true,
      type: 'command',
      message: '👋 Welcome to Calculator Bot! Type any math equation (e.g. 25 * 4 + 10) or use the keypad.',
      display: '0',
    });
    return;
  }

  const tStart = performance.now();
  const evalRes = safeEvaluate(clean.replace('/calc ', ''));
  const durationMs = Math.round((performance.now() - tStart) * 10) / 10;

  if (evalRes.success && evalRes.result !== undefined) {
    logger.addLog('calc', 'success', `[Web Simulator] Calculated: "${clean}" = ${evalRes.result} (${durationMs}ms)`, {
      user: 'Web Simulator',
      input: clean,
      result: evalRes.result,
      durationMs,
      opType: clean.includes('%') ? 'percentage' : clean.includes('sqrt') ? 'root' : 'arithmetic',
    });
    res.json({
      success: true,
      type: 'calculation',
      input: clean,
      result: evalRes.result,
      durationMs,
      message: `🧮 Result:\n${clean} = ${evalRes.result}`,
    });
  } else {
    logger.addLog('calc', 'warn', `[Web Simulator] Syntax error for "${clean}": ${evalRes.error}`, {
      user: 'Web Simulator',
      input: clean,
      error: evalRes.error,
      opType: 'arithmetic',
    });
    res.json({
      success: false,
      type: 'error',
      input: clean,
      error: evalRes.error || 'Invalid math expression',
      message: `⚠️ Could not calculate: ${evalRes.error || 'Invalid expression'}`,
    });
  }
});

// 14. Code Download
app.get('/api/bot/code', (req, res) => {
  const token = (req.query.token as string) || 'YOUR_BOT_TOKEN_HERE';
  const code = generateCalculatorBotJs(token);

  if (req.query.download === 'true') {
    res.setHeader('Content-Disposition', 'attachment; filename="calculator-bot.js"');
    res.setHeader('Content-Type', 'application/javascript');
    res.send(code);
    return;
  }

  res.json({ code });
});
