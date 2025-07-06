/**
 * 認証統合テスト
 */

import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { server } from '../mocks/server';
import { rest } from 'msw';
import { ReactNode } from 'react';

// テスト用のQueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// モックサーバーの設定
beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

describe('認証統合テスト', () => {
  describe('ログイン機能', () => {
    it('正常なログインフローが動作する', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      };

      server.use(
        rest.post('/api/login', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              user: mockUser,
              token: 'mock-access-token'
            })
          );
        }),
        rest.get('/api/user', (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ user: mockUser }));
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // 初期状態の確認
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(true);

      // ログイン実行
      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      // ログイン後の状態確認
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorage.getItem('auth_token')).toBe('mock-access-token');
    });

    it('無効な認証情報でのログインが失敗する', async () => {
      server.use(
        rest.post('/api/login', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({ message: 'Invalid credentials' })
          );
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.login('invalid@example.com', 'wrongpassword');
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('ログアウト機能', () => {
    it('ログアウトが正常に動作する', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      };

      // 初期ログイン状態を設定
      localStorage.setItem('auth_token', 'mock-token');

      server.use(
        rest.get('/api/user', (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ user: mockUser }));
        }),
        rest.post('/api/logout', (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ message: 'Logged out' }));
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // ログアウト実行
      await act(async () => {
        await result.current.logout();
      });

      // ログアウト後の状態確認
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('認証状態の復元', () => {
    it('ページリロード時に認証状態が復元される', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      };

      // 既存のトークンを設定
      localStorage.setItem('auth_token', 'existing-token');

      server.use(
        rest.get('/api/user', (req, res, ctx) => {
          const authHeader = req.headers.get('Authorization');
          if (authHeader === 'Bearer existing-token') {
            return res(ctx.status(200), ctx.json({ user: mockUser }));
          }
          return res(ctx.status(401), ctx.json({ message: 'Unauthorized' }));
        })
      );

      const { result, waitFor } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // 認証状態の復元を待つ
      await waitFor(() => {
        return result.current.isLoading === false;
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('無効なトークンの場合は認証がクリアされる', async () => {
      // 無効なトークンを設定
      localStorage.setItem('auth_token', 'invalid-token');

      server.use(
        rest.get('/api/user', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json({ message: 'Unauthorized' }));
        })
      );

      const { result, waitFor } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // 認証チェックの完了を待つ
      await waitFor(() => {
        return result.current.isLoading === false;
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('認証エラーハンドリング', () => {
    it('ネットワークエラー時の処理が適切である', async () => {
      server.use(
        rest.post('/api/login', (req, res, ctx) => {
          return res.networkError('Network error');
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'password');
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('サーバーエラー時の処理が適切である', async () => {
      server.use(
        rest.post('/api/login', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ message: 'Internal server error' })
          );
        })
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'password');
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});