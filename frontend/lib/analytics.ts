/**
 * アナリティクストラッキングシステム
 */

import { logger } from './logger';

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

export interface UserProperties {
  userId: string;
  email?: string;
  name?: string;
  role?: string;
  signupDate?: string;
  lastLoginDate?: string;
  [key: string]: unknown;
}

export interface PageViewData {
  path: string;
  title: string;
  referrer?: string;
  searchParams?: Record<string, string>;
  loadTime?: number;
  userAgent?: string;
}

class Analytics {
  private userId: string | null = null;
  private sessionId: string | null = null;
  private isEnabled: boolean;
  private queue: AnalyticsEvent[] = [];

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
    
    if (typeof window !== 'undefined') {
      this.sessionId = this.generateSessionId();
      this.setupGlobalErrorTracking();
      this.setupPerformanceTracking();
    }
  }

  private generateSessionId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.trackEvent('error_occurred', {
        message: event.error?.message || event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        type: 'javascript_error'
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('promise_rejection', {
        reason: event.reason?.toString(),
        type: 'unhandled_promise_rejection'
      });
    });
  }

  private setupPerformanceTracking(): void {
    // Core Web Vitals の測定
    if ('PerformanceObserver' in window) {
      // LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackEvent('core_web_vital', {
          metric: 'LCP',
          value: lastEntry.startTime,
          rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs_improvement' : 'poor'
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const fid = entry.processingStart - entry.startTime;
          this.trackEvent('core_web_vital', {
            metric: 'FID',
            value: fid,
            rating: fid < 100 ? 'good' : fid < 300 ? 'needs_improvement' : 'poor'
          });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // 5秒後にCLSを報告
      setTimeout(() => {
        this.trackEvent('core_web_vital', {
          metric: 'CLS',
          value: clsValue,
          rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs_improvement' : 'poor'
        });
      }, 5000);
    }
  }

  setUserId(userId: string): void {
    this.userId = userId;
    logger.setUserId(userId);
  }

  setUserProperties(properties: UserProperties): void {
    this.trackEvent('user_properties_set', {
      properties,
      type: 'user_update'
    });
  }

  trackEvent(name: string, properties?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: new Date().toISOString(),
      userId: this.userId || undefined,
      sessionId: this.sessionId || undefined,
    };

    this.queue.push(event);
    logger.info(`Analytics event: ${name}`, properties);

    // バッチ送信のロジック（実装は省略）
    this.flushIfNeeded();
  }

  trackPageView(data: PageViewData): void {
    this.trackEvent('page_view', {
      ...data,
      type: 'navigation'
    });
  }

  trackUserAction(action: string, element: string, properties?: Record<string, unknown>): void {
    this.trackEvent('user_action', {
      action,
      element,
      ...properties,
      type: 'interaction'
    });
  }

  trackFormSubmission(formName: string, success: boolean, errors?: string[]): void {
    this.trackEvent('form_submission', {
      formName,
      success,
      errors,
      type: 'form'
    });
  }

  trackSearch(query: string, results: number, filters?: Record<string, unknown>): void {
    this.trackEvent('search', {
      query,
      results,
      filters,
      type: 'search'
    });
  }

  trackApiCall(method: string, endpoint: string, status: number, duration: number): void {
    this.trackEvent('api_call', {
      method,
      endpoint,
      status,
      duration,
      type: 'api'
    });
  }

  trackError(error: Error, context?: Record<string, unknown>): void {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      type: 'error'
    });
  }

  trackConversion(goalName: string, value?: number, properties?: Record<string, unknown>): void {
    this.trackEvent('conversion', {
      goalName,
      value,
      ...properties,
      type: 'conversion'
    });
  }

  trackTiming(category: string, variable: string, duration: number): void {
    this.trackEvent('timing', {
      category,
      variable,
      duration,
      type: 'performance'
    });
  }

  private flushIfNeeded(): void {
    if (this.queue.length >= 10) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const eventsToSend = [...this.queue];
    this.queue = [];

    // 実際の分析サービスへの送信ロジック
    // Google Analytics, Mixpanel, Amplitude等への送信
    try {
      // 例: 自社分析エンドポイントへの送信
      if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
        await fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events: eventsToSend }),
        });
      }
    } catch (error) {
      logger.error('Failed to send analytics events', { error });
    }
  }

  // セッション終了時の処理
  endSession(): void {
    this.trackEvent('session_end', {
      duration: Date.now() - (this.sessionId ? parseInt(this.sessionId.split('_')[1]) : Date.now()),
      type: 'session'
    });
    this.flush();
  }
}

// デフォルトのアナリティクスインスタンス
export const analytics = new Analytics();

// React用のアナリティクスフック
export const useAnalytics = () => {
  const trackPageView = (data: PageViewData) => {
    analytics.trackPageView(data);
  };

  const trackUserAction = (action: string, element: string, properties?: Record<string, unknown>) => {
    analytics.trackUserAction(action, element, properties);
  };

  const trackFormSubmission = (formName: string, success: boolean, errors?: string[]) => {
    analytics.trackFormSubmission(formName, success, errors);
  };

  const trackSearch = (query: string, results: number, filters?: Record<string, unknown>) => {
    analytics.trackSearch(query, results, filters);
  };

  const trackConversion = (goalName: string, value?: number, properties?: Record<string, unknown>) => {
    analytics.trackConversion(goalName, value, properties);
  };

  return {
    analytics,
    trackPageView,
    trackUserAction,
    trackFormSubmission,
    trackSearch,
    trackConversion,
  };
};

// ページ離脱時のセッション終了
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analytics.endSession();
  });
}

export default analytics;