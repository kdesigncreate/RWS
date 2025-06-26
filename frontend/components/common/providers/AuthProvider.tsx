'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  login as apiLogin, 
  logout as apiLogout, 
  getCurrentUser, 
  checkAuth,
  sessionManager,
  AutoLogoutTimer,
  handleAuthError
} from '@/lib/auth';
import type { 
  AuthContextType, 
  AuthUser, 
  LoginCredentials 
} from '@/types/auth';
import type { ApiError } from '@/types/api';

// 認証コンテキスト
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 自動ログアウトタイマー
const autoLogoutTimer = new AutoLogoutTimer(120); // 2時間

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * 認証状態を初期化
   */
  const initializeAuth = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const session = sessionManager.getSession();
      
      if (session.token && session.user) {
        // セッションの有効性を確認
        if (sessionManager.isSessionValid(24)) {
          setToken(session.token);
          setUser(session.user);
          setIsAuthenticated(true);
          
          // サーバーでの認証状態も確認
          const isValidOnServer = await checkAuth();
          if (!isValidOnServer) {
            throw new Error('Server authentication failed');
          }
          
          // 自動ログアウトタイマーを開始
          autoLogoutTimer.start(() => {
            handleLogout();
          });
        } else {
          // セッション期限切れ
          sessionManager.clearSession();
        }
      }
    } catch (error) {
      console.warn('Auth initialization failed:', error);
      sessionManager.clearSession();
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * ログイン処理
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    
    try {
      const response = await apiLogin(credentials);
      
      setToken(response.token);
      setUser(response.user);
      setIsAuthenticated(true);
      
      // セッション情報を保存
      sessionManager.saveSession(response.user, response.token);
      
      // 自動ログアウトタイマーを開始
      autoLogoutTimer.start(() => {
        handleLogout();
      });
      
    } catch (error) {
      const authError = error as ApiError;
      throw new Error(handleAuthError(authError));
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * ログアウト処理
   */
  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await apiLogout();
    } catch (error) {
      console.warn('Logout API error:', error);
    } finally {
      // クライアント側の状態をクリア
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      sessionManager.clearSession();
      autoLogoutTimer.stop();
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 認証状態確認
   */
  const checkAuthStatus = useCallback(async () => {
    if (!token) return;
    
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      // セッション情報を更新
      sessionManager.saveSession(currentUser, token);
      
      // タイマーをリセット
      autoLogoutTimer.reset();
      autoLogoutTimer.start(() => {
        handleLogout();
      });
      
    } catch (error) {
      console.warn('Auth check failed:', error);
      await handleLogout();
    }
  }, [token, handleLogout]);

  /**
   * ページ遷移時やAPIコール時の認証確認
   */
  // 将来の拡張用に保持
  /*
  const ensureAuthenticated = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated || !token) {
      return false;
    }
    
    try {
      await checkAuthStatus();
      return true;
    } catch (error) {
      await handleLogout();
      return false;
    }
  }, [isAuthenticated, token, checkAuthStatus, handleLogout]);
  */

  // 初期化
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // ユーザーアクティビティ監視（マウス移動、キーボード入力時にタイマーリセット）
  useEffect(() => {
    if (!isAuthenticated) return;

    const resetTimer = () => {
      autoLogoutTimer.reset();
      autoLogoutTimer.start(() => {
        handleLogout();
      });
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [isAuthenticated, handleLogout]);

  // ページ閉じる前の処理
  useEffect(() => {
    const handleBeforeUnload = () => {
      autoLogoutTimer.stop();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      autoLogoutTimer.stop();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout: handleLogout,
    checkAuth: checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 認証コンテキストを使用するためのフック
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * 認証が必要なページ用のHOC
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuthContext();
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      // 未認証の場合はログインページにリダイレクト
      if (typeof window !== 'undefined') {
        window.location.href = '/admin';
      }
      return null;
    }
    
    return <WrappedComponent {...props} />;
  };
}