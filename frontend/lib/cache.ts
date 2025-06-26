/**
 * キャッシュ戦略とデータ管理システム
 * メモリキャッシュ、ローカルストレージ、セッションストレージを統合管理
 */

// キャッシュエントリの型定義
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  tags?: string[];
}

// キャッシュ設定の型定義
interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  storage: 'memory' | 'localStorage' | 'sessionStorage';
  keyPrefix?: string;
}

// キャッシュマネージャークラス
export class CacheManager<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5分
      maxSize: 100,
      storage: 'memory',
      keyPrefix: 'cache_',
      ...config,
    };
  }

  /**
   * データをキャッシュに保存
   */
  set(key: string, data: T, ttl?: number, tags?: string[]): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      tags,
    };

    // メモリキャッシュ
    if (this.config.storage === 'memory') {
      // サイズ制限チェック
      if (this.cache.size >= this.config.maxSize) {
        this.evictOldest();
      }
      this.cache.set(key, entry);
    } 
    // ブラウザストレージ
    else {
      this.setToStorage(key, entry);
    }
  }

  /**
   * キャッシュからデータを取得
   */
  get(key: string): T | null {
    let entry: CacheEntry<T> | null = null;

    if (this.config.storage === 'memory') {
      entry = this.cache.get(key) || null;
    } else {
      entry = this.getFromStorage(key);
    }

    if (!entry) return null;

    // TTLチェック
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * キャッシュからデータを削除
   */
  delete(key: string): boolean {
    if (this.config.storage === 'memory') {
      return this.cache.delete(key);
    } else {
      return this.deleteFromStorage(key);
    }
  }

  /**
   * キャッシュをクリア
   */
  clear(): void {
    if (this.config.storage === 'memory') {
      this.cache.clear();
    } else {
      this.clearStorage();
    }
  }

  /**
   * タグベースでキャッシュを無効化
   */
  invalidateByTag(tag: string): void {
    if (this.config.storage === 'memory') {
      for (const [key, entry] of this.cache.entries()) {
        if (entry.tags?.includes(tag)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.invalidateStorageByTag(tag);
    }
  }

  /**
   * 期限切れエントリを削除
   */
  cleanup(): void {
    const now = Date.now();
    
    if (this.config.storage === 'memory') {
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cleanupStorage();
    }
  }

  /**
   * キャッシュサイズを取得
   */
  size(): number {
    if (this.config.storage === 'memory') {
      return this.cache.size;
    } else {
      return this.getStorageSize();
    }
  }

  /**
   * キャッシュ統計を取得
   */
  getStats(): {
    size: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; size: number }>;
  } {
    const entries: Array<{ key: string; age: number; size: number }> = [];
    const now = Date.now();

    if (this.config.storage === 'memory') {
      for (const [key, entry] of this.cache.entries()) {
        entries.push({
          key,
          age: now - entry.timestamp,
          size: JSON.stringify(entry.data).length,
        });
      }
    }

    return {
      size: this.size(),
      hitRate: 0, // TODO: ヒット率の計算実装
      entries,
    };
  }

  // プライベートメソッド
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private setToStorage(key: string, entry: CacheEntry<T>): void {
    if (typeof window === 'undefined') return;

    const storage = this.getStorage();
    if (!storage) return;

    try {
      const serialized = JSON.stringify(entry);
      storage.setItem(this.getStorageKey(key), serialized);
    } catch (error) {
      console.warn('Failed to save to storage:', error);
    }
  }

  private getFromStorage(key: string): CacheEntry<T> | null {
    if (typeof window === 'undefined') return null;

    const storage = this.getStorage();
    if (!storage) return null;

    try {
      const serialized = storage.getItem(this.getStorageKey(key));
      return serialized ? (JSON.parse(serialized) as CacheEntry<T>) : null;
    } catch (error) {
      console.warn('Failed to load from storage:', error);
      return null;
    }
  }

  private deleteFromStorage(key: string): boolean {
    if (typeof window === 'undefined') return false;

    const storage = this.getStorage();
    if (!storage) return false;

    try {
      storage.removeItem(this.getStorageKey(key));
      return true;
    } catch (error) {
      console.warn('Failed to delete from storage:', error);
      return false;
    }
  }

  private clearStorage(): void {
    if (typeof window === 'undefined') return;

    const storage = this.getStorage();
    if (!storage) return;

    try {
      const keys = Object.keys(storage);
      const prefix = this.config.keyPrefix;
      
      keys.forEach(key => {
        if (key.startsWith(prefix || '')) {
          storage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
  }

  private invalidateStorageByTag(tag: string): void {
    if (typeof window === 'undefined') return;

    const storage = this.getStorage();
    if (!storage) return;

    try {
      const keys = Object.keys(storage);
      const prefix = this.config.keyPrefix;

      keys.forEach(key => {
        if (key.startsWith(prefix || '')) {
          const serialized = storage.getItem(key);
          if (serialized) {
            const entry = JSON.parse(serialized) as CacheEntry<T>;
            if (entry.tags?.includes(tag)) {
              storage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.warn('Failed to invalidate by tag:', error);
    }
  }

  private cleanupStorage(): void {
    if (typeof window === 'undefined') return;

    const storage = this.getStorage();
    if (!storage) return;

    try {
      const keys = Object.keys(storage);
      const prefix = this.config.keyPrefix;
      const now = Date.now();

      keys.forEach(key => {
        if (key.startsWith(prefix || '')) {
          const serialized = storage.getItem(key);
          if (serialized) {
            const entry = JSON.parse(serialized) as CacheEntry<T>;
            if (now - entry.timestamp > entry.ttl) {
              storage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup storage:', error);
    }
  }

  private getStorageSize(): number {
    if (typeof window === 'undefined') return 0;

    const storage = this.getStorage();
    if (!storage) return 0;

    const keys = Object.keys(storage);
    const prefix = this.config.keyPrefix;
    
    return keys.filter(key => key.startsWith(prefix || '')).length;
  }

  private getStorage(): Storage | null {
    if (typeof window === 'undefined') return null;

    switch (this.config.storage) {
      case 'localStorage':
        return window.localStorage;
      case 'sessionStorage':
        return window.sessionStorage;
      default:
        return null;
    }
  }

  private getStorageKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }
}

// 特定用途向けのキャッシュインスタンス
export const apiCache = new CacheManager({
  defaultTTL: 5 * 60 * 1000, // 5分
  maxSize: 50,
  storage: 'sessionStorage',
  keyPrefix: 'api_',
});

export const imageCache = new CacheManager({
  defaultTTL: 30 * 60 * 1000, // 30分
  maxSize: 100,
  storage: 'localStorage',
  keyPrefix: 'img_',
});

export const userCache = new CacheManager({
  defaultTTL: 60 * 60 * 1000, // 1時間
  maxSize: 10,
  storage: 'localStorage',
  keyPrefix: 'user_',
});

// キャッシュ機能付きAPIラッパー
export async function cachedApiCall<T>(
  key: string,
  apiCall: () => Promise<T>,
  ttl?: number,
  tags?: string[]
): Promise<T | null> {
  // キャッシュから取得を試行
  const cached = apiCache.get(key) as T | null;
  if (cached !== null) {
    return cached;
  }

  // APIを呼び出し
  try {
    const data = await apiCall();
    apiCache.set(key, data, ttl, tags);
    return data;
  } catch (error) {
    throw error;
  }
}

// React Hook for cached data
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    tags?: string[];
    revalidateOnFocus?: boolean;
  } = {}
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await cachedApiCall(key, fetcher, options.ttl, options.tags);
      if (result !== null) {
        setData(result);
      } else {
        // キャッシュがnullの場合はAPIを直接呼び出し
        const freshData = await fetcher();
        setData(freshData);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options.ttl, options.tags]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // フォーカス時の再取得
  React.useEffect(() => {
    if (!options.revalidateOnFocus) return;

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData, options.revalidateOnFocus]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    invalidate: () => apiCache.delete(key),
  };
}

// 定期的なキャッシュクリーンアップ
if (typeof window !== 'undefined') {
  // 5分ごとにクリーンアップ実行
  setInterval(() => {
    apiCache.cleanup();
    imageCache.cleanup();
    userCache.cleanup();
  }, 5 * 60 * 1000);
}

// Service Worker経由のキャッシュ制御（PWA対応）
export const swCache = {
  async preloadImages(urls: string[]): Promise<void> {
    if ('serviceWorker' in navigator && 'caches' in window) {
      try {
        const cache = await caches.open('images-v1');
        await cache.addAll(urls);
      } catch (error) {
        console.warn('Failed to preload images:', error);
      }
    }
  },

  async preloadData(key: string, data: unknown): Promise<void> {
    if ('serviceWorker' in navigator && 'caches' in window) {
      try {
        const cache = await caches.open('data-v1');
        const response = new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' },
        });
        await cache.put(key, response);
      } catch (error) {
        console.warn('Failed to preload data:', error);
      }
    }
  },
};

// React import for hooks
import React from 'react';