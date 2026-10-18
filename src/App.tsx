import React, { useState, useEffect } from 'react';
import {
  Bot,
  Zap,
  Code2,
  HelpCircle,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCw,
  Sparkles,
  ClipboardPaste,
  Terminal,
  Activity,
} from 'lucide-react';
import { BotInfo, BotWorkerStatus } from './types';
import { safeFetchJson } from './utils/api';
import { BotActiveCard } from './components/BotActiveCard';
import { LiveLogViewer } from './components/LiveLogViewer';
import { TelegramSimulator } from './components/TelegramSimulator';
import { JsCodeViewer } from './components/JsCodeViewer';
import { BotFatherGuide } from './components/BotFatherGuide';
import { MathCheatSheet } from './components/MathCheatSheet';
import { VercelGuide } from './components/VercelGuide';

export default function App() {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [tokenInput, setTokenInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activeBot, setActiveBot] = useState<BotInfo | null>(null);
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [botMode, setBotMode] = useState<'webhook' | 'polling'>('polling');
  const [botWebhookUrl, setBotWebhookUrl] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<'logs' | 'simulator' | 'code' | 'guide' | 'cheat' | 'vercel'>('logs');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const isVercelHost =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('vercel.dev'));

  // Check initial worker status on load
  useEffect(() => {
    safeFetchJson<BotWorkerStatus>('/api/bot/status').then((res) => {
      if (res.ok && res.data?.isRunning && res.data?.botInfo) {
        setActiveBot(res.data.botInfo);
        setIsBotRunning(true);
      }
    });
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTokenInput(text.trim());
      }
    } catch {
      // Fallback
    }
  };

  const handleStartBot = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const token = tokenInput.trim();

    if (!token) {
      setActivationError(
        lang === 'bn'
          ? 'অনুগ্রহ করে একটি বৈধ টেলিগ্রাম বট টোকেন দিন।'
          : 'Please enter a valid Telegram Bot Token.'
      );
      return;
    }

    if (!token.includes(':')) {
      setActivationError(
        lang === 'bn'
          ? 'টোকেন ফরম্যাট সঠিক নয়। টোকেনটিতে সংখ্যা এবং অক্ষরের মাঝে একটি কোলন (:) থাকে (যেমন: 123456789:ABCdefGhI...)'
          : 'Invalid token format. It must look like: 123456789:ABCdefGhI...'
      );
      return;
    }

    setIsActivating(true);
    setActivationError(null);
    setStatusMessage(
      isVercelHost
        ? lang === 'bn'
          ? 'Vercel Serverless Webhook কানেক্ট করা হচ্ছে...'
          : 'Connecting Vercel Serverless Webhook...'
        : lang === 'bn'
        ? 'টেলিগ্রাম সার্ভারের সাথে সরাসরি লং-পোলিং কানেক্ট করা হচ্ছে...'
        : 'Connecting to Telegram servers via Long Polling...'
    );

    try {
      const result = await safeFetchJson<{
        ok: boolean;
        mode?: 'webhook' | 'polling';
        webhookUrl?: string;
        botInfo: BotInfo;
        description?: string;
      }>('/api/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          targetUrl: window.location.origin,
          mode: isVercelHost ? 'webhook' : 'auto',
        }),
      });

      if (!result.ok || !result.data?.ok) {
        setActivationError(
          result.error ||
            result.data?.description ||
            (lang === 'bn'
              ? 'বট কানেক্ট করতে সমস্যা হয়েছে। টোকেনটি সঠিক কি না পরীক্ষা করুন।'
              : 'Failed to connect bot. Please verify your token.')
        );
        setIsActivating(false);
        return;
      }

      setActiveBot(result.data.botInfo);
      setIsBotRunning(true);
      setBotMode(result.data.mode || 'polling');
      setBotWebhookUrl(result.data.webhookUrl);
      setActiveTab('logs'); // Automatically switch to logs to see live activity!
    } catch (err: any) {
      setActivationError(err.message || 'Connection error. Please try again.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleStopBot = async () => {
    try {
      await safeFetchJson('/api/bot/stop', { method: 'POST' });
      setIsBotRunning(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestartBot = async () => {
    if (tokenInput.trim()) {
      await handleStartBot();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Calculator className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold tracking-tight bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                  Telegram Calc Bot
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Polling Mode
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status indicator */}
            {isBotRunning && activeBot && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>@{activeBot.username} (Online)</span>
              </div>
            )}

            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-medium text-slate-300 transition cursor-pointer"
            >
              <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto pt-2 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {lang === 'bn'
                ? 'Webhook ছাড়া সরাসরি লং-পোলিং ও রিয়েল-টাইম লগ সিস্টেম'
                : 'Direct Long Polling & Real-Time Log System (No Webhook Needed)'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {lang === 'bn' ? (
              <>
                টেলিগ্রাম{' '}
                <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                  ক্যালকুলেটর বট
                </span>{' '}
                ও লাইভ লগ সিস্টেম
              </>
            ) : (
              <>
                Telegram{' '}
                <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                  Calculator Bot
                </span>{' '}
                & Live Logger
              </>
            )}
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
            {lang === 'bn'
              ? 'এখানে শুধু আপনার টেলিগ্রাম বট টোকেন দিন—কোনো Webhook বা ব্রাউজার ট্রিগারের প্রয়োজন নেই! বটটি সাথে সাথে চালু হয়ে যাবে এবং প্রতিটি মেসেজ ও হিসাব নিচে লাইভ লগ কনসোলে দেখতে পাবেন।'
              : 'Just provide your Telegram bot token—no webhooks or browser triggers needed! The bot connects directly via long polling, and all messages and calculations stream to the live log system.'}
          </p>
        </div>

        {/* Token Input Form Card */}
        <div className="max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <form onSubmit={handleStartBot} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  {lang === 'bn' ? 'টেলিগ্রাম বট টোকেন দিন (Telegram Bot Token):' : 'Enter Telegram Bot Token:'}
                </label>
                <button
                  type="button"
                  onClick={handlePaste}
                  className="text-xs text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  {lang === 'bn' ? 'পেস্ট করুন' : 'Paste'}
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    if (activationError) setActivationError(null);
                  }}
                  placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3.5 font-mono text-sm text-emerald-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-inner"
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {lang === 'bn'
                    ? 'টোকেন দিলে সাথে সাথে বট ব্যাকগ্রাউন্ডে চালু হয়ে কাজ শুরু করবে।'
                    : 'The bot begins working immediately upon entering your token.'}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setTokenInput('7123456789:AAHTestTokenPreviewForCalculatorBotXYZ');
                  }}
                  className="text-[11px] text-sky-400 hover:underline cursor-pointer"
                >
                  {lang === 'bn' ? 'নমুনা ফরম্যাট' : 'Sample Format'}
                </button>
              </div>
            </div>

            {/* Error banner */}
            {activationError && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{activationError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isActivating || !tokenInput.trim()}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isActivating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>{statusMessage || (lang === 'bn' ? 'বট চালু করা হচ্ছে...' : 'Starting bot...')}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>
                      {lang === 'bn'
                        ? 'বট চালু করুন ও লাইভ লগ দেখুন (Start Bot & Stream Logs)'
                        : 'Start Bot & Stream Live Logs'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Active Bot Status Card (If running) */}
        {activeBot && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <BotActiveCard
              botInfo={activeBot}
              token={tokenInput.trim()}
              isPolling={isBotRunning}
              mode={botMode}
              webhookUrl={botWebhookUrl}
              onStop={handleStopBot}
              onRestart={handleRestartBot}
              lang={lang}
            />
          </div>
        )}

        {/* Feature Tabs Navigation */}
        <div className="max-w-5xl mx-auto pt-2">
          <div className="flex items-center justify-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl mx-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'logs'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'লাইভ লগ (Logs)' : 'Live Logs'}</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'simulator'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'চ্যাট টেস্ট' : 'Simulator'}</span>
            </button>

            <button
              onClick={() => setActiveTab('vercel')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'vercel'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="font-bold">▲</span>
              <span>{lang === 'bn' ? 'Vercel হোস্টিং গাইড' : 'Vercel Guide'}</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'code'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'JS কোড' : 'Code (JS)'}</span>
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'guide'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'বট তৈরি গাইড' : 'BotFather'}</span>
            </button>

            <button
              onClick={() => setActiveTab('cheat')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'cheat'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'হিসাব তালিকা' : 'Math Features'}</span>
            </button>
          </div>

          {/* Tab Content Display */}
          <div className="mt-6">
            {activeTab === 'logs' && (
              <div className="max-w-4xl mx-auto">
                <LiveLogViewer lang={lang} isBotRunning={isBotRunning} />
              </div>
            )}

            {activeTab === 'vercel' && (
              <div className="max-w-4xl mx-auto">
                <VercelGuide lang={lang} />
              </div>
            )}

            {activeTab === 'simulator' && (
              <div className="max-w-2xl mx-auto">
                <div className="mb-3 text-center">
                  <span className="text-xs text-slate-400">
                    {lang === 'bn'
                      ? '💡 এখানে আপনি সরাসরি ক্যালকুলেটর বটের হিসাব টেস্ট করতে পারেন:'
                      : '💡 Test the calculator bot live directly inside the browser:'}
                  </span>
                </div>
                <TelegramSimulator
                  botName={activeBot?.first_name || 'Calculator Bot'}
                  botUsername={activeBot?.username}
                  lang={lang}
                />
              </div>
            )}

            {activeTab === 'code' && (
              <div className="max-w-4xl mx-auto">
                <JsCodeViewer token={tokenInput.trim()} lang={lang} />
              </div>
            )}

            {activeTab === 'guide' && (
              <div className="max-w-4xl mx-auto">
                <BotFatherGuide lang={lang} />
              </div>
            )}

            {activeTab === 'cheat' && (
              <div className="max-w-5xl mx-auto">
                <MathCheatSheet lang={lang} />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>JavaScript Telegram Calculator Bot & Real-Time Log System</span>
          </div>
          <div>
            <span>Direct Long Polling • No Webhook Needed • Safe Math AST Evaluation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
