/**
 * レート制限ミドルウェア
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export interface RateLimitOptions {
  windowMs: number; // ウィンドウ時間（ミリ秒）
  maxRequests: number; // 最大リクエスト数
  keyGenerator?: (request: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export class RateLimiter {
  private store: RateLimitStore = {};
  private options: Required<RateLimitOptions>;

  constructor(options: RateLimitOptions) {
    this.options = {
      keyGenerator: (request) => this.getClientIP(request),
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...options
    };
  }

  private getClientIP(request: Request): string {
    // CF-Connecting-IP (Cloudflare)
    const cfIP = request.headers.get('CF-Connecting-IP');
    if (cfIP) return cfIP;

    // X-Forwarded-For
    const forwardedFor = request.headers.get('X-Forwarded-For');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    // X-Real-IP
    const realIP = request.headers.get('X-Real-IP');
    if (realIP) return realIP;

    // フォールバック
    return 'unknown';
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();
    for (const key in this.store) {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    }
  }

  public checkLimit(request: Request): {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
  } {
    this.cleanExpiredEntries();

    const key = this.options.keyGenerator(request);
    const now = Date.now();
    const windowStart = now;
    const resetTime = windowStart + this.options.windowMs;

    let entry = this.store[key];
    
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime
      };
      this.store[key] = entry;
    }

    const allowed = entry.count < this.options.maxRequests;
    const remaining = Math.max(0, this.options.maxRequests - entry.count);

    if (allowed) {
      entry.count++;
    }

    return {
      allowed,
      limit: this.options.maxRequests,
      remaining: remaining - (allowed ? 1 : 0),
      resetTime: entry.resetTime
    };
  }

  public createHeaders(limitInfo: ReturnType<RateLimiter['checkLimit']>): Headers {
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', limitInfo.limit.toString());
    headers.set('X-RateLimit-Remaining', limitInfo.remaining.toString());
    headers.set('X-RateLimit-Reset', Math.ceil(limitInfo.resetTime / 1000).toString());
    return headers;
  }
}

export const createRateLimitMiddleware = (options: RateLimitOptions) => {
  const limiter = new RateLimiter(options);

  return (request: Request): {
    allowed: boolean;
    headers: Headers;
    error?: string;
  } => {
    const limitInfo = limiter.checkLimit(request);
    const headers = limiter.createHeaders(limitInfo);

    if (!limitInfo.allowed) {
      return {
        allowed: false,
        headers,
        error: 'Too Many Requests'
      };
    }

    return {
      allowed: true,
      headers
    };
  };
};