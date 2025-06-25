'use client';

import { useCallback } from 'react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import type { LoginCredentials, AuthUser } from '@/types/auth';

/**
 * 認証関連のカスタムフック
 */
export function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    login: contextLogin,
    logout: contextLogout,
    checkAuth: contextCheckAuth,
  } = useAuthContext();

  /**
   * ログイン処理（エラーハンドリング付き）
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      await contextLogin(credentials);
      return { success: true, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ログインに失敗しました';
      return { success: false, error: errorMessage };
    }
  }, [contextLogin]);

  /**
   * ログアウト処理
   */
  const logout = useCallback(async () => {
    try {
      await contextLogout();
      return { success: true, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ログアウトに失敗しました';
      return { success: false, error: errorMessage };
    }
  }, [contextLogout]);

  /**
   * 認証状態の確認
   */
  const checkAuth = useCallback(async () => {
    try {
      await contextCheckAuth();
      return { success: true, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '認証確認に失敗しました';
      return { success: false, error: errorMessage };
    }
  }, [contextCheckAuth]);

  /**
   * ユーザー情報の取得
   */
  const getUserInfo = useCallback(() => {
    return {
      user,
      isLoggedIn: isAuthenticated,
      hasToken: !!token,
    };
  }, [user, isAuthenticated, token]);

  /**
   * 管理者かどうかの判定（将来の拡張用）
   */
  const isAdmin = useCallback(() => {
    return isAuthenticated && !!user;
  }, [isAuthenticated, user]);

  /**
   * 認証が必要な処理を実行
   */
  const requireAuth = useCallback(async <T,>(
    callback: () => Promise<T>
  ): Promise<{ success: boolean; data?: T; error?: string }> => {
    if (!isAuthenticated) {
      return { success: false, error: '認証が必要です' };
    }

    try {
      const data = await callback();
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '処理に失敗しました';
      return { success: false, error: errorMessage };
    }
  }, [isAuthenticated]);

  return {
    // 状態
    user,
    token,
    isAuthenticated,
    isLoading,
    isAdmin: isAdmin(),
    
    // アクション
    login,
    logout,
    checkAuth,
    
    // ユーティリティ
    getUserInfo,
    requireAuth,
  };
}

/**
 * ログイン状態に応じた条件付きレンダリング用フック
 */
export function useAuthGuard() {
  const { isAuthenticated, isLoading } = useAuth();

  const renderForAuth = useCallback((
    authenticatedContent: React.ReactNode,
    unauthenticatedContent?: React.ReactNode
  ) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    return isAuthenticated ? authenticatedContent : (unauthenticatedContent || null);
  }, [isAuthenticated, isLoading]);

  const renderForGuest = useCallback((
    guestContent: React.ReactNode,
    authenticatedContent?: React.ReactNode
  ) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    return !isAuthenticated ? guestContent : (authenticatedContent || null);
  }, [isAuthenticated, isLoading]);

  return {
    isAuthenticated,
    isLoading,
    renderForAuth,
    renderForGuest,
  };
}