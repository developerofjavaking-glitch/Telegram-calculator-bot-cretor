import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Trash2,
  Copy,
  Check,
  Pause,
  Play,
  Filter,
  Search,
  Sparkles,
  ArrowDownCircle,
  Radio,
} from 'lucide-react';
import { LogEntry } from '../types';

interface Props {
  lang: 'bn' | 'en';
  isBotRunning: boolean;
}

export const LiveLogViewer: React.FC<Props> = ({ lang, isBotRunning }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Poll for logs every 1.5s
  useEffect(() => {
    if (isPaused) return;

    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/logs?limit=150');
        const data = await res.json();
        if (data.logs && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 1500);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Handle auto scroll
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = 0; // Since logs are newest-first
    }
  }, [logs, autoScroll]);

  const handleClearLogs = async () => {
    try {
      await fetch('/api/logs/clear', { method: 'POST' });
      setLogs([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.category.toUpperCase()}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (filter === 'calc' && log.category !== 'calc') return false;
    if (filter === 'telegram' && log.category !== 'telegram') return false;
    if (filter === 'keypad' && log.category !== 'keypad') return false;
    if (filter === 'system' && log.category !== 'system') return false;
    if (filter === 'error' && log.level !== 'error' && log.level !== 'warn') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return log.message.toLowerCase().includes(q) || log.category.toLowerCase().includes(q);
    }
    return true;
  });

  const calcCount = logs.filter((l) => l.category === 'calc').length;
  const msgCount = logs.filter((l) => l.category === 'telegram').length;
  const errCount = logs.filter((l) => l.level === 'error').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[580px]">
      {/* Console Header Bar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 rounded-md border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${isBotRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-mono font-semibold text-slate-200">
              {lang === 'bn' ? 'লাইভ লগ সিস্টেম (Live Log Console)' : 'Real-Time Bot Logs'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-emerald-400">
              🧮 {calcCount} {lang === 'bn' ? 'হিসাব' : 'calcs'}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-sky-400">
              📥 {msgCount} {lang === 'bn' ? 'মেসেজ' : 'msgs'}
            </span>
            {errCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800 font-mono text-rose-400">
                ⚠️ {errCount}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer border ${
              isPaused
                ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
            }`}
            title={isPaused ? 'Resume stream' : 'Pause stream'}
          >
            {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
            <span className="hidden md:inline">{isPaused ? (lang === 'bn' ? 'চালু' : 'Resume') : (lang === 'bn' ? 'পজ' : 'Pause')}</span>
          </button>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer border ${
              autoScroll
                ? 'bg-sky-950/60 border-sky-800 text-sky-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Auto-scroll"
          >
            <ArrowDownCircle className="w-3 h-3" />
            <span className="hidden md:inline">{lang === 'bn' ? 'অটো-স্ক্রল' : 'Auto-scroll'}</span>
          </button>

          <button
            onClick={handleCopyLogs}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded text-xs transition cursor-pointer"
            title="Copy all logs"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span className="hidden md:inline">{copied ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-300 rounded text-xs transition cursor-pointer"
            title="Clear logs"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden md:inline">{lang === 'bn' ? 'ক্লিয়ার' : 'Clear'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-[#0b1019] px-4 py-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          <Filter className="w-3 h-3 text-slate-500 mr-1" />
          {[
            { id: 'all', label: lang === 'bn' ? 'সব লগ (All)' : 'All' },
            { id: 'calc', label: '🧮 ' + (lang === 'bn' ? 'হিসাব (Calc)' : 'Math') },
            { id: 'telegram', label: '📥 ' + (lang === 'bn' ? 'মেসেজ (Msg)' : 'Messages') },
            { id: 'keypad', label: '🔘 ' + (lang === 'bn' ? 'কিপ্যাড' : 'Keypad') },
            { id: 'system', label: '⚙️ ' + (lang === 'bn' ? 'সিস্টেম' : 'System') },
            { id: 'error', label: '⚠️ ' + (lang === 'bn' ? 'এরর' : 'Errors') },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer whitespace-nowrap ${
                filter === item.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:flex-initial sm:w-48">
          <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'bn' ? 'লগ খুঁজুন...' : 'Search logs...'}
            className="w-full bg-slate-900 border border-slate-800 rounded-md pl-7 pr-2.5 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Terminal Log Stream Window */}
      <div
        ref={logsContainerRef}
        className="flex-1 p-4 bg-[#070b12] overflow-y-auto font-mono text-xs text-slate-300 space-y-1.5 scrollbar-thin selection:bg-sky-500 selection:text-white"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2 py-12">
            <Radio className="w-8 h-8 text-slate-700 animate-pulse" />
            <p className="text-sm font-sans font-medium text-slate-400">
              {lang === 'bn' ? 'এখনো কোনো লগ এন্ট্রি নেই' : 'No logs recorded yet'}
            </p>
            <p className="text-xs text-slate-600 max-w-sm">
              {lang === 'bn'
                ? 'বটটি চালু করুন এবং টেলিগ্রামে মেসেজ বা সমীকরণ পাঠান—এখানে লাইভ লগ দেখতে পাবেন।'
                : 'Start the bot and send a math message in Telegram—live events will stream here.'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            // Level styling
            let levelBadge = 'text-sky-400';
            let lineBg = 'hover:bg-slate-900/60';

            if (log.level === 'success') {
              levelBadge = 'text-emerald-400';
            } else if (log.level === 'warn') {
              levelBadge = 'text-amber-400';
              lineBg = 'bg-amber-950/20 hover:bg-amber-950/40';
            } else if (log.level === 'error') {
              levelBadge = 'text-rose-400';
              lineBg = 'bg-rose-950/30 hover:bg-rose-950/50';
            }

            // Category tag color
            let catColor = 'text-slate-400 border-slate-800';
            if (log.category === 'calc') catColor = 'text-teal-300 border-teal-900/80 bg-teal-950/40';
            if (log.category === 'telegram') catColor = 'text-sky-300 border-sky-900/80 bg-sky-950/40';
            if (log.category === 'keypad') catColor = 'text-indigo-300 border-indigo-900/80 bg-indigo-950/40';
            if (log.category === 'system') catColor = 'text-purple-300 border-purple-900/80 bg-purple-950/40';

            return (
              <div
                key={log.id}
                className={`py-1 px-2 rounded flex flex-col sm:flex-row items-start sm:items-baseline gap-2 transition leading-relaxed ${lineBg}`}
              >
                <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-slate-500 select-none">
                  <span>{log.timestamp}</span>
                  <span className={`px-1.5 py-0.2 rounded border text-[10px] uppercase font-bold tracking-wider ${catColor}`}>
                    {log.category}
                  </span>
                </div>

                <div className={`flex-1 break-all ${levelBadge}`}>
                  <span>{log.message}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-teal-400" />
          <span>
            {lang === 'bn'
              ? 'লং পোলিং দিয়ে টেলিগ্রাম থেকে রিয়েল-টাইমে আপডেট আসছে (কোনো Webhook প্রয়োজন নেই)'
              : 'Direct Long Polling active. Zero webhook configuration required.'}
          </span>
        </div>
        <div>
          <span>{filteredLogs.length} {lang === 'bn' ? 'টি লগ দেখানো হচ্ছে' : 'logs displayed'}</span>
        </div>
      </div>
    </div>
  );
};
