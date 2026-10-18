import { safeFetchJson } from '../utils/api';
import { BotInfo } from '../types';

export interface WebWorkerEvent {
  type: 'status' | 'log' | 'update';
  message?: string;
  botInfo?: BotInfo;
}

class WebBotManager {
  private isRunning: boolean = false;
  private token: string = '';
  private botInfo: BotInfo | null = null;
  private offset: number = 0;
  private sessionStartTime: number = 0;
  private onLogCallback: ((entry: any) => void) | null = null;
  private onStatusChangeCallback: ((isRunning: boolean) => void) | null = null;
  private wakeLock: any = null;
  private pollTimer: any = null;
  private currentAbortController: AbortController | null = null;

  public setCallbacks(
    onLog: (entry: any) => void,
    onStatusChange: (isRunning: boolean) => void
  ) {
    this.onLogCallback = onLog;
    this.onStatusChangeCallback = onStatusChange;
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      botInfo: this.botInfo,
      sessionStartTime: this.sessionStartTime,
    };
  }

  // Request screen wake lock so mobile phone doesn't go to sleep while user is on page
  public async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      }
    } catch {
      // Ignored if not supported
    }
  }

  public releaseWakeLock() {
    try {
      if (this.wakeLock) {
        this.wakeLock.release();
        this.wakeLock = null;
      }
    } catch {
      // Ignored
    }
  }

  public async start(token: string): Promise<{ ok: boolean; botInfo?: BotInfo; description?: string }> {
    await this.stop();
    this.token = token.trim();

    // 1. Verify Bot Token
    const verifyRes = await safeFetchJson<any>('/api/bot/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: this.token }),
    });

    if (!verifyRes.ok || !verifyRes.data?.result) {
      return {
        ok: false,
        description: verifyRes.error || verifyRes.data?.description || 'Invalid Telegram bot token',
      };
    }

    this.botInfo = verifyRes.data.result;
    this.isRunning = true;
    this.sessionStartTime = Date.now();
    this.offset = 0;

    this.requestWakeLock();
    this.onStatusChangeCallback?.(true);

    // Call server to notify start & clear any old webhook
    await safeFetchJson('/api/bot/start-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: this.token, botInfo: this.botInfo }),
    });

    // Start browser polling loop
    this.runLoop();

    return { ok: true, botInfo: this.botInfo || undefined };
  }

  public async stop(): Promise<void> {
    this.isRunning = false;

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    if (this.currentAbortController) {
      try {
        this.currentAbortController.abort();
      } catch {
        // Ignored
      }
      this.currentAbortController = null;
    }

    this.releaseWakeLock();
    this.onStatusChangeCallback?.(false);

    // Inform server so it logs that the bot has stopped
    try {
      await safeFetchJson('/api/bot/stop-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botInfo: this.botInfo, token: this.token }),
      });
    } catch {
      // Ignored
    }
  }

  public async disconnect(): Promise<void> {
    await this.stop();
    this.token = '';
    this.botInfo = null;
    this.offset = 0;
  }

  private async runLoop() {
    if (!this.isRunning || !this.token) return;

    try {
      this.currentAbortController = new AbortController();

      // Poll through server proxy endpoint to handle updates & math safely
      const pollRes = await safeFetchJson<{
        ok: boolean;
        updates?: any[];
        error?: string;
      }>('/api/bot/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: this.token,
          offset: this.offset,
        }),
        signal: this.currentAbortController.signal,
      });

      this.currentAbortController = null;

      // If user clicked stop while poll was in-flight, exit immediately
      if (!this.isRunning) return;

      if (pollRes.ok && pollRes.data?.updates && Array.isArray(pollRes.data.updates)) {
        for (const update of pollRes.data.updates) {
          this.offset = update.update_id + 1;
        }
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Web polling error:', err?.message);
      }
    }

    // Continue loop as long as user is on page and running
    if (this.isRunning) {
      this.pollTimer = setTimeout(() => this.runLoop(), 400);
    }
  }
}

export const webBot = new WebBotManager();
