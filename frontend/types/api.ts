// 汎用API エラー型
export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
    error?: string;
  }

// 汎用API レスポンス型
export interface ApiResponse<T = any> {
    data?: T;
    message?: string;
    errors?: Record<string, string[]>;
    meta?: {
      current_page: number;
      from: number | null;
      last_page: number;
      per_page: number;
      to: number | null;
      total: number;
    };
    links?: {
      first: string | null;
      last: string | null;
      prev: string | null;
      next: string | null;
    };
  }

// HTTP メソッド型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// API 設定型
export interface ApiConfig {
    baseURL: string;
    timeout: number;
    headers: Record<string, string>;
  }

// リクエスト設定型
export interface RequestConfig {
    method?: HttpMethod;
    headers?: Record<string, string>;
    params?: Record<string, any>;
    data?: any;
    timeout?: number;
  }

// ヘルスチェックレスポンス型
export interface HealthCheckResponse {
    status: string;
    timestamp: string;
    version: string;
    laravel_version: string;
  }

// バリデーションエラー型
export interface ValidationError {
    message: string;
    errors: Record<string, string[]>;
  }

// ページネーションパラメータ型
export interface PaginationParams {
    page?: number;
    limit?: number;
  }

// ソートパラメータ型
export interface SortParams {
    sort?: string;
    order?: 'asc' | 'desc';
  }

// 検索パラメータ型
export interface SearchParams {
    search?: string;
  }

// API エンドポイント型
export interface ApiEndpoints {
    // 認証
    login: string;
    logout: string;
    user: string;
    authCheck: string;
    
    // 公開記事
    posts: string;
    post: (id: number) => string;
    
    // 管理者記事
    adminPosts: string;
    adminPost: (id: number) => string;
    
    // ヘルスチェック
    health: string;
  }