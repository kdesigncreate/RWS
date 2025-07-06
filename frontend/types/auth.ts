// ログイン情報型
export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

// 認証レスポンス型
export interface AuthResponse {
  user: AuthUser;
  access_token: string;
}

// 認証ユーザー型
export interface AuthUser {
  id: string;
  name: string;
  email: string;
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
