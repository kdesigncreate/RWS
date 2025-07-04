// ログイン情報型
export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

// 認証レスポンス型
export interface AuthResponse {
  message: string;
  user: AuthUser;
  token: string;
}

// 認証ユーザー型
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
  created_at_formatted: string;
  updated_at_formatted: string;
  account_age_days: number;
  posts_count?: number;
  published_posts_count?: number;
  draft_posts_count?: number;
}

// ログアウトレスポンス型
export interface LogoutResponse {
  message: string;
}

// ユーザー情報レスポンス型
export interface UserResponse {
  user: AuthUser;
}

// 認証状態確認レスポンス型
export interface AuthCheckResponse {
  authenticated: boolean;
}

// 認証コンテキスト型
export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// ログインフォーム型
export interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

// 追加の認証関連型
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

export interface ExtendedAuthContextType extends AuthContextType {
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  updatePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  refreshUser: () => Promise<void>;
}
