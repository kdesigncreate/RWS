/**
 * 構造化ログシステム
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  sessionId?: string;
  userId?: string;
  batchSize?: number;
  flushInterval?: number;
}

class Logger {
  private config: LoggerConfig;
  private logQueue: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: process.env.NODE_ENV === 'development',
      enableRemote: process.env.NODE_ENV === 'production',
      batchSize: 10,
      flushInterval: 5000,
      ...config
    };

    // 定期的なフラッシュ
    if (this.config.enableRemote && this.config.flushInterval) {
      this.scheduleFlush();
    }

    // ページ離脱時のフラッシュ
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });

      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const configLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= configLevelIndex;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      userId: this.config.userId,
      sessionId: this.config.sessionId,
      requestId: this.generateRequestId(),
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatForConsole(entry: LogEntry): string {
    const { level, message, timestamp, context } = entry;
    const prefix = `[${timestamp}] ${level.toUpperCase()}:`;
    const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : '';
    return `${prefix} ${message}${contextStr}`;
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const formatted = this.formatForConsole(entry);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted);
        break;
    }
  }

  private queueForRemote(entry: LogEntry): void {
    if (!this.config.enableRemote) return;

    this.logQueue.push(entry);

    if (this.logQueue.length >= (this.config.batchSize || 10)) {
      this.flush();
    }
  }

  private scheduleFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    this.flushTimer = setTimeout(() => {
      this.flush();
      this.scheduleFlush();
    }, this.config.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    if (this.config.remoteEndpoint) {
      try {
        await fetch(this.config.remoteEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ logs: logsToSend }),
        });
      } catch (error) {
        // リモートログ送信失敗時はコンソールにフォールバック
        console.error('Failed to send logs to remote endpoint:', error);
        logsToSend.forEach(log => this.logToConsole(log));
      }
    } else {
      // エンドポイントが設定されていない場合は開発環境でのみコンソール出力
      if (process.env.NODE_ENV === 'development') {
        logsToSend.forEach(log => this.logToConsole(log));
      }
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context);
    
    this.logToConsole(entry);
    this.queueForRemote(entry);
  }

  // Public logging methods
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  fatal(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.FATAL, message, context);
  }

  // 特定の用途向けのメソッド
  api(method: string, url: string, status: number, duration: number, context?: Record<string, unknown>): void {
    this.info(`API ${method} ${url}`, {
      ...context,
      method,
      url,
      status,
      duration,
      type: 'api_call'
    });
  }

  performance(metric: string, value: number, context?: Record<string, unknown>): void {
    this.info(`Performance: ${metric}`, {
      ...context,
      metric,
      value,
      type: 'performance'
    });
  }

  userAction(action: string, component: string, context?: Record<string, unknown>): void {
    this.info(`User action: ${action}`, {
      ...context,
      action,
      component,
      type: 'user_action'
    });
  }

  pageView(path: string, referrer?: string, context?: Record<string, unknown>): void {
    this.info(`Page view: ${path}`, {
      ...context,
      path,
      referrer,
      type: 'page_view'
    });
  }

  // 設定の更新
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  setUserId(userId: string): void {
    this.config.userId = userId;
  }

  setSessionId(sessionId: string): void {
    this.config.sessionId = sessionId;
  }

  // 強制的にログをフラッシュ
  forceFlush(): Promise<void> {
    return this.flush();
  }
}

// デフォルトのロガーインスタンス
export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: process.env.NODE_ENV === 'development',
  enableRemote: process.env.NODE_ENV === 'production',
  remoteEndpoint: process.env.NEXT_PUBLIC_LOG_ENDPOINT,
});

// セッションIDの生成と設定
if (typeof window !== 'undefined') {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  logger.setSessionId(sessionId);
}

// エラーハンドリング用のヘルパー
export const logError = (error: Error, context?: Record<string, unknown>): void => {
  logger.error(error.message, {
    ...context,
    stack: error.stack,
    name: error.name,
    type: 'error'
  });
};

// パフォーマンス測定用のヘルパー
export const logPerformance = (name: string, startTime: number, context?: Record<string, unknown>): void => {
  const duration = performance.now() - startTime;
  logger.performance(name, duration, context);
};

// API呼び出しログ用のヘルパー
export const logApiCall = (
  method: string,
  url: string,
  status: number,
  startTime: number,
  context?: Record<string, unknown>
): void => {
  const duration = performance.now() - startTime;
  logger.api(method, url, status, duration, context);
};

// React用のログフック
export const useLogger = () => {
  const logUserAction = (action: string, component: string, context?: Record<string, unknown>) => {
    logger.userAction(action, component, context);
  };

  const logPageView = (path: string, referrer?: string, context?: Record<string, unknown>) => {
    logger.pageView(path, referrer, context);
  };

  return {
    logger,
    logUserAction,
    logPageView,
    logError,
    logPerformance,
    logApiCall,
  };
};

export default logger;