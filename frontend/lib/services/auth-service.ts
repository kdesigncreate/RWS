/**
 * 認証サービス層
 * マイクロサービス化準備として、認証関連の処理を分離
 */

import { api, apiEndpoints } from '@/lib/api';
import { AppError, ErrorUtils, ErrorType } from '@/lib/errors';
import { logger } from '@/lib/logger';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  created_at?: string;
  last_login?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
  };

  private constructor() {
    this.initializeAuth();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private initializeAuth(): void {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          this.authState = {
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          };
          
          // APIクライアントにトークンを設定
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          logger.info('Auth state initialized from localStorage', { userId: user.id });
        } catch (error) {
          logger.error('Failed to parse stored user data', { error });
          this.clearAuth();
        }
      }
    }
  }

  public async login(credentials: LoginCredentials): Promise<LoginResponse> {
    this.setLoading(true);
    
    try {
      logger.info('Login attempt', { email: credentials.email });
      
      const response = await api.post<LoginResponse>(apiEndpoints.login, credentials);
      const { user, token, refreshToken, expiresIn } = response.data;

      // 認証状態の更新
      this.updateAuthState(user, token);
      
      // ローカルストレージに保存
      this.persistAuth(user, token, refreshToken, expiresIn);
      
      // APIクライアントにトークンを設定
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      logger.info('Login successful', { userId: user.id });
      
      return response.data;
    } catch (error) {
      logger.error('Login failed', { email: credentials.email, error });
      this.clearAuth();
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw ErrorUtils.fromError(
        error as Error,
        ErrorType.AUTHENTICATION,
        'ログインに失敗しました'
      );
    } finally {
      this.setLoading(false);
    }
  }

  public async logout(): Promise<void> {
    this.setLoading(true);
    
    try {
      if (this.authState.token) {
        await api.post(apiEndpoints.logout);
        logger.info('Logout successful', { userId: this.authState.user?.id });
      }
    } catch (error) {
      logger.error('Logout API call failed', { error });
      // ログアウトAPIが失敗してもローカルの状態はクリア
    } finally {
      this.clearAuth();
      this.setLoading(false);
    }
  }

  public async refreshToken(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      logger.warn('No refresh token available');
      return null;
    }

    try {
      const response = await api.post<{ token: string; expiresIn: number }>('/auth/refresh', {
        refreshToken,
      });
      
      const { token, expiresIn } = response.data;
      
      // 新しいトークンを保存
      localStorage.setItem('auth_token', token);
      if (expiresIn) {
        const expiryTime = Date.now() + (expiresIn * 1000);
        localStorage.setItem('token_expiry', expiryTime.toString());
      }
      
      // APIクライアントを更新
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // 認証状態を更新
      this.authState.token = token;
      
      logger.info('Token refreshed successfully');
      
      return token;
    } catch (error) {
      logger.error('Token refresh failed', { error });
      this.clearAuth();
      return null;
    }
  }

  public async getCurrentUser(): Promise<User | null> {
    if (!this.authState.token) {
      return null;
    }

    try {
      const response = await api.get<{ user: User }>(apiEndpoints.user);
      const { user } = response.data;
      
      this.updateAuthState(user, this.authState.token);
      this.persistUser(user);
      
      return user;
    } catch (error) {
      logger.error('Failed to get current user', { error });
      
      if (error instanceof AppError && error.statusCode === 401) {
        // トークンが無効な場合
        const newToken = await this.refreshToken();
        if (newToken) {
          // リフレッシュ成功後に再試行
          return this.getCurrentUser();
        } else {
          // リフレッシュ失敗時は認証をクリア
          this.clearAuth();
        }
      }
      
      return null;
    }
  }

  public async updateProfile(updates: Partial<User>): Promise<User> {
    if (!this.authState.isAuthenticated) {
      throw ErrorUtils.createAuthenticationError();
    }

    try {
      const response = await api.put<{ user: User }>('/auth/profile', updates);
      const { user } = response.data;
      
      this.updateAuthState(user, this.authState.token);
      this.persistUser(user);
      
      logger.info('Profile updated', { userId: user.id });
      
      return user;
    } catch (error) {
      logger.error('Profile update failed', { error });
      throw error;
    }
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.authState.isAuthenticated) {
      throw ErrorUtils.createAuthenticationError();
    }

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      
      logger.info('Password changed successfully', { userId: this.authState.user?.id });
    } catch (error) {
      logger.error('Password change failed', { error });
      throw error;
    }
  }

  public isTokenExpired(): boolean {
    const expiryTime = localStorage.getItem('token_expiry');
    if (!expiryTime) return false;
    
    return Date.now() > parseInt(expiryTime);
  }

  public getAuthState(): AuthState {
    return { ...this.authState };
  }

  public onAuthStateChange(callback: (state: AuthState) => void): () => void {
    // イベントリスナーパターンの実装
    const handler = () => callback(this.getAuthState());
    
    // カスタムイベントでの状態変更通知
    window.addEventListener('auth-state-change', handler);
    
    return () => {
      window.removeEventListener('auth-state-change', handler);
    };
  }

  private updateAuthState(user: User, token: string | null): void {
    this.authState = {
      user,
      token,
      isAuthenticated: !!token,
      isLoading: false,
    };
    
    this.notifyStateChange();
  }

  private setLoading(loading: boolean): void {
    this.authState.isLoading = loading;
    this.notifyStateChange();
  }

  private clearAuth(): void {
    this.authState = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    };
    
    // ローカルストレージをクリア
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expiry');
    
    // APIクライアントからトークンを削除
    delete api.defaults.headers.common['Authorization'];
    
    this.notifyStateChange();
  }

  private persistAuth(user: User, token: string, refreshToken?: string, expiresIn?: number): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    
    if (expiresIn) {
      const expiryTime = Date.now() + (expiresIn * 1000);
      localStorage.setItem('token_expiry', expiryTime.toString());
    }
  }

  private persistUser(user: User): void {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  private notifyStateChange(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-state-change'));
    }
  }
}

// シングルトンインスタンスをエクスポート
export const authService = AuthService.getInstance();