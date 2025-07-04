import { api, setAuthToken, handleApiError } from "./api";
import type {
  LoginCredentials,
  AuthResponse,
  AuthUser,
  LogoutResponse,
  UserResponse,
  AuthCheckResponse,
} from "@/types/auth";
import type { ApiError } from "@/types/api";

/**
 * ログイン処理
 */
export const login = async (
  credentials: LoginCredentials,
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>("/login", credentials);

    // トークンを保存
    if (response.data.token) {
      setAuthToken(response.data.token);
    }

    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * ログアウト処理
 */
export const logout = async (): Promise<void> => {
  try {
    await api.post<LogoutResponse>("/logout");
  } catch (error) {
    // ログアウト時のエラーは無視（トークンは削除）
    console.warn("Logout API error:", error);
  } finally {
    // トークンを削除
    setAuthToken(null);
  }
};

/**
 * 現在のユーザー情報を取得
 */
export const getCurrentUser = async (): Promise<AuthUser> => {
  try {
    const response = await api.get<UserResponse>("/user");
    return response.data.user;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * 認証状態を確認
 */
export const checkAuth = async (): Promise<boolean> => {
  try {
    const response = await api.get<AuthCheckResponse>("/auth/check");
    return response.data.authenticated;
  } catch (error) {
    return false;
  }
};

/**
 * ローカルストレージからトークンを取得
 */
export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
};

/**
 * 認証状態を確認（トークンの存在のみ）
 */
export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};

/**
 * 認証が必要なページでの認証チェック
 */
export const requireAuth = async (): Promise<AuthUser> => {
  const token = getStoredToken();

  if (!token) {
    throw new Error("認証が必要です");
  }

  try {
    return await getCurrentUser();
  } catch (error) {
    setAuthToken(null);
    throw new Error("認証情報が無効です");
  }
};

/**
 * 認証エラーハンドリング
 */
export const handleAuthError = (error: ApiError): string => {
  if (error.errors) {
    // バリデーションエラーの場合
    const errorMessages = Object.values(error.errors).flat();
    return errorMessages.join("\n");
  }

  return error.message || "認証エラーが発生しました";
};

/**
 * 自動ログアウトタイマー
 */
export class AutoLogoutTimer {
  private timer: NodeJS.Timeout | null = null;
  private readonly timeoutMinutes: number;

  constructor(timeoutMinutes: number = 120) {
    this.timeoutMinutes = timeoutMinutes;
  }

  start(onTimeout: () => void): void {
    this.reset();
    this.timer = setTimeout(
      () => {
        onTimeout();
      },
      this.timeoutMinutes * 60 * 1000,
    );
  }

  reset(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  stop(): void {
    this.reset();
  }
}

/**
 * セッション管理ユーティリティ
 */
export const sessionManager = {
  /**
   * セッション情報を保存
   */
  saveSession: (user: AuthUser, token: string): void => {
    if (typeof window === "undefined") return;

    localStorage.setItem("auth_user", JSON.stringify(user));
    localStorage.setItem("auth_token", token);
    localStorage.setItem("auth_timestamp", Date.now().toString());
  },

  /**
   * セッション情報を取得
   */
  getSession: (): {
    user: AuthUser | null;
    token: string | null;
    timestamp: number | null;
  } => {
    if (typeof window === "undefined") {
      return { user: null, token: null, timestamp: null };
    }

    const userStr = localStorage.getItem("auth_user");
    const token = localStorage.getItem("auth_token");
    const timestampStr = localStorage.getItem("auth_timestamp");

    return {
      user: userStr ? (JSON.parse(userStr) as AuthUser) : null,
      token,
      timestamp: timestampStr ? parseInt(timestampStr, 10) : null,
    };
  },

  /**
   * セッション情報をクリア
   */
  clearSession: (): void => {
    if (typeof window === "undefined") return;

    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_timestamp");
  },

  /**
   * セッションの有効性を確認
   */
  isSessionValid: (maxAgeHours: number = 24): boolean => {
    const { timestamp } = sessionManager.getSession();
    if (!timestamp) return false;

    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    return now - timestamp < maxAge;
  },
};
