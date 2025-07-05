import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import type {
  ApiError,
  ApiEndpoints,
  ConnectivityCheckResult,
  EnvironmentValidation,
  ApiCallOptions,
} from "@/types/api";
import { AppError, ErrorUtils, ErrorType } from "@/lib/errors";

// 環境変数から設定を取得と堅牢なフォールバック戦略
const getApiBaseUrl = (): string => {
  // ブラウザ環境では常に相対パスを使用
  if (typeof window !== "undefined") {
    return "/api";
  }

  // 1. 直接指定されたAPI URL（最優先）
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }

  // 2. Supabase URLから構築
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/api`;
  }

  // 3. 開発環境でのローカル Supabase
  if (process.env.NODE_ENV === "development") {
    // ローカル Supabase Functions をチェック
    return "http://127.0.0.1:54321/functions/v1/api";
  }

  // 4. 最終フォールバック - Vercel middleware proxy
  return "/api";
};

const API_BASE_URL = getApiBaseUrl();

// Debug: Log API configuration
console.log('API Configuration:', {
  API_BASE_URL,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NODE_ENV: process.env.NODE_ENV
});

// API エンドポイント定義
export const apiEndpoints: ApiEndpoints = {
  // 認証
  login: "/login",
  logout: "/logout",
  user: "/user",
  authCheck: "/auth/check",

  // 公開記事
  posts: "/posts",
  post: (id: number) => `/posts/${id}`,

  // 管理者記事
  adminPosts: "/admin/posts",
  adminPost: (id: number) => `/admin/posts/${id}`,

  // ヘルスチェック
  health: "/health",
};

// Axios インスタンスの作成
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// トークン管理
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("auth_token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("auth_token");
  }
};

// 初期化時にローカルストレージからトークンを復元
export const initializeAuth = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      setAuthToken(token);
    }
  }
};

// リクエスト インターセプター
api.interceptors.request.use(
  (config) => {
    // リクエストログ（開発環境のみ）
    if (process.env.NODE_ENV === "development") {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    const appError = ErrorUtils.fromError(
      error,
      ErrorType.CLIENT,
      "リクエストの準備中にエラーが発生しました",
    );
    ErrorUtils.logError(appError);
    return Promise.reject(appError);
  },
);

// レスポンス インターセプター
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // レスポンスログ（開発環境のみ）
    if (process.env.NODE_ENV === "development") {
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
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/admin")
      ) {
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1000);
      }
    }

    // エラーをログに記録
    ErrorUtils.logError(appError);

    return Promise.reject(appError);
  },
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
    if (typeof data === "object" && data !== null) {
      if (
        "message" in data &&
        typeof (data as { message?: unknown }).message === "string"
      ) {
        message = (data as { message: string }).message;
      }
      if (
        "errors" in data &&
        typeof (data as { errors?: unknown }).errors === "object"
      ) {
        errors = (data as { errors: Record<string, string[]> }).errors;
      }
      if (
        "error" in data &&
        typeof (data as { error?: unknown }).error === "string"
      ) {
        err = (data as { error: string }).error;
      }
    }
    return {
      message: message || error.message || "エラーが発生しました",
      errors,
      error: err,
    };
  }

  return {
    message: "予期しないエラーが発生しました",
  };
};

// 再試行機能付きAPI呼び出しヘルパー
export const apiCall = async <T = unknown>(
  endpoint: string,
  options: ApiCallOptions = {},
): Promise<T> => {
  const { retry = 0, retryDelay = 1000, ...requestOptions } = options;

  let lastError: AppError | null = null;

  for (let attempt = 0; attempt <= retry; attempt++) {
    try {
      const response = await api.request({
        url: endpoint,
        method: requestOptions.method || "GET",
        data: requestOptions.data,
        params: requestOptions.params,
      });

      return response.data as T;
    } catch (error) {
      if (error instanceof AppError) {
        lastError = error;

        // 再試行可能でかつ最後の試行ではない場合
        if (ErrorUtils.isRetryable(error) && attempt < retry) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * (attempt + 1)),
          );
          continue;
        }
      } else {
        // AppError以外のエラーの場合は変換
        lastError = ErrorUtils.fromError(
          error as Error,
          ErrorType.UNKNOWN,
          "API呼び出し中にエラーが発生しました",
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
  options?: { retry?: number; retryDelay?: number },
): Promise<T> => apiCall<T>(endpoint, { method: "GET", params, ...options });

export const post = <T = unknown>(
  endpoint: string,
  data?: unknown,
  options?: { retry?: number; retryDelay?: number },
): Promise<T> => apiCall<T>(endpoint, { method: "POST", data, ...options });

export const put = <T = unknown>(
  endpoint: string,
  data?: unknown,
  options?: { retry?: number; retryDelay?: number },
): Promise<T> => apiCall<T>(endpoint, { method: "PUT", data, ...options });

export const del = <T = unknown>(
  endpoint: string,
  options?: { retry?: number; retryDelay?: number },
): Promise<T> => apiCall<T>(endpoint, { method: "DELETE", ...options });

/**
 * ユーザー一覧を取得（管理者用）
 */
export const getUsers = async (): Promise<
  { id: number; name: string; email: string }[]
> => {
  try {
    const response = await api.get<{
      users: { id: number; name: string; email: string }[];
    }>("/users");
    return response.data.users;
  } catch (error) {
    throw handleApiError(error);
  }
};

// API接続性チェック機能
export const checkApiConnectivity =
  async (): Promise<ConnectivityCheckResult> => {
    const startTime = Date.now();

    try {
      await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000,
        validateStatus: (status) => status === 200,
      });

      const latency = Date.now() - startTime;

      return {
        isConnected: true,
        endpoint: API_BASE_URL,
        latency,
      };
    } catch (error) {
      console.warn("API connectivity check failed:", error);

      return {
        isConnected: false,
        endpoint: API_BASE_URL,
      };
    }
  };

// 環境変数バリデーション機能
export const validateEnvironment = (): EnvironmentValidation => {
  const missing: string[] = [];
  const warnings: string[] = [];

  // 必須の環境変数をチェック
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_API_BASE_URL
  ) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_API_BASE_URL");
  }

  // Supabase設定のチェック
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    warnings.push(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing but SUPABASE_URL is set",
    );
  }

  // 開発環境でのチェック
  if (process.env.NODE_ENV === "development") {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      warnings.push(
        "Using fallback to local Supabase (http://127.0.0.1:54321)",
      );
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
};

// デバッグ情報表示（開発環境のみ）
if (process.env.NODE_ENV === "development") {
  console.log("🔗 API Configuration:");
  console.log("  Base URL:", API_BASE_URL);

  const envValidation = validateEnvironment();
  if (!envValidation.isValid) {
    console.error("❌ Missing environment variables:", envValidation.missing);
  }
  if (envValidation.warnings.length > 0) {
    console.warn("⚠️ Environment warnings:", envValidation.warnings);
  }
}

// 初期化
initializeAuth();
