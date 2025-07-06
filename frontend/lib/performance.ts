/**
 * パフォーマンス最適化ユーティリティ
 */

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';

/**
 * デバウンスフック - 関数の実行を遅延させる
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * スロットルフック - 関数の実行頻度を制限する
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;

    if (timeSinceLastCall >= delay) {
      callback(...args);
      lastCallRef.current = now;
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
        lastCallRef.current = Date.now();
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
};

/**
 * インターセクションオブザーバーフック - 要素の可視性を監視
 */
export const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options, hasIntersected]);

  return { isIntersecting, hasIntersected };
};

/**
 * 仮想スクロール用のフック
 */
export const useVirtualList = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const virtualItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      offsetTop: (visibleRange.start + index) * itemHeight,
    }));
  }, [items, visibleRange, itemHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    virtualItems,
    totalHeight,
    handleScroll,
  };
};

/**
 * メモ化されたコンポーネント作成ヘルパー
 */
export const createMemoizedComponent = <P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  return React.memo(Component, areEqual);
};

/**
 * 重い計算の結果をメモ化する
 */
export const useExpensiveCalculation = <T>(
  calculation: () => T,
  dependencies: React.DependencyList
): T => {
  return useMemo(calculation, dependencies);
};

/**
 * プリロード機能
 */
export const preloadResource = (href: string, as: string) => {
  if (typeof window === 'undefined') return;

  const existingLink = document.querySelector(`link[href="${href}"]`);
  if (existingLink) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  
  if (as === 'image') {
    link.crossOrigin = 'anonymous';
  }

  document.head.appendChild(link);
};

/**
 * 画像のプリロード
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * バッチ処理ユーティリティ
 */
export class BatchProcessor<T> {
  private queue: T[] = [];
  private isProcessing = false;
  private batchSize: number;
  private processFn: (items: T[]) => Promise<void>;
  private delay: number;

  constructor(
    processFn: (items: T[]) => Promise<void>,
    batchSize: number = 10,
    delay: number = 100
  ) {
    this.processFn = processFn;
    this.batchSize = batchSize;
    this.delay = delay;
  }

  add(item: T): void {
    this.queue.push(item);
    this.scheduleProcess();
  }

  private scheduleProcess(): void {
    if (this.isProcessing) return;

    setTimeout(() => {
      this.process();
    }, this.delay);
  }

  private async process(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      try {
        await this.processFn(batch);
      } catch (error) {
        console.error('Batch processing error:', error);
      }
    }

    this.isProcessing = false;
  }
}

/**
 * Web Workersを使用した重い処理の実行
 */
export const runInWorker = <T, R>(
  workerScript: string,
  data: T
): Promise<R> => {
  return new Promise((resolve, reject) => {
    if (typeof Worker === 'undefined') {
      reject(new Error('Web Workers are not supported'));
      return;
    }

    const worker = new Worker(workerScript);
    
    worker.postMessage(data);
    
    worker.onmessage = (event) => {
      resolve(event.data);
      worker.terminate();
    };
    
    worker.onerror = (error) => {
      reject(error);
      worker.terminate();
    };
  });
};

/**
 * Core Web Vitals測定
 */
export const measureCoreWebVitals = () => {
  if (typeof window === 'undefined') return;

  // LCP (Largest Contentful Paint)
  const measureLCP = () => {
    return new Promise<number>((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
        observer.disconnect();
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    });
  };

  // FID (First Input Delay)
  const measureFID = () => {
    return new Promise<number>((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const entry = entries[0] as any;
          resolve(entry.processingStart - entry.startTime);
          observer.disconnect();
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
    });
  };

  // CLS (Cumulative Layout Shift)
  const measureCLS = () => {
    return new Promise<number>((resolve) => {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });

      // 5秒後にCLS値を返す
      setTimeout(() => {
        resolve(clsValue);
        observer.disconnect();
      }, 5000);
    });
  };

  return {
    measureLCP,
    measureFID,
    measureCLS,
  };
};

