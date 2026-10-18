import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Send,
  Power,
  RotateCw,
  CheckCircle2,
  Activity,
  Bot,
  Zap,
  Clock,
  Smartphone,
  ShieldCheck,
  Play,
  PauseCircle,
  LogOut,
} from 'lucide-react';
import { BotInfo } from '../types';

interface Props {
  botInfo: BotInfo;
  token: string;
  isPolling: boolean;
  onStop: () => Promise<void> | void;
  onRestart: () => Promise<void> | void;
  onDisconnect?: () => Promise<void> | void;
  lang: 'bn' | 'en';
}

export const BotActiveCard: React.FC<Props> = ({
  botInfo,
  isPolling,
  onStop,
  onRestart,
  onDisconnect,
  lang,
}) => {
  const [stopping, setStopping] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [secondsActive, setSecondsActive] = useState(0);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const [wakeLockObj, setWakeLockObj] = useState<any>(null);

  // Live session timer (only ticks when bot is running)
  useEffect(() => {
    if (!isPolling) return;
    const timer = setInterval(() => {
      setSecondsActive((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPolling]);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  // Toggle Screen Wake Lock for mobile users
  const toggleWakeLock = async () => {
    if ('wakeLock' in navigator) {
      if (!isWakeLockActive) {
        try {
          const lock = await (navigator as any).wakeLock.request('screen');
          setWakeLockObj(lock);
          setIsWakeLockActive(true);
        } catch {
          setIsWakeLockActive(false);
        }
      } else {
        if (wakeLockObj) {
          wakeLockObj.release();
          setWakeLockObj(null);
        }
        setIsWakeLockActive(false);
      }
    }
  };

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

  const botTelegramUrl = botInfo.username ? `https://t.me/${botInfo.username}` : null;

  return (
    <div
      className={`rounded-2xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden transition-all duration-300 ${
        isPolling
          ? 'bg-slate-900/95 border-2 border-emerald-500/50 shadow-emerald-950/30'
          : 'bg-slate-900/95 border-2 border-rose-500/40 shadow-rose-950/20'
      }`}
    >
      {/* Background ambient glow */}
      <div
        className={`absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all ${
          isPolling ? 'bg-emerald-500/10' : 'bg-rose-500/10'
        }`}
      />

      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-xl transition-all ${
              isPolling
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-emerald-500/20'
                : 'bg-gradient-to-tr from-slate-700 to-slate-800 shadow-slate-900/50 text-slate-400'
            }`}
          >
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{botInfo.first_name}</h2>
              {isPolling ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {lang === 'bn' ? 'ওয়েব সেশনে লাইভ চলছে' : 'Live on this Webpage'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-950">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  {lang === 'bn' ? 'বট বন্ধ রয়েছে' : 'Bot is Stopped'}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 font-mono">
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
            className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-sky-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{lang === 'bn' ? 'টেলিগ্রামে চ্যাট শুরু করুন' : 'Open Bot in Telegram'}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        )}
      </div>

      {/* Core Highlight: Active as long as this webpage is open vs Stopped Banner */}
      {isPolling ? (
        <div className="mt-5 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                <span>
                  {lang === 'bn'
                    ? '💡 এই পেজটি ওপেন রাখুন — যতক্ষণ এখানে থাকবেন, বট ততক্ষণ কাজ করবে'
                    : '💡 Keep this page open — your bot will run as long as you stay here'}
                </span>
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {lang === 'bn'
                  ? 'টেলিগ্রামে যেকোনো সমীকরণ পাঠালে সাথে সাথে এই ওয়েব সেশনে হিসাব হয়ে উত্তর চলে যাবে।'
                  : 'Send any math equation in Telegram; it evaluates live in this web session.'}
              </div>
            </div>
          </div>

          {/* Live Session Timer */}
          <div className="shrink-0 bg-slate-950 px-3.5 py-1.5 rounded-lg border border-emerald-500/40 flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">UPTIME:</span>
            <span className="text-emerald-400 font-bold text-sm">{formatTime(secondsActive)}</span>
          </div>
        </div>
      ) : (
        <div className="mt-5 bg-gradient-to-r from-rose-950/50 via-slate-900 to-amber-950/30 border border-rose-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
              <PauseCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                <span>
                  {lang === 'bn'
                    ? '🛑 বটটি সাময়িকভাবে থামানো রয়েছে'
                    : '🛑 Bot is currently paused / stopped'}
                </span>
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                {lang === 'bn'
                  ? 'টেলিগ্রামে কোনো অঙ্ক পাঠালে এখন উত্তর দেওয়া হবে না। আবার চালু করতে নিচের "বট চালু করুন" চাপুন।'
                  : 'No Telegram messages will be answered. Click "Start / Resume Bot" to activate again.'}
              </div>
            </div>
          </div>

          <div className="shrink-0 bg-slate-950 px-3.5 py-1.5 rounded-lg border border-rose-500/40 flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">STATUS:</span>
            <span className="text-rose-400 font-bold text-sm">{lang === 'bn' ? 'বন্ধ (OFF)' : 'STOPPED'}</span>
          </div>
        </div>
      )}

      {/* Info Perks */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isPolling ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200">
              {lang === 'bn' ? 'সরাসরি ব্রাউজার সংযোগ' : 'Direct Browser Session'}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              {lang === 'bn'
                ? 'কোনো জটিল হোস্টিং কনফিগারেশন লাগবে না। পেজ ওপেন থাকলেই বট ১০০% রানিং।'
                : 'No complex hosting setup needed. Runs as long as this tab is open.'}
            </p>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isPolling ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-500'
          }`}>
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200">
              {lang === 'bn' ? 'রিয়েল-টাইম লগিং' : 'Live Log Stream'}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              {lang === 'bn'
                ? 'টেলিগ্রামে কে কী অঙ্ক পাঠাচ্ছে তা নিচের লাইভ লগ কনসোলে সরাসরি দেখা যাবে।'
                : 'See every calculation and user message in the live log console below.'}
            </p>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isPolling ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-800 text-slate-500'
          }`}>
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200">
              {lang === 'bn' ? 'মিলিসেকেন্ডে উত্তর' : 'Instant Math Execution'}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              {lang === 'bn'
                ? 'বাংলা সংখ্যা, সাধারণ অঙ্ক, শতকরা ও রুট সবই মিলিসেকেন্ডে সমাধান হয়।'
                : 'Evaluates Bengali digits, percentages, powers, and roots in milliseconds.'}
            </p>
          </div>
        </div>
      </div>

      {/* Control Actions & Mobile Wake Lock */}
      <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Screen Wake Lock button for mobile users */}
          {'wakeLock' in navigator && (
            <button
              onClick={toggleWakeLock}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                isWakeLockActive
                  ? 'bg-amber-950/50 border-amber-600 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Keep screen awake on phone"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>
                {isWakeLockActive
                  ? lang === 'bn'
                    ? 'স্ক্রিন অন রয়েছে'
                    : 'Screen Awake: ON'
                  : lang === 'bn'
                  ? 'স্ক্রিন অন রাখুন (মোবাইল)'
                  : 'Keep Screen Awake'}
              </span>
            </button>
          )}

          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className={`w-3.5 h-3.5 ${isPolling ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>
              {isPolling
                ? lang === 'bn'
                  ? 'সেশন নিরাপদ ও সক্রিয়'
                  : 'Session Secure & Active'
                : lang === 'bn'
                ? 'সেশন সাময়িক বিরতিতে'
                : 'Session Paused'}
            </span>
          </span>
        </div>

        {/* Buttons to control bot */}
        <div className="flex items-center gap-2">
          {isPolling ? (
            <>
              <button
                onClick={handleRestart}
                disabled={restarting || stopping}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition cursor-pointer disabled:opacity-50"
                title="Restart bot connection"
              >
                <RotateCw className={`w-3.5 h-3.5 ${restarting ? 'animate-spin' : ''}`} />
                <span>{lang === 'bn' ? 'পুনরায় কানেক্ট' : 'Reconnect'}</span>
              </button>

              <button
                onClick={handleStop}
                disabled={stopping}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {stopping ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{lang === 'bn' ? 'থামানো হচ্ছে...' : 'Stopping...'}</span>
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4 text-white" />
                    <span>{lang === 'bn' ? 'বট থামান' : 'Stop Bot'}</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {onDisconnect && (
                <button
                  onClick={onDisconnect}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'বট ডিসকানেক্ট' : 'Disconnect'}</span>
                </button>
              )}

              <button
                onClick={handleRestart}
                disabled={restarting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {restarting ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{lang === 'bn' ? 'চালু হচ্ছে...' : 'Starting...'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-white" />
                    <span>{lang === 'bn' ? 'বট চালু করুন' : 'Start / Resume Bot'}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
