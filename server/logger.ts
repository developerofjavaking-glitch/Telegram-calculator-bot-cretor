export interface LogEntry {
  id: string;
  timestamp: string;
  timeRaw: number;
  level: 'info' | 'success' | 'warn' | 'error';
  category: 'system' | 'telegram' | 'calc' | 'keypad';
  message: string;
  details?: Record<string, any>;
}

class LogManager {
  private logs: LogEntry[] = [];
  private maxLogs: number = 500;
  private listeners: Set<(log: LogEntry) => void> = new Set();

  constructor() {
    this.addLog('system', 'info', 'Logging system initialized. Ready to record bot activity.');
  }

  addLog(
    category: LogEntry['category'],
    level: LogEntry['level'],
    message: string,
    details?: Record<string, any>
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

    this.logs.unshift(entry); // newest first
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener(entry);
      } catch (err) {
        console.error('Error in log listener:', err);
      }
    });

    return entry;
  }

  getLogs(since?: number, limit: number = 100): LogEntry[] {
    if (since) {
      return this.logs.filter((log) => log.timeRaw > since);
    }
    return this.logs.slice(0, limit);
  }

  clearLogs() {
    this.logs = [];
    this.addLog('system', 'info', 'Logs cleared by user.');
  }

  subscribe(listener: (log: LogEntry) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const logger = new LogManager();
