export interface BotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

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

export interface LogEntry {
  id: string;
  timestamp: string;
  timeRaw: number;
  level: 'info' | 'success' | 'warn' | 'error';
  category: 'system' | 'telegram' | 'calc' | 'keypad';
  message: string;
  details?: LogDetails;
}

export interface BotWorkerStatus {
  isRunning: boolean;
  botInfo?: BotInfo;
  startedAt?: string;
  totalUpdates?: number;
}

export interface SimulatorMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  display?: string;
  isKeypad?: boolean;
}
