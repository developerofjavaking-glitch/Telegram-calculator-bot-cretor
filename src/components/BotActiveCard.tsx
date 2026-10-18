import React, { useState } from 'react';
import {
  ExternalLink,
  Send,
  Power,
  RotateCw,
  CheckCircle2,
  Activity,
  Bot,
  Zap,
  Cloud,
  Check,
  Copy,
} from 'lucide-react';
import { BotInfo } from '../types';

interface Props {
  botInfo: BotInfo;
  token: string;
  isPolling: boolean;
  mode?: 'webhook' | 'polling';
  webhookUrl?: string;
  onStop: () => void;
  onRestart: () => void;
  lang: 'bn' | 'en';
}

export const BotActiveCard: React.FC<Props> = ({
  botInfo,
  token,
  isPolling,
  mode = 'polling',
  webhookUrl,
  onStop,
  onRestart,
  lang,
}) => {
  const [stopping, setStopping] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleStop = async () => {
    setStopping(true);
    try {
      await onStop();
    } finally {
      setStopping(false);
    }
  };

  const handleRestart = async () => {
    setRestarting(true);
    try {
      await onRestart();
    } finally {
      setRestarting(false);
    }
  };

  const handleCopyUrl = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const botTelegramUrl = botInfo.username ? `https://t.me/${botInfo.username}` : null;
  const isWebhookMode = mode === 'webhook';

  return (
    <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-xl">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{botInfo.first_name}</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {isWebhookMode
                  ? lang === 'bn'
                    ? 'Vercel Webhook সক্রিয়'
                    : 'Vercel Webhook Active'
                  : lang === 'bn'
                  ? 'লং পোলিং সক্রিয়'
                  : 'Long Polling Active'}
              </span>
            </div>
            <p className="text-sm text-slate-400">
              {botInfo.username ? `@${botInfo.username}` : `Bot ID: ${botInfo.id}`}
            </p>
          </div>
        </div>

        {/* Telegram Direct Chat Button */}
        {botTelegramUrl && (
          <a
            href={botTelegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{lang === 'bn' ? 'টেলিগ্রামে চ্যাট শুরু করুন' : 'Open Bot in Telegram'}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        )}
      </div>

      {/* Webhook endpoint box if in webhook mode */}
      {isWebhookMode && webhookUrl && (
        <div className="mt-4 bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300 font-semibold">
              {lang === 'bn' ? 'Vercel Webhook URL:' : 'Active Webhook Endpoint:'}
            </span>
            <code className="font-mono text-teal-300 truncate max-w-xs">{webhookUrl}</code>
          </div>
          <button
            onClick={handleCopyUrl}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-[11px] cursor-pointer"
          >
            {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}

      {/* Info Card explaining Connection */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200">
              {isWebhookMode
                ? lang === 'bn'
                  ? 'Vercel Serverless Ready'
                  : 'Vercel Serverless Ready'
                : lang === 'bn'
                ? 'ডিরেক্ট লং পোলিং মোড'
                : 'Direct Long Polling'}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              {isWebhookMode
                ? lang === 'bn'
                  ? 'টেলিগ্রাম থেকে যেকোনো হিসাবের রিকোয়েস্ট স্বয়ংক্রিয়ভাবে Vercel-এ চলে আসবে এবং ২৪/৭ ফ্রি চলবে।'
                  : 'Telegram automatically posts to Vercel and calculates results 24/7 for free.'
                : lang === 'bn'
                ? 'কোনো Webhook বা আলাদা URL ট্রিগারের ঝামেলা নেই। সার্ভার সরাসরি টেলিগ্রামের সাথে যুক্ত।'
                : 'Zero webhook configuration. Connects directly to Telegram servers.'}
            </p>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200">
              {lang === 'bn' ? 'লাইভ লগ স্ট্রিমিং' : 'Live Log Stream'}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              {lang === 'bn'
                ? 'যেকোনো মেসেজ ও ক্যালকুলেশন সাথে সাথে নিচের লগ কনসোলে রেকর্ড ও প্রদর্শিত হয়।'
                : 'All messages, queries and calculations stream to the log console below in real time.'}
            </p>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200">
              {lang === 'bn' ? 'তাৎক্ষণিক ফলাফল' : 'Instant Math Execution'}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              {lang === 'bn'
                ? 'চ্যাটে সমীকরণ পাঠানোর সাথে সাথে মিলিসেকেন্ডের মধ্যে উত্তর পেয়ে যাবেন।'
                : 'Answers mathematical problems in milliseconds via safe JavaScript engine.'}
            </p>
          </div>
        </div>
      </div>

      {/* Control Actions */}
      <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>
            {lang === 'bn'
              ? 'টেলিগ্রামে যান এবং যেকোনো অঙ্ক লিখুন (যেমন: 25 * 4 বা sqrt(144))'
              : 'Go to Telegram and send any calculation (e.g. 25 * 4 or sqrt(144))'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            disabled={restarting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${restarting ? 'animate-spin' : ''}`} />
            <span>
              {isWebhookMode
                ? lang === 'bn'
                  ? 'Webhook রি-কানেক্ট'
                  : 'Re-sync Webhook'
                : lang === 'bn'
                ? 'পুনরায় কানেক্ট'
                : 'Restart Worker'}
            </span>
          </button>

          {!isWebhookMode && isPolling && (
            <button
              onClick={handleStop}
              disabled={stopping}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-medium rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              <Power className="w-3.5 h-3.5 text-rose-400" />
              <span>{lang === 'bn' ? 'বট থামান' : 'Stop Bot'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
