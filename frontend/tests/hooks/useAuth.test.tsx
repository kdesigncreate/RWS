import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { api } from '@/lib/api';

// APIモックの設定
jest.mock('@/lib/api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
    defaults: {
      baseURL: 'http://localhost:8000/api',
      headers: {
        common: {},
      },
    },
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

// テスト用のサンプルデータ
const mockUser = {
  id: 1,
  name: 'テストユーザー',
  email: 'test@example.com',
  email_verified_at: null,
  is_email_verified: false,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  created_at_formatted: '2024年1月15日',
  updated_at_formatted: '2024年1月15日',
  account_age_days: 30,
};

const mockLoginResponse = {
  data: {
    user: mockUser,
    token: 'test-token-123',
  },
};

const mockUserResponse = {
  data: mockUser,
};

// テスト用のラッパーコンポーネント
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    if (mockApi.defaults?.headers?.common) {
      delete mockApi.defaults.headers.common['Authorization'];
    }
  });

  /**
   * 初期状態のテスト
   */
  it('should have initial state with no user and not loading', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  /**
   * ログイン成功テスト
   */
  it('should login successfully with valid credentials', async () => {
    mockApi.post.mockResolvedValueOnce(mockLoginResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      const response = await result.current.login({ email: 'test@example.com', password: 'password123' });
      expect(response.success).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    // APIが正しく呼ばれているか
    expect(mockApi.post).toHaveBeenCalledWith('/login', {
      email: 'test@example.com',
      password: 'password123',
    });

    // トークンがlocalStorageに保存されているか
    expect(localStorage.getItem('auth_token')).toBe('test-token-123');

    // Authorizationヘッダーが設定されているか
    expect(mockApi.defaults.headers.common['Authorization']).toBe('Bearer test-token-123');
  });

  /**
   * ログイン失敗テスト
   */
  it('should handle login failure correctly', async () => {
    const errorResponse = new Error('ログインに失敗しました');
    mockApi.post.mockRejectedValueOnce(errorResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      const response = await result.current.login({ email: 'test@example.com', password: 'wrongpassword' });
      expect(response.success).toBe(false);
      expect(response.error).toBe('ログインに失敗しました');
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    // トークンが保存されていないか
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  /**
   * ログアウト機能テスト
   */
  it('should logout successfully', async () => {
    // 最初にログイン状態にする
    localStorage.setItem('auth_token', 'test-token-123');
    mockApi.defaults.headers.common['Authorization'] = 'Bearer test-token-123';
    mockApi.post.mockResolvedValueOnce({ data: { message: 'Logged out successfully' } });
    mockApi.get.mockResolvedValueOnce(mockUserResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // 初期化を待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
    }, { timeout: 3000 });

    // ログアウト実行
    await act(async () => {
      const response = await result.current.logout();
      expect(response.success).toBe(true);
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    // ログアウトAPIが呼ばれているか
    expect(mockApi.post).toHaveBeenCalledWith('/logout');

    // トークンがlocalStorageから削除されているか
    expect(localStorage.getItem('auth_token')).toBeNull();

    // Authorizationヘッダーが削除されているか
    expect(mockApi.defaults.headers.common['Authorization']).toBeUndefined();
  });

  /**
   * トークンからのユーザー復元テスト
   */
  it('should restore user from stored token on initialization', async () => {
    // localStorageにトークンを事前に設定
    localStorage.setItem('auth_token', 'existing-token-123');
    mockApi.get.mockResolvedValueOnce(mockUserResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 3000 });

    // ユーザー情報取得APIが呼ばれているか
    expect(mockApi.get).toHaveBeenCalledWith('/user');

    // Authorizationヘッダーが設定されているか
    expect(mockApi.defaults.headers.common['Authorization']).toBe('Bearer existing-token-123');
  });

  /**
   * 無効なトークンの処理テスト
   */
  it('should handle invalid token correctly', async () => {
    localStorage.setItem('auth_token', 'invalid-token');
    
    const errorResponse = new Error('Unauthorized');
    mockApi.get.mockRejectedValueOnce(errorResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 3000 });

    // 無効なトークンがlocalStorageから削除されているか
    expect(localStorage.getItem('auth_token')).toBeNull();

    // Authorizationヘッダーが削除されているか
    expect(mockApi.defaults.headers.common['Authorization']).toBeUndefined();
  });

  /**
   * 管理者権限テスト
   */
  it('should identify admin users correctly', async () => {
    localStorage.setItem('auth_token', 'test-token-123');
    mockApi.get.mockResolvedValueOnce(mockUserResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
    }, { timeout: 3000 });
  });

  /**
   * ユーザー情報取得テスト
   */
  it('should get user info correctly', async () => {
    localStorage.setItem('auth_token', 'test-token-123');
    mockApi.get.mockResolvedValueOnce(mockUserResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    }, { timeout: 3000 });

    const userInfo = result.current.getUserInfo();
    expect(userInfo.user).toEqual(mockUser);
    expect(userInfo.isLoggedIn).toBe(true);
    expect(userInfo.hasToken).toBe(true);
  });

  /**
   * 認証が必要な処理のテスト
   */
  it('should handle requireAuth correctly', async () => {
    localStorage.setItem('auth_token', 'test-token-123');
    mockApi.get.mockResolvedValueOnce(mockUserResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    }, { timeout: 3000 });

    const mockCallback = jest.fn().mockResolvedValue('success');
    
    await act(async () => {
      const response = await result.current.requireAuth(mockCallback);
      expect(response.success).toBe(true);
      expect(response.data).toBe('success');
    });

    expect(mockCallback).toHaveBeenCalled();
  });

  /**
   * 未認証時のrequireAuthテスト
   */
  it('should handle requireAuth when not authenticated', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const mockCallback = jest.fn();
    
    await act(async () => {
      const response = await result.current.requireAuth(mockCallback);
      expect(response.success).toBe(false);
      expect(response.error).toBe('認証が必要です');
    });

    expect(mockCallback).not.toHaveBeenCalled();
  });
});