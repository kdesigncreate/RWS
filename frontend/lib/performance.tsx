/**
 * パフォーマンス監視とメトリクス収集システム
 * Web Vitals、カスタムメトリクス、ユーザー行動の追跡
 */

// パフォーマンスメトリクスの型定義
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url?: string;
  userAgent?: string;
  connectionType?: string;
}

interface WebVitalsMetric extends PerformanceMetric {
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
}

interface CustomMetric extends PerformanceMetric {
  category: 'api' | 'user-interaction' | 'render' | 'navigation' | 'error';
  tags?: Record<string, string>;
}

// パフォーマンス監視クラス
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean;

  constructor(enabled: boolean = process.env.NODE_ENV === 'production') {
    this.isEnabled = enabled;
    
    if (this.isEnabled && typeof window !== 'undefined') {
      this.initializeObservers();
      this.startMonitoring();
    }
  }

  /**
   * Web Vitalsメトリクスを記録
   */
  recordWebVital(metric: WebVitalsMetric): void {
    if (!this.isEnabled) return;

    this.metrics.push({
      ...metric,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
    });

    // 外部サービスに送信（本番環境のみ）
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics('web-vital', metric);
    }

    // 開発環境ではコンソールに出力
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.name}:`, metric.value, metric.rating);
    }
  }

  /**
   * カスタムメトリクスを記録
   */
  recordCustomMetric(metric: CustomMetric): void {
    if (!this.isEnabled) return;

    const enrichedMetric = {
      ...metric,
      timestamp: Date.now(),
      url: window.location.href,
    };

    this.metrics.push(enrichedMetric);

    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics('custom-metric', enrichedMetric);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.category}/${metric.name}:`, metric.value);
    }
  }

  /**
   * APIコールのパフォーマンスを測定
   */
  measureApiCall<T>(
    name: string,
    apiCall: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const startTime = performance.now();

    return apiCall()
      .then((result) => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.recordCustomMetric({
          name: `api_${name}`,
          value: duration,
          category: 'api',
          timestamp: Date.now(),
          tags: {
            ...tags,
            status: 'success',
          },
        });

        return result;
      })
      .catch((error) => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.recordCustomMetric({
          name: `api_${name}`,
          value: duration,
          category: 'api',
          timestamp: Date.now(),
          tags: {
            ...tags,
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
          },
        });

        throw error;
      });
  }

  /**
   * レンダリング時間を測定
   */
  measureRender(componentName: string, renderFn: () => void): void {
    const startTime = performance.now();
    
    renderFn();
    
    // React のレンダリング完了を待つ
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordCustomMetric({
        name: `render_${componentName}`,
        value: duration,
        category: 'render',
        timestamp: Date.now(),
        tags: {
          component: componentName,
        },
      });
    });
  }

  /**
   * ユーザーインタラクションを測定
   */
  measureInteraction(actionName: string, callback: () => void): void {
    const startTime = performance.now();
    
    callback();
    
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordCustomMetric({
        name: `interaction_${actionName}`,
        value: duration,
        category: 'user-interaction',
        timestamp: Date.now(),
        tags: {
          action: actionName,
        },
      });
    });
  }

  /**
   * ページナビゲーション時間を測定
   */
  measureNavigation(): void {
    if (typeof window === 'undefined') return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      // DNS解決時間
      this.recordCustomMetric({
        name: 'dns_lookup',
        value: navigation.domainLookupEnd - navigation.domainLookupStart,
        category: 'navigation',
        timestamp: Date.now(),
      });

      // TCP接続時間
      this.recordCustomMetric({
        name: 'tcp_connect',
        value: navigation.connectEnd - navigation.connectStart,
        category: 'navigation',
        timestamp: Date.now(),
      });

      // サーバーレスポンス時間
      this.recordCustomMetric({
        name: 'server_response',
        value: navigation.responseEnd - navigation.requestStart,
        category: 'navigation',
        timestamp: Date.now(),
      });

      // DOM構築時間
      this.recordCustomMetric({
        name: 'dom_content_loaded',
        value: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        category: 'navigation',
        timestamp: Date.now(),
      });

      // 完全な読み込み時間
      this.recordCustomMetric({
        name: 'page_load_complete',
        value: navigation.loadEventEnd - navigation.loadEventStart,
        category: 'navigation',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * リソース読み込み時間を監視
   */
  private initializeObservers(): void {
    // Resource Timing Observer
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            this.recordCustomMetric({
              name: 'resource_load',
              value: resourceEntry.duration,
              category: 'navigation',
              timestamp: Date.now(),
              tags: {
                resource_type: resourceEntry.initiatorType,
                resource_url: resourceEntry.name,
              },
            });
          }
        }
      });

      try {
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported:', error);
      }

      // Long Task Observer
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordCustomMetric({
            name: 'long_task',
            value: entry.duration,
            category: 'render',
            timestamp: Date.now(),
            tags: {
              start_time: entry.startTime.toString(),
            },
          });
        }
      });

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (error) {
        console.warn('Long task observer not supported:', error);
      }
    }
  }

  /**
   * 監視を開始
   */
  private startMonitoring(): void {
    // ページ読み込み完了時にナビゲーション測定
    if (document.readyState === 'complete') {
      this.measureNavigation();
    } else {
      window.addEventListener('load', () => this.measureNavigation());
    }

    // メモリ使用量の監視（対応ブラウザのみ）
    if ('memory' in performance) {
      setInterval(() => {
        const memoryInfo = (performance as Performance & {
          memory?: {
            usedJSHeapSize: number;
            totalJSHeapSize: number;
            jsHeapSizeLimit: number;
          };
        }).memory;
        
        this.recordCustomMetric({
          name: 'memory_used',
          value: memoryInfo?.usedJSHeapSize || 0,
          category: 'render',
          timestamp: Date.now(),
          tags: {
            total_heap: (memoryInfo?.totalJSHeapSize || 0).toString(),
            heap_limit: (memoryInfo?.jsHeapSizeLimit || 0).toString(),
          },
        });
      }, 30000); // 30秒ごと
    }
  }

  /**
   * 分析サービスに送信
   */
  private async sendToAnalytics(type: string, data: unknown): Promise<void> {
    try {
      // Google Analytics 4 または他の分析サービスに送信
      if (typeof window !== 'undefined' && 'gtag' in window) {
        const gtagWindow = window as typeof window & {
          gtag?: (command: string, action: string, params: Record<string, unknown>) => void;
        };
        
        if (gtagWindow.gtag) {
          gtagWindow.gtag('event', type, {
            custom_parameter: JSON.stringify(data),
          });
        }
      }

      // カスタム分析サービスへの送信
      if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
        await fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type,
            data,
            timestamp: Date.now(),
          }),
        });
      }
    } catch (error) {
      console.warn('Failed to send analytics:', error);
    }
  }

  /**
   * 接続タイプを取得
   */
  private getConnectionType(): string {
    if ('connection' in navigator) {
      const connectionInfo = (navigator as Navigator & {
        connection?: {
          effectiveType?: string;
          type?: string;
        };
      }).connection;
      
      return connectionInfo?.effectiveType || connectionInfo?.type || 'unknown';
    }
    return 'unknown';
  }

  /**
   * 蓄積されたメトリクスを取得
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * メトリクスをクリア
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * 監視を停止
   */
  stop(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Web Vitals のロード（動的インポート）
export async function loadWebVitals(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Web Vitals monitoring not available - web-vitals package not installed
    console.log('Web Vitals monitoring not available - web-vitals package not installed');
  } catch (error) {
    console.warn('Failed to load web-vitals:', error);
  }
}

// シングルトンインスタンス
export const performanceMonitor = new PerformanceMonitor();

// React Hook for performance monitoring
export function usePerformanceMonitoring() {
  React.useEffect(() => {
    loadWebVitals();
  }, []);

  return {
    measureApiCall: performanceMonitor.measureApiCall.bind(performanceMonitor),
    measureRender: performanceMonitor.measureRender.bind(performanceMonitor),
    measureInteraction: performanceMonitor.measureInteraction.bind(performanceMonitor),
    recordCustomMetric: performanceMonitor.recordCustomMetric.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
  };
}

// HOC for component performance monitoring
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name;

  const MemoizedComponent = React.memo((props: P) => {
    const renderStartTime = React.useRef<number>(0);

    React.useLayoutEffect(() => {
      renderStartTime.current = performance.now();
    });

    React.useEffect(() => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        
        performanceMonitor.recordCustomMetric({
          name: `component_render_${displayName}`,
          value: renderTime,
          category: 'render',
          timestamp: Date.now(),
          tags: {
            component: displayName,
          },
        });
      }
    });

    return <WrappedComponent {...props} />;
  });

  MemoizedComponent.displayName = `withPerformanceMonitoring(${displayName})`;
  return MemoizedComponent;
}

// Performance budget checker
export class PerformanceBudget {
  private budgets: Record<string, number> = {
    'LCP': 2500, // 2.5秒
    'FID': 100,  // 100ms
    'CLS': 0.1,  // 0.1
    'FCP': 1800, // 1.8秒
    'TTFB': 800, // 800ms
  };

  checkBudget(metric: WebVitalsMetric): boolean {
    const budget = this.budgets[metric.name];
    if (budget === undefined) return true;

    const withinBudget = metric.value <= budget;
    
    if (!withinBudget && process.env.NODE_ENV === 'development') {
      console.warn(
        `Performance budget exceeded for ${metric.name}: ${metric.value} > ${budget}`
      );
    }

    return withinBudget;
  }

  setBudget(metricName: string, value: number): void {
    this.budgets[metricName] = value;
  }

  getBudgets(): Record<string, number> {
    return { ...this.budgets };
  }
}

export const performanceBudget = new PerformanceBudget();

// React import
import React from 'react';