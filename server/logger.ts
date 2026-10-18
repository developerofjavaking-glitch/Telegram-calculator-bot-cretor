export interface LogDetails {
  user?: string;
  userId?: number | string;
  chatId?: number | string;
  messageId?: number | string;
  rawText?: string;
  input?: string;
  result?: string;
  error?: string;
  durationMs?: number;
  opType?: 'arithmetic' | 'percentage' | 'root' | 'power' | 'trig' | 'keypad' | 'command' | 'system';
  button?: string;
  rawUpdate?: any;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  timeRaw: number;
  level: 'info' | 'success' | 'warn' | 'error';
  category: 'system' | 'telegram' | 'calc' | 'keypad';
  message: string;
  details?: LogDetails;
}

export interface LogStats {
  totalLogs: number;
  totalCalculations: number;
  totalMessages: number;
  totalKeypadClicks: number;
  totalErrors: number;
  uniqueUsersCount: number;
  avgExecutionTimeMs: number;
  successRate: number;
  startedAt: number;
}

class LogManager {
  private logs: LogEntry[] = [];
  private maxLogs: number = 800;
  private listeners: Set<(log: LogEntry) => void> = new Set();

  // Metrics counters
  private totalCalculations = 0;
  private totalMessages = 0;
  private totalKeypadClicks = 0;
  private totalErrors = 0;
  private executionTimes: number[] = [];
  private uniqueUsers = new Set<string>();
  private startedAt = Date.now();

  constructor() {
    this.addLog('system', 'info', 'Real-time telemetry and logging system active. Awaiting bot activity.', {
      opType: 'system',
    });
  }

  addLog(
    category: LogEntry['category'],
    level: LogEntry['level'],
    message: string,
    details?: LogDetails
  ): LogEntry {
    const now = new Date();
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      timeRaw: now.getTime(),
      level,
      category,
      message,
      details,
    };

    // Update metrics
    if (category === 'calc') {
      this.totalCalculations++;
      if (details?.durationMs !== undefined) {
        this.executionTimes.push(details.durationMs);
        if (this.executionTimes.length > 100) this.executionTimes.shift();
      }
    }
    if (category === 'telegram') {
      this.totalMessages++;
    }
    if (category === 'keypad') {
      this.totalKeypadClicks++;
    }
    if (level === 'error') {
      this.totalErrors++;
    }
    if (details?.user) {
      this.uniqueUsers.add(details.user);
    }

    this.logs.unshift(entry); // newest first
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Notify real-time listeners (SSE, WebSockets, callbacks)
    this.listeners.forEach((listener) => {
      try {
        listener(entry);
      } catch (err) {
        console.error('Error in log listener:', err);
      }
    });

    return entry;
  }

  getLogs(since?: number, limit: number = 100, category?: string, level?: string): LogEntry[] {
    let result = this.logs;
    if (since) {
      result = result.filter((log) => log.timeRaw > since);
    }
    if (category && category !== 'all') {
      result = result.filter((log) => log.category === category);
    }
    if (level && level !== 'all') {
      result = result.filter((log) => log.level === level);
    }
    return result.slice(0, limit);
  }

  getStats(): LogStats {
    const avgTime =
      this.executionTimes.length > 0
        ? Number((this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length).toFixed(1))
        : 0.8;

    const totalActions = this.totalCalculations + this.totalMessages;
    const successRate = totalActions > 0
      ? Number((((totalActions - this.totalErrors) / totalActions) * 100).toFixed(1))
      : 100;

    return {
      totalLogs: this.logs.length,
      totalCalculations: this.totalCalculations,
      totalMessages: this.totalMessages,
      totalKeypadClicks: this.totalKeypadClicks,
      totalErrors: this.totalErrors,
      uniqueUsersCount: this.uniqueUsers.size || 1,
      avgExecutionTimeMs: avgTime,
      successRate: Math.max(0, Math.min(100, successRate)),
      startedAt: this.startedAt,
    };
  }

  clearLogs() {
    this.logs = [];
    this.totalCalculations = 0;
    this.totalMessages = 0;
    this.totalKeypadClicks = 0;
    this.totalErrors = 0;
    this.executionTimes = [];
    this.addLog('system', 'info', 'All log entries and metrics have been cleared.', { opType: 'system' });
  }

  subscribe(listener: (log: LogEntry) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const logger = new LogManager();
