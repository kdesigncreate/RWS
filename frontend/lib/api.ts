import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import type { ApiError, ApiEndpoints } from '@/types/api';
import { AppError, ErrorUtils, ErrorType } from '@/lib/errors';

// 環境変数から設定を取得
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// デバッグ: 環境変数の確認
if (typeof window !== 'undefined') {
  console.log('DEBUG: API_BASE_URL =', API_BASE_URL);
  console.log('DEBUG: NEXT_PUBLIC_API_BASE_URL =', process.env.NEXT_PUBLIC_API_BASE_URL);
  
  // 古いSupabase設定とブラウザキャッシュをクリア
  try {
    // LocalStorageのクリア
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // SessionStorageのクリア
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('sb-'))) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    if (keysToRemove.length > 0 || sessionKeysToRemove.length > 0) {
      console.log('Cleared old Supabase settings:', { localStorage: keysToRemove, sessionStorage: sessionKeysToRemove });
    }
  } catch (error) {
    console.warn('Could not clear storage:', error);
  }
  
  // グローバルfetchインターセプト（緊急対応）
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    let url: string;
    
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.href;
    } else {
      url = input.url;
    }
    
    // すべてのSupabase直接呼び出しをブロック
    if (url.includes('ixrwzaasrxoshjnpxnme.supabase.co/rest/v1/') || url.includes('.supabase.co/rest/v1/')) {
      console.warn('GLOBAL INTERCEPTED: Blocking Supabase direct access, redirecting to our API');
      
      // URLを解析してエンドポイントを特定
      if (url.includes('/rest/v1/login') || url.includes('/auth/v1/token')) {
        url = '/api/login';
      } else if (url.includes('/rest/v1/logout')) {
        url = '/api/logout';
      } else if (url.includes('/rest/v1/user')) {
        url = '/api/user';
      } else {
        // その他のSupabase呼び出しをブロック
        console.error('BLOCKED: Unsupported Supabase direct access to:', url);
        return Promise.reject(new Error('Direct Supabase access is not allowed. Please use the API endpoints.'));
      }
      
      input = url;
      
      // 適切なヘッダーを設定
      if (!init) init = {};
      if (!init.headers) init.headers = {};
      const headers = init.headers as Record<string, string>;
      headers['Content-Type'] = 'application/json';
      headers['Accept'] = 'application/json';
    }
    
    return originalFetch.call(this, input, init);
  };
}

// API エンドポイント定義
export const apiEndpoints: ApiEndpoints = {
    // 認証
    login: '/login',
    logout: '/logout',
    user: '/user',
    authCheck: '/auth/check',
    
    // 公開記事
    posts: '/posts',
    post: (id: number) => `/posts/${id}`,
    
    // 管理者記事
    adminPosts: '/admin/posts',
    adminPost: (id: number) => `/admin/posts/${id}`,
    
    // ヘルスチェック
    health: '/health',
  };

// Axios インスタンスの作成
export const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: false,
  });

// デバッグ: Axiosインスタンスの設定確認
if (typeof window !== 'undefined') {
  console.log('DEBUG: Axios instance baseURL =', api.defaults.baseURL);
  console.log('DEBUG: Axios headers =', api.defaults.headers);
}

// トークン管理
export const setAuthToken = (token: string | null) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('auth_token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('auth_token');
    }
  };

// 初期化時にローカルストレージからトークンを復元
export const initializeAuth = () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        setAuthToken(token);
      }
    }
  };

// リクエスト インターセプター
api.interceptors.request.use(
  (config) => {
    // リクエストログ（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    // デバッグ: 実際のリクエストURL確認
    console.log('DEBUG: Full request URL =', (config.baseURL || '') + (config.url || ''));
    console.log('DEBUG: Request config =', config);
    
    // 緊急対応: Supabase直接アクセスを我々のAPIに強制リダイレクト
    if (config.url && (config.url.includes('ixrwzaasrxoshjnpxnme.supabase.co') || config.url.includes('.supabase.co/rest/v1/'))) {
      console.warn('AXIOS INTERCEPTED: Supabase direct access detected, redirecting to our API');
      config.baseURL = '/api';
      
      if (config.url.includes('/rest/v1/login') || config.url.includes('/auth/v1/token')) {
        config.url = '/login';
      } else if (config.url.includes('/rest/v1/logout')) {
        config.url = '/logout';
      } else if (config.url.includes('/rest/v1/user')) {
        config.url = '/user';
      } else {
        console.error('AXIOS BLOCKED: Unsupported Supabase direct access to:', config.url);
        return Promise.reject(new Error('Direct Supabase access is not allowed. Please use the API endpoints.'));
      }
      
      // 不要なヘッダーを削除
      if (config.headers) {
        delete config.headers['apikey'];
        delete config.headers['Authorization'];
      }
    }
    
    return config;
  },
  (error) => {
    const appError = ErrorUtils.fromError(error, ErrorType.CLIENT, 'リクエストの準備中にエラーが発生しました');
    ErrorUtils.logError(appError);
    return Promise.reject(appError);
  }
);

// レスポンス インターセプター
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // レスポンスログ（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError) => {
    // AppErrorに変換
    const appError = ErrorUtils.fromApiError(error);
    
    // 特定のエラーハンドリング
    if (error.response?.status === 401) {
      setAuthToken(null);
      // 管理画面以外でアクセスしている場合はログインページにリダイレクト
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
        setTimeout(() => {
          window.location.href = '/admin';
        }, 1000);
      }
    }

    // エラーをログに記録
    ErrorUtils.logError(appError);
    
    return Promise.reject(appError);
  }
);

// ユーティリティ関数（後方互換性のため保持）
export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof AppError) {
    return {
      message: error.userMessage,
      errors: error.context?.errors as Record<string, string[]> | undefined,
      error: error.technicalMessage,
    };
  }
  
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    let message: string | undefined;
    let errors: Record<string, string[]> | undefined;
    let err: string | undefined;
    if (typeof data === 'object' && data !== null) {
      if ('message' in data && typeof (data as { message?: unknown }).message === 'string') {
        message = (data as { message: string }).message;
      }
      if ('errors' in data && typeof (data as { errors?: unknown }).errors === 'object') {
        errors = (data as { errors: Record<string, string[]> }).errors;
      }
      if ('error' in data && typeof (data as { error?: unknown }).error === 'string') {
        err = (data as { error: string }).error;
      }
    }
    return {
      message: message || error.message || 'エラーが発生しました',
      errors,
      error: err,
    };
  }
  
  return {
    message: '予期しないエラーが発生しました',
  };
};

// 再試行機能付きAPI呼び出しヘルパー
export const apiCall = async <T = unknown>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: unknown;
    params?: unknown;
    retry?: number;
    retryDelay?: number;
  } = {}
): Promise<T> => {
  const { retry = 0, retryDelay = 1000, ...requestOptions } = options;
  
  let lastError: AppError | null = null;
  
  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      const response = await api.request({
        url: endpoint,
        method: requestOptions.method || 'GET',
        data: requestOptions.data,
        params: requestOptions.params,
      });
      
      return response.data as T;
    } catch (error) {
      if (error instanceof AppError) {
        lastError = error;
        
        // 再試行可能でかつ最後の試行ではない場合
        if (ErrorUtils.isRetryable(error) && attempt < retry) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }
      } else {
        // AppError以外のエラーの場合は変換
        lastError = ErrorUtils.fromError(
          error as Error, 
          ErrorType.UNKNOWN, 
          'API呼び出し中にエラーが発生しました'
        );
      }
      
      break; // 再試行不可能なエラーの場合はループを抜ける
    }
  }
  
  throw lastError;
};

// 型安全な API 呼び出し関数（再試行オプション付き）
export const get = <T = unknown>(
  endpoint: string, 
  params?: unknown, 
  options?: { retry?: number; retryDelay?: number }
): Promise<T> =>
  apiCall<T>(endpoint, { method: 'GET', params, ...options });

export const post = <T = unknown>(
  endpoint: string, 
  data?: unknown, 
  options?: { retry?: number; retryDelay?: number }
): Promise<T> =>
  apiCall<T>(endpoint, { method: 'POST', data, ...options });

export const put = <T = unknown>(
  endpoint: string, 
  data?: unknown, 
  options?: { retry?: number; retryDelay?: number }
): Promise<T> =>
  apiCall<T>(endpoint, { method: 'PUT', data, ...options });

export const del = <T = unknown>(
  endpoint: string, 
  options?: { retry?: number; retryDelay?: number }
): Promise<T> =>
  apiCall<T>(endpoint, { method: 'DELETE', ...options });
  
  // 初期化
  initializeAuth();