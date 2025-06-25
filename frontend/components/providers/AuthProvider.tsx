'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import type { AuthUser, LoginCredentials, AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  /**
   * ログイン処理
   */
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.post('/login', credentials);
      const { user: userData, token: authToken } = response.data;
      
      setUser(userData);
      setToken(authToken);
      
      // トークンをローカルストレージに保存
      localStorage.setItem('auth_token', authToken);
      
      // APIクライアントにトークンを設定
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('ログインに失敗しました');
    }
  };

  /**
   * ログアウト処理
   */
  const logout = async () => {
    try {
      if (token) {
        await api.post('/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      delete api.defaults.headers.common['Authorization'];
    }
  };

  /**
   * 認証状態の確認
   */
  const checkAuth = async () => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      // APIクライアントにトークンを設定
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      
      const response = await api.get('/user');
      const userData = response.data;
      
      setUser(userData);
      setToken(storedToken);
    } catch (error) {
      console.error('Auth check error:', error);
      // トークンが無効な場合は削除
      localStorage.removeItem('auth_token');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  };

  // 初期化時に認証状態を確認
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * AuthContextを使用するためのカスタムフック
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

/**
 * 認証が必要なコンポーネントをラップするHOC
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuthContext();

    if (isLoading) {
      return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
      return <div>認証が必要です</div>;
    }

    return <Component {...props} />;
  };
} 