// 汎用API エラー型
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
  status?: number;
  timestamp?: string;
}

// 汎用API レスポンス型
export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: PaginationMeta;
  links?: PaginationLinks;
}

// ページネーションメタデータ型
export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

// ページネーションリンク型
export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

// HTTP メソッド型
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

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
  message: string;
  timestamp: string;
}

// API接続性チェック結果型
export interface ConnectivityCheckResult {
  isConnected: boolean;
  endpoint: string;
  latency?: number;
  error?: string;
}

// 環境バリデーション結果型
export interface EnvironmentValidation {
  isValid: boolean;
  missing: string[];
  warnings: string[];
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
  order?: "asc" | "desc";
}

// 検索パラメータ型
export interface SearchParams {
  search?: string;
}

// ログインリクエスト型
export interface LoginRequest {
  email: string;
  password: string;
}

// ログインレスポンス型
export interface LoginResponse {
  message: string;
  user: User;
  token: string;
}

// ユーザー型
export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

// 認証状態型
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
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

// API呼び出しオプション型
export interface ApiCallOptions {
  method?: HttpMethod;
  data?: unknown;
  params?: unknown;
  retry?: number;
  retryDelay?: number;
  timeout?: number;
}
