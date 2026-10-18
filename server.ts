import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  getBotInfo,
  startBotPolling,
  stopBotPolling,
  getActiveWorkerStatus,
} from './server/telegram.js';
import { logger } from './server/logger.js';
import { safeEvaluate } from './server/calculator.js';
import { generateCalculatorBotJs } from './server/codeGenerator.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// AI Studio dev environment requires port 3000
const PORT = 3000;

// Parse JSON and form bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------------------------------------------
// Bot Controller & Log Endpoints
// -------------------------------------------------------------

// 1. Verify Bot Token & Fetch Bot Details
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

// 2. Start Bot (Direct Long Polling - No Webhook Needed!)
app.post('/api/bot/start', async (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    res.status(400).json({ ok: false, description: 'Token is required' });
    return;
  }

  const cleanToken = token.trim();
  const result = await startBotPolling(cleanToken);

  if (!result.ok) {
    res.status(400).json(result);
    return;
  }

  res.json({
    ok: true,
    message: 'Bot started polling Telegram successfully (No webhook required!)',
    botInfo: result.botInfo,
    directTelegramLink: result.botInfo?.username ? `https://t.me/${result.botInfo.username}` : null,
  });
});

// 3. Stop Bot Polling
app.post('/api/bot/stop', async (req, res) => {
  const result = await stopBotPolling();
  res.json(result);
});

// 4. Get Current Bot Status
app.get('/api/bot/status', (req, res) => {
  const status = getActiveWorkerStatus();
  res.json(status);
});

// 5. Get Real-Time Logs
app.get('/api/logs', (req, res) => {
  const since = req.query.since ? Number(req.query.since) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const logs = logger.getLogs(since, limit);
  res.json({ logs });
});

// 6. Clear Logs
app.post('/api/logs/clear', (req, res) => {
  logger.clearLogs();
  res.json({ ok: true, message: 'Logs cleared' });
});

// 7. Simulator Endpoint for in-browser testing
app.post('/api/bot/simulate', (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    res.json({ success: false, error: 'Expression is required' });
    return;
  }

  const clean = text.trim();
  logger.addLog('calc', 'info', `[Web Simulator] Testing math expression: "${clean}"`);

  if (clean === '/start' || clean === '/help' || clean === '/calc') {
    res.json({
      success: true,
      type: 'command',
      message: '👋 Welcome to Calculator Bot! Type any math equation (e.g. 25 * 4 + 10) or use the keypad.',
      display: '0',
    });
    return;
  }

  const evalRes = safeEvaluate(clean.replace('/calc ', ''));
  if (evalRes.success && evalRes.result !== undefined) {
    logger.addLog('calc', 'success', `[Web Simulator] Calculated: "${clean}" = ${evalRes.result}`);
    res.json({
      success: true,
      type: 'calculation',
      input: clean,
      result: evalRes.result,
      message: `🧮 Result:\n${clean} = ${evalRes.result}`,
    });
  } else {
    logger.addLog('calc', 'warn', `[Web Simulator] Syntax error for "${clean}": ${evalRes.error}`);
    res.json({
      success: false,
      type: 'error',
      input: clean,
      error: evalRes.error || 'Invalid math expression',
      message: `⚠️ Could not calculate: ${evalRes.error || 'Invalid expression'}`,
    });
  }
});

// 8. Generate JavaScript Code (Polling Mode)
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

// -------------------------------------------------------------
// Vite Middlewares (Dev) or Static dist (Prod)
// -------------------------------------------------------------
async function setupApp() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Telegram Calculator Bot Server listening on http://0.0.0.0:${PORT}`);
  });
}

setupApp().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
