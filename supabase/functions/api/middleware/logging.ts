/**
 * ログミドルウェア (Supabase Functions用)
 */

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  requestId?: string;
  userId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  ip?: string;
}

export class SupabaseLogger {
  private requestId: string;
  private startTime: number;
  private userId?: string;

  constructor(request: Request) {
    this.requestId = this.generateRequestId();
    this.startTime = Date.now();
    this.userId = this.extractUserId(request);
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractUserId(request: Request): string | undefined {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return undefined;
    
    // JWTトークンからユーザーIDを抽出する簡易実装
    // 実際の実装では適切なJWTライブラリを使用
    try {
      const token = authHeader.replace('Bearer ', '');
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.user_id;
    } catch {
      return undefined;
    }
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    context?: Record<string, unknown>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      requestId: this.requestId,
      userId: this.userId,
    };
  }

  private outputLog(entry: LogEntry): void {
    const logString = JSON.stringify(entry);
    
    switch (entry.level) {
      case 'debug':
        console.debug(logString);
        break;
      case 'info':
        console.info(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      case 'error':
      case 'fatal':
        console.error(logString);
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('debug', message, context);
    this.outputLog(entry);
  }

  info(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('info', message, context);
    this.outputLog(entry);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('warn', message, context);
    this.outputLog(entry);
  }

  error(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('error', message, context);
    this.outputLog(entry);
  }

  fatal(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry('fatal', message, context);
    this.outputLog(entry);
  }

  // HTTPリクエスト専用のログ
  logRequest(request: Request): void {
    const url = new URL(request.url);
    
    this.info('Request received', {
      method: request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      userAgent: request.headers.get('User-Agent'),
      ip: request.headers.get('CF-Connecting-IP') || 
          request.headers.get('X-Forwarded-For') || 
          request.headers.get('X-Real-IP'),
      contentType: request.headers.get('Content-Type'),
      contentLength: request.headers.get('Content-Length'),
    });
  }

  // HTTPレスポンス専用のログ
  logResponse(request: Request, response: Response): void {
    const duration = Date.now() - this.startTime;
    const url = new URL(request.url);
    
    this.info('Request completed', {
      method: request.method,
      path: url.pathname,
      statusCode: response.status,
      duration,
      contentType: response.headers.get('Content-Type'),
      contentLength: response.headers.get('Content-Length'),
    });
  }

  // エラー専用のログ
  logError(error: Error, request: Request, context?: Record<string, unknown>): void {
    const duration = Date.now() - this.startTime;
    const url = new URL(request.url);
    
    this.error('Request failed', {
      method: request.method,
      path: url.pathname,
      duration,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
    });
  }

  // パフォーマンス測定用
  logPerformance(operation: string, duration: number, context?: Record<string, unknown>): void {
    this.info('Performance metric', {
      operation,
      duration,
      type: 'performance',
      ...context,
    });
  }

  // データベース操作用
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    context?: Record<string, unknown>
  ): void {
    this.info('Database operation', {
      operation,
      table,
      duration,
      success,
      type: 'database',
      ...context,
    });
  }

  getRequestId(): string {
    return this.requestId;
  }
}

// リクエストログミドルウェア
export const createRequestLogger = () => {
  return (request: Request): SupabaseLogger => {
    const logger = new SupabaseLogger(request);
    logger.logRequest(request);
    return logger;
  };
};

// レスポンスログミドルウェア
export const logResponse = (
  logger: SupabaseLogger,
  request: Request,
  response: Response
): void => {
  logger.logResponse(request, response);
};

// エラーログミドルウェア
export const logError = (
  logger: SupabaseLogger,
  error: Error,
  request: Request,
  context?: Record<string, unknown>
): void => {
  logger.logError(error, request, context);
};

// パフォーマンス測定用のデコレータ
export const measurePerformance = async <T>(
  logger: SupabaseLogger,
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    logger.logPerformance(operation, duration, { ...context, success: true });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logPerformance(operation, duration, { ...context, success: false, error });
    throw error;
  }
};

// データベース操作の測定
export const measureDatabaseOperation = async <T>(
  logger: SupabaseLogger,
  operation: string,
  table: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> => {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    logger.logDatabaseOperation(operation, table, duration, true, context);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logDatabaseOperation(operation, table, duration, false, { ...context, error });
    throw error;
  }
};