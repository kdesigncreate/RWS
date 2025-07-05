// Supabase Functions Types
export interface DatabasePost {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  status: 'published' | 'draft';
  published_at?: string;
  created_at: string;
  updated_at: string;
  user_id: number;
}

export interface DatabaseUser {
  id: number;
  name: string;
  email: string;
}

export interface FormattedPost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  status: 'published' | 'draft';
  status_label: string;
  published_at?: string;
  published_at_formatted: string | null;
  is_published: boolean;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  created_at_formatted: string;
  updated_at_formatted: string;
  user_id: number;
  author: DatabaseUser;
  meta: {
    title_length: number;
    content_length: number;
    excerpt_length: number;
    reading_time_minutes: number;
  };
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: DatabaseUser;
  token: string;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  excerpt?: string;
  status?: 'published' | 'draft';
}

export interface UpdatePostRequest {
  title: string;
  content: string;
  excerpt?: string;
  status?: 'published' | 'draft';
}

// ヘルスチェックレスポンス型
export interface HealthCheckResponse {
  status: string;
  message: string;
  timestamp: string;
}

// エラーレスポンス型
export interface ErrorResponse {
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
  status?: number;
  timestamp?: string;
}

// デバッグレスポンス型
export interface DebugResponse {
  message: string;
  debug: {
    path: string;
    method: string;
    url: string;
    pathInfo: Record<string, unknown>;
  };
}

// CORS ヘッダー型
export interface CorsHeaders {
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Allow-Methods': string;
}

// リクエストハンドラー型
export type RequestHandler = (
  request: Request,
  path: string,
  url: URL
) => Promise<Response>;

// Supabase認証ユーザー型
export interface SupabaseAuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    [key: string]: unknown;
  };
}

// 認証トークンデータ型
export interface AuthTokenData {
  user: SupabaseAuthUser;
}

// データベースクエリオプション型
export interface QueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  ascending?: boolean;
}

// バリデーションルール型
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
}

// バリデーションスキーマ型
export interface ValidationSchema {
  [field: string]: ValidationRule;
}

// バリデーション結果型
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}