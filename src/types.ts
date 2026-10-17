export interface BotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  timeRaw: number;
  level: 'info' | 'success' | 'warn' | 'error';
  category: 'system' | 'telegram' | 'calc' | 'keypad';
  message: string;
  details?: Record<string, any>;
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
