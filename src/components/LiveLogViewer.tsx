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
  Download,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { LogEntry, LogStats } from '../types';
import { safeFetchJson } from '../utils/api';

interface Props {
  lang: 'bn' | 'en';
  isBotRunning: boolean;
}

export const LiveLogViewer: React.FC<Props> = ({ lang, isBotRunning }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats>({
    totalLogs: 0,
    totalCalculations: 0,
    totalMessages: 0,
    totalKeypadClicks: 0,
    totalErrors: 0,
    uniqueUsersCount: 1,
    avgExecutionTimeMs: 0.8,
    successRate: 100,
    startedAt: Date.now(),
  });

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [opTypeFilter, setOpTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isSimulatingTraffic, setIsSimulatingTraffic] = useState(false);

  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Connect to Server-Sent Events (SSE) Stream for real-time live logs
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    if (!isPaused) {
      try {
        eventSource = new EventSource('/api/logs/stream');

        eventSource.onopen = () => {
          setIsStreaming(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'init' && data.stats) {
              setStats(data.stats);
            } else if (data.type === 'log' && data.entry) {
              setLogs((prev) => {
                // Avoid duplicates
                if (prev.some((l) => l.id === data.entry.id)) return prev;
                return [data.entry, ...prev.slice(0, 499)];
              });
              if (data.stats) {
                setStats(data.stats);
              }
            }
          } catch (err) {
            console.error('SSE parse error:', err);
          }
        };

        eventSource.onerror = () => {
          setIsStreaming(false);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
        };
      } catch {
        setIsStreaming(false);
      }

      // Initial fetch & fallback polling every 2s
      const pollLogs = async () => {
        const res = await safeFetchJson<{ logs: LogEntry[]; stats?: LogStats }>('/api/logs?limit=150');
        if (res.ok && res.data) {
          if (Array.isArray(res.data.logs)) {
            setLogs(res.data.logs);
          }
          if (res.data.stats) {
            setStats(res.data.stats);
          }
        }
      };

      pollLogs();
      fallbackInterval = setInterval(pollLogs, 2000);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [isPaused]);

  // Handle auto scroll
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  const handleClearLogs = async () => {
    await safeFetchJson('/api/logs/clear', { method: 'POST' });
    setLogs([]);
    setSelectedLog(null);
  };

  const handleCopyAll = () => {
    const text = logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.category.toUpperCase()}] [${l.level.toUpperCase()}] ${l.message}` +
          (l.details ? ` | ${JSON.stringify(l.details)}` : '')
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `telegram-bot-logs-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleTriggerTest = async () => {
    setIsSimulatingTraffic(true);
    try {
      await safeFetchJson('/api/logs/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    } finally {
      setIsSimulatingTraffic(false);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (opTypeFilter !== 'all' && log.details?.opType !== opTypeFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = log.message.toLowerCase().includes(q);
      const matchCat = log.category.toLowerCase().includes(q);
      const matchUser = log.details?.user?.toLowerCase().includes(q);
      const matchInput = log.details?.input?.toLowerCase().includes(q);
      const matchResult = log.details?.result?.toLowerCase().includes(q);
      return matchMsg || matchCat || matchUser || matchInput || matchResult;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Live Analytics KPI Header Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">
              {lang === 'bn' ? 'মোট হিসাব' : 'Calculations'}
            </div>
            <div className="text-lg font-bold text-teal-300 font-mono">
              {stats.totalCalculations}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">
              {lang === 'bn' ? 'টেলিগ্রাম মেসেজ' : 'Messages'}
            </div>
            <div className="text-lg font-bold text-sky-300 font-mono">
              {stats.totalMessages}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">
              {lang === 'bn' ? 'গড় সময়' : 'Avg Latency'}
            </div>
            <div className="text-lg font-bold text-indigo-300 font-mono">
              {stats.avgExecutionTimeMs}ms
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">
              {lang === 'bn' ? 'সফলতার হার' : 'Success Rate'}
            </div>
            <div className="text-lg font-bold text-emerald-300 font-mono">
              {stats.successRate}%
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">
              {lang === 'bn' ? 'ব্যবহারকারী' : 'Active Users'}
            </div>
            <div className="text-lg font-bold text-purple-300 font-mono">
              {stats.uniqueUsersCount}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3 shadow-lg">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">
              {lang === 'bn' ? 'কিপ্যাড প্রেস' : 'Keypad Clicks'}
            </div>
            <div className="text-lg font-bold text-amber-300 font-mono">
              {stats.totalKeypadClicks}
            </div>
          </div>
        </div>
      </div>

      {/* Main Console Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[620px]">
        {/* Top Console Bar */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isStreaming
                    ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
                    : isBotRunning
                    ? 'bg-teal-400'
                    : 'bg-slate-600'
                }`}
              ></span>
              <Terminal className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs font-mono font-bold text-slate-200">
                {lang === 'bn' ? 'লাইভ লগ ও টেলিমেট্রি' : 'Live Bot Telemetry'}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {isStreaming ? 'SSE LIVE' : 'POLLING'}
              </span>
            </div>

            {/* Test Traffic Button */}
            <button
              onClick={handleTriggerTest}
              disabled={isSimulatingTraffic}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-50"
              title="Send a sample calculation into the logger"
            >
              <Zap className={`w-3.5 h-3.5 ${isSimulatingTraffic ? 'animate-spin' : ''}`} />
              <span>{lang === 'bn' ? 'টেস্ট হিসাব পাঠান' : 'Simulate Test Event'}</span>
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                isPaused
                  ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
              }`}
              title={isPaused ? 'Resume live stream' : 'Pause stream'}
            >
              {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
              <span className="hidden md:inline">
                {isPaused ? (lang === 'bn' ? 'চালু' : 'Resume') : (lang === 'bn' ? 'পজ' : 'Pause')}
              </span>
            </button>

            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
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
              onClick={handleCopyAll}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-lg text-xs transition cursor-pointer"
              title="Copy all logs"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span className="hidden md:inline">{copied ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied') : (lang === 'bn' ? 'কপি' : 'Copy')}</span>
            </button>

            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-lg text-xs transition cursor-pointer"
              title="Export as JSON"
            >
              <Download className="w-3 h-3" />
              <span className="hidden md:inline">{lang === 'bn' ? 'এক্সপোর্ট' : 'JSON'}</span>
            </button>

            <button
              onClick={handleClearLogs}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-300 rounded-lg text-xs transition cursor-pointer"
              title="Clear all logs"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden md:inline">{lang === 'bn' ? 'ক্লিয়ার' : 'Clear'}</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-[#0b1019] px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Categories */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            <Filter className="w-3 h-3 text-slate-500 mr-1 shrink-0" />
            {[
              { id: 'all', label: lang === 'bn' ? 'সব (All)' : 'All' },
              { id: 'calc', label: '🧮 ' + (lang === 'bn' ? 'হিসাব' : 'Math') },
              { id: 'telegram', label: '📥 ' + (lang === 'bn' ? 'মেসেজ' : 'Msgs') },
              { id: 'keypad', label: '🔘 ' + (lang === 'bn' ? 'কিপ্যাড' : 'Keypad') },
              { id: 'system', label: '⚙️ ' + (lang === 'bn' ? 'সিস্টেম' : 'System') },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setCategoryFilter(item.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                  categoryFilter === item.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* Level Select */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="ml-2 bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="all">Level: All</option>
              <option value="success">Success (✅)</option>
              <option value="info">Info (ℹ️)</option>
              <option value="warn">Warnings (⚠️)</option>
              <option value="error">Errors (❌)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:flex-initial sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'bn' ? 'ব্যবহারকারী বা সমীকরণ খুঁজুন...' : 'Search user, equation, result...'}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Log Viewer Body Split Layout (Logs list + Inspector drawer) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Logs List Window */}
          <div
            ref={logsContainerRef}
            className="flex-1 p-3 bg-[#060a11] overflow-y-auto font-mono text-xs text-slate-300 space-y-1.5 scrollbar-thin select-text"
          >
            {filteredLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2.5 py-12">
                <Radio className="w-8 h-8 text-slate-700 animate-pulse" />
                <p className="text-sm font-sans font-medium text-slate-400">
                  {lang === 'bn' ? 'কোনো লগ খুঁজে পাওয়া যায়নি' : 'No matching log entries'}
                </p>
                <p className="text-xs text-slate-600 max-w-sm">
                  {lang === 'bn'
                    ? 'টেলিগ্রামে আপনার বটকে মেসেজ পাঠান বা উপরের "টেস্ট হিসাব পাঠান" বাটনে ক্লিক করুন।'
                    : 'Send a math equation to your Telegram bot or click "Simulate Test Event" above.'}
                </p>
                <button
                  onClick={handleTriggerTest}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-sans text-xs font-semibold cursor-pointer transition shadow"
                >
                  🚀 {lang === 'bn' ? 'নমুনা হিসাব টেস্ট করুন' : 'Simulate Sample Calculation'}
                </button>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;

                let levelColor = 'text-sky-400';
                let borderIndicator = 'border-l-sky-500';
                if (log.level === 'success') {
                  levelColor = 'text-emerald-400';
                  borderIndicator = 'border-l-emerald-500';
                } else if (log.level === 'warn') {
                  levelColor = 'text-amber-400';
                  borderIndicator = 'border-l-amber-500';
                } else if (log.level === 'error') {
                  levelColor = 'text-rose-400';
                  borderIndicator = 'border-l-rose-500';
                }

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(isSelected ? null : log)}
                    className={`py-1.5 px-2.5 rounded-md border-l-2 ${borderIndicator} transition cursor-pointer flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-2 ${
                      isSelected
                        ? 'bg-slate-800/90 ring-1 ring-teal-500/40'
                        : 'bg-slate-950/60 hover:bg-slate-900 border-y border-r border-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 shrink-0 text-[11px] select-none">
                      <span className="text-slate-500 font-mono">{log.timestamp}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold tracking-wider ${
                          log.category === 'calc'
                            ? 'bg-teal-950/60 text-teal-300 border border-teal-800/60'
                            : log.category === 'telegram'
                            ? 'bg-sky-950/60 text-sky-300 border border-sky-800/60'
                            : log.category === 'keypad'
                            ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/60'
                            : 'bg-purple-950/60 text-purple-300 border border-purple-800/60'
                        }`}
                      >
                        {log.category}
                      </span>
                      {log.details?.user && (
                        <span className="text-slate-400 font-sans text-[11px] max-w-[120px] truncate">
                          {log.details.user}
                        </span>
                      )}
                    </div>

                    <div className={`flex-1 break-all ${levelColor} leading-relaxed font-mono`}>
                      <span>{log.message}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-[11px]">
                      {log.details?.durationMs !== undefined && (
                        <span className="text-slate-500 text-[10px] font-mono">
                          ⚡ {log.details.durationMs}ms
                        </span>
                      )}
                      <Eye className="w-3.5 h-3.5 text-slate-600 hover:text-teal-400 transition" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Detailed Inspector Drawer (When log is selected) */}
          {selectedLog && (
            <div className="w-80 sm:w-96 bg-[#0a0f19] border-l border-slate-800 p-4 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 text-xs">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span className="font-bold text-slate-200">
                      {lang === 'bn' ? 'লগ বিবরণ (Details)' : 'Log Inspector'}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="p-1 rounded text-slate-500 hover:text-slate-200 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 font-sans">
                  {/* Message & Time */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Event Message</span>
                    <p className="font-mono text-xs text-teal-300 mt-0.5 break-all">
                      {selectedLog.message}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[10px]">TIME</span>
                      {selectedLog.timestamp}
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">CATEGORY</span>
                      <span className="uppercase text-teal-400">{selectedLog.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">LEVEL</span>
                      <span className="uppercase font-bold text-slate-200">{selectedLog.level}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">LATENCY</span>
                      {selectedLog.details?.durationMs !== undefined
                        ? `${selectedLog.details.durationMs}ms`
                        : 'instant'}
                    </div>
                  </div>

                  {/* Expression Breakdown */}
                  {selectedLog.details?.input && (
                    <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Math Breakdown</span>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Input:</span>
                        <span className="text-sky-300 font-bold">{selectedLog.details.input}</span>
                      </div>
                      {selectedLog.details.result && (
                        <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-slate-800">
                          <span className="text-slate-400">Result:</span>
                          <span className="text-emerald-400 font-bold">= {selectedLog.details.result}</span>
                        </div>
                      )}
                      {selectedLog.details.opType && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Operation:</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px] uppercase">
                            {selectedLog.details.opType}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Telegram Metadata */}
                  {selectedLog.details?.user && (
                    <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg space-y-1 text-[11px]">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Telegram User</span>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Sender:</span>
                        <span className="font-semibold text-slate-200">{selectedLog.details.user}</span>
                      </div>
                      {selectedLog.details.chatId && (
                        <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                          <span>Chat ID:</span>
                          <span>{selectedLog.details.chatId}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Raw JSON Details */}
                  {selectedLog.details && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Raw Structured JSON
                      </span>
                      <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 overflow-x-auto max-h-36">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'জেসন কপি করুন' : 'Copy JSON'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Console Status Footer */}
        <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              {isStreaming
                ? lang === 'bn'
                  ? 'সার্ভার-সেন্ট ইভেন্টস (SSE) রিয়েল-টাইম কানেক্টেড'
                  : 'Server-Sent Events (SSE) Live Stream Active'
                : lang === 'bn'
                ? 'পোলিং মোড সক্রিয়'
                : 'Polling Mode Active'}
            </span>
          </div>
          <div className="font-mono">
            <span>
              {filteredLogs.length} / {logs.length} {lang === 'bn' ? 'টি এন্ট্রি' : 'entries'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
