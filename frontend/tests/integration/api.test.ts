/**
 * API統合テスト
 */

import { api, apiEndpoints, checkApiConnectivity, validateEnvironment } from '@/lib/api';
import { server } from '../mocks/server';
import { rest } from 'msw';

// モックサーバーの設定
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('API統合テスト', () => {
  describe('接続性テスト', () => {
    it('APIヘルスチェックが成功する', async () => {
      server.use(
        rest.get('/api/health', (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ status: 'ok' }));
        })
      );

      const result = await checkApiConnectivity();
      expect(result.isConnected).toBe(true);
      expect(result.latency).toBeGreaterThan(0);
    });

    it('API接続失敗時の処理が正しい', async () => {
      server.use(
        rest.get('/api/health', (req, res, ctx) => {
          return res.networkError('Network error');
        })
      );

      const result = await checkApiConnectivity();
      expect(result.isConnected).toBe(false);
    });
  });

  describe('認証API', () => {
    it('ログインが成功する', async () => {
      const mockResponse = {
        user: { id: 1, email: 'test@example.com' },
        token: 'mock-token'
      };

      server.use(
        rest.post('/api/login', (req, res, ctx) => {
          return res(ctx.status(200), ctx.json(mockResponse));
        })
      );

      const response = await api.post(apiEndpoints.login, {
        email: 'test@example.com',
        password: 'password'
      });

      expect(response.data).toEqual(mockResponse);
    });

    it('認証エラーが適切に処理される', async () => {
      server.use(
        rest.post('/api/login', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({ message: 'Invalid credentials' })
          );
        })
      );

      await expect(
        api.post(apiEndpoints.login, {
          email: 'invalid@example.com',
          password: 'wrong'
        })
      ).rejects.toThrow();
    });
  });

  describe('投稿API', () => {
    it('投稿一覧の取得が成功する', async () => {
      const mockPosts = [
        { id: 1, title: 'Test Post 1', content: 'Content 1' },
        { id: 2, title: 'Test Post 2', content: 'Content 2' }
      ];

      server.use(
        rest.get('/api/posts', (req, res, ctx) => {
          return res(ctx.status(200), ctx.json({ posts: mockPosts }));
        })
      );

      const response = await api.get(apiEndpoints.posts);
      expect(response.data.posts).toEqual(mockPosts);
    });

    it('投稿の作成が成功する', async () => {
      const newPost = { title: 'New Post', content: 'New Content' };
      const createdPost = { id: 3, ...newPost };

      server.use(
        rest.post('/api/admin/posts', (req, res, ctx) => {
          return res(ctx.status(201), ctx.json(createdPost));
        })
      );

      const response = await api.post(apiEndpoints.adminPosts, newPost);
      expect(response.data).toEqual(createdPost);
    });
  });

  describe('エラーハンドリング', () => {
    it('ネットワークエラーが適切に処理される', async () => {
      server.use(
        rest.get('/api/posts', (req, res, ctx) => {
          return res.networkError('Network error');
        })
      );

      await expect(api.get(apiEndpoints.posts)).rejects.toThrow();
    });

    it('サーバーエラーが適切に処理される', async () => {
      server.use(
        rest.get('/api/posts', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({ message: 'Internal server error' })
          );
        })
      );

      await expect(api.get(apiEndpoints.posts)).rejects.toThrow();
    });

    it('バリデーションエラーが適切に処理される', async () => {
      server.use(
        rest.post('/api/admin/posts', (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              message: 'Validation failed',
              errors: {
                title: ['Title is required'],
                content: ['Content is required']
              }
            })
          );
        })
      );

      await expect(
        api.post(apiEndpoints.adminPosts, {})
      ).rejects.toThrow();
    });
  });

  describe('環境設定', () => {
    it('環境変数の検証が正しく動作する', () => {
      const validation = validateEnvironment();
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('missing');
      expect(validation).toHaveProperty('warnings');
    });
  });
});