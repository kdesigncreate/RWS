import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Tailwind CSS クラス名を結合
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 日付フォーマット関数
 */
export const formatDate = {
  /**
   * 日本語形式の日付（例: 2025年6月23日）
   */
  toJapanese: (dateString: string | null): string => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '-';
    }
  },
  
  /**
   * 日本語形式の日時（例: 2025年6月23日 14:30）
   */
  toJapaneseDateTime: (dateString: string | null): string => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  },
  
  /**
   * 相対時間（例: 3時間前）
   */
  toRelative: (dateString: string | null): string => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      
      const minutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (minutes < 1) return 'たった今';
      if (minutes < 60) return `${minutes}分前`;
      if (hours < 24) return `${hours}時間前`;
      if (days < 7) return `${days}日前`;
      
      return formatDate.toJapanese(dateString);
    } catch {
      return '-';
    }
  },
  
  /**
   * ISO形式をDate オブジェクトに変換
   */
  toDate: (dateString: string | null): Date | null => {
    if (!dateString) return null;
    
    try {
      return new Date(dateString);
    } catch {
      return null;
    }
  },
};

/**
 * 文字列操作ユーティリティ
 */
export const stringUtils = {
  /**
   * テキストを指定文字数で切り詰め
   */
  truncate: (text: string, maxLength: number, suffix: string = '...'): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length) + suffix;
  },
  
  /**
   * HTMLタグを除去
   */
  stripHtml: (html: string): string => {
    if (typeof window === 'undefined') {
      // サーバーサイドでの簡易HTML除去
      return html.replace(/<[^>]*>/g, '');
    }
    
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  },
  
  /**
   * スラッグ生成（URL用）
   */
  toSlug: (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },
  
  /**
   * 改行を<br>タグに変換
   */
  nl2br: (text: string): string => {
    return text.replace(/\r?\n/g, '<br>');
  },
};

/**
 * 数値フォーマット関数
 */
export const formatNumber = {
  /**
   * 3桁区切り
   */
  withCommas: (num: number): string => {
    return num.toLocaleString('ja-JP');
  },
  
  /**
   * ファイルサイズの表示
   */
  fileSize: (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    
    return `${size.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  },
};

/**
 * バリデーションユーティリティ
 */
export const validators = {
  /**
   * メールアドレスの検証
   */
  isEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  /**
   * URLの検証
   */
  isUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * 空文字・null・undefinedの検証
   */
  isEmpty: (value: any): boolean => {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  },
};

/**
 * ローカルストレージ操作
 */
export const storage = {
  /**
   * 値を保存
   */
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('LocalStorage set error:', error);
    }
  },
  
  /**
   * 値を取得
   */
  get: <T>(key: string, defaultValue?: T): T | null => {
    if (typeof window === 'undefined') return defaultValue || null;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : (defaultValue || null);
    } catch (error) {
      console.warn('LocalStorage get error:', error);
      return defaultValue || null;
    }
  },
  
  /**
   * 値を削除
   */
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('LocalStorage remove error:', error);
    }
  },
  
  /**
   * 全て削除
   */
  clear: (): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('LocalStorage clear error:', error);
    }
  },
};

/**
 * デバウンス関数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * スロットル関数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 配列操作ユーティリティ
 */
export const arrayUtils = {
  /**
   * 配列をランダムシャッフル
   */
  shuffle: <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },
  
  /**
   * 配列から重複を除去
   */
  unique: <T>(array: T[]): T[] => {
    return [...new Set(array)];
  },
  
  /**
   * 配列をページネーション
   */
  paginate: <T>(array: T[], page: number, limit: number): T[] => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return array.slice(start, end);
  },
};

/**
 * 環境チェック
 */
export const env = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isClient: typeof window !== 'undefined',
  isServer: typeof window === 'undefined',
};