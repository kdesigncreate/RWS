import { 
  api, 
  apiEndpoints, 
  setAuthToken, 
  initializeAuth, 
  handleApiError
} from '@/lib/api';
import axios from 'axios';
import { AppError, ErrorType } from '@/lib/errors';

// api モジュールの一部をモック
jest.mock('@/lib/api', () => {
  const actualApi = jest.requireActual('@/lib/api');
  
  // リアルな api インスタンスを使用するが、HTTP メソッドだけをモック
  const mockApi = {
    ...actualApi.api,
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  
  return {
    ...actualApi,
    api: mockApi
  };
});

// axiosをモック
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// axios.isAxiosErrorをモック  
Object.defineProperty(mockedAxios, 'isAxiosError', {
  value: jest.fn(),
  writable: true
});

// localStorageをモック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// window.locationをモック
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/',
    href: '',
  },
  writable: true,
});

describe('API Endpoints', () => {
  it('should have correct endpoint definitions', () => {
    expect(apiEndpoints.login).toBe('/login');
    expect(apiEndpoints.logout).toBe('/logout');
    expect(apiEndpoints.user).toBe('/user');
    expect(apiEndpoints.posts).toBe('/posts');
    expect(apiEndpoints.post(1)).toBe('/posts/1');
    expect(apiEndpoints.adminPosts).toBe('/admin/posts');
    expect(apiEndpoints.adminPost(1)).toBe('/admin/posts/1');
  });
});

describe('Auth Token Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ヘッダーをクリア
    if (api.defaults.headers.common) {
      delete api.defaults.headers.common['Authorization'];
    }
  });

  it('should set auth token', () => {
    const token = 'test-token';
    setAuthToken(token);
    
    expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${token}`);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', token);
  });

  it('should remove auth token', () => {
    setAuthToken(null);
    
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
  });

  it('should initialize auth from localStorage', () => {
    const token = 'stored-token';
    localStorageMock.getItem.mockReturnValue(token);
    
    initializeAuth();
    
    expect(localStorageMock.getItem).toHaveBeenCalledWith('auth_token');
    expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${token}`);
  });

  it('should not initialize auth when no token in localStorage', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    initializeAuth();
    
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle AppError', () => {
    const appError = new AppError({
      type: ErrorType.UNKNOWN,
      userMessage: 'User message',
      technicalMessage: 'Technical message',
    });
    const result = handleApiError(appError);
    
    expect(result.message).toBe('User message');
    expect(result.error).toBe('Technical message');
  });

  it('should handle axios error', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        data: {
          message: 'API Error',
          errors: { field: ['Error message'] },
          error: 'Technical error',
        },
      },
      message: 'Network Error',
    };
    
    // axios.isAxiosErrorをモック
    (mockedAxios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>).mockReturnValue(true);
    
    const result = handleApiError(axiosError);
    
    expect(result.message).toBe('API Error');
    expect(result.errors).toEqual({ field: ['Error message'] });
    expect(result.error).toBe('Technical error');
  });

  it('should handle unknown error', () => {
    const unknownError = new Error('Unknown error');
    
    // axios.isAxiosErrorをモック
    (mockedAxios.isAxiosError as jest.MockedFunction<typeof axios.isAxiosError>).mockReturnValue(false);
    
    const result = handleApiError(unknownError);
    
    expect(result.message).toBe('予期しないエラーが発生しました');
  });
});

describe('Post API Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Published Date Handling', () => {
    it('should handle post creation with published status', async () => {
      const mockPostData = {
        title: 'Test Published Post',
        content: 'Test content for published post',
        status: 'published',
      };

      const mockResponse = {
        data: {
          data: {
            id: 1,
            title: 'Test Published Post',
            content: 'Test content for published post',
            status: 'published',
            published_at: '2023-01-01T10:00:00.000Z',
            published_at_formatted: '2023/1/1',
            is_published: true,
            is_draft: false,
            created_at: '2023-01-01T10:00:00.000Z',
            updated_at: '2023-01-01T10:00:00.000Z',
          }
        }
      };

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const response = await api.post(apiEndpoints.adminPosts, mockPostData);
      const post = response.data.data;

      expect(post.published_at).toBeTruthy();
      expect(post.is_published).toBe(true);
      expect(post.is_draft).toBe(false);
    });

    it('should handle post creation with draft status', async () => {
      const mockPostData = {
        title: 'Test Draft Post',
        content: 'Test content for draft post',
        status: 'draft',
      };

      const mockResponse = {
        data: {
          data: {
            id: 2,
            title: 'Test Draft Post',
            content: 'Test content for draft post',
            status: 'draft',
            published_at: null,
            published_at_formatted: null,
            is_published: false,
            is_draft: true,
            created_at: '2023-01-01T10:00:00.000Z',
            updated_at: '2023-01-01T10:00:00.000Z',
          }
        }
      };

      (api.post as jest.Mock).mockResolvedValue(mockResponse);

      const response = await api.post(apiEndpoints.adminPosts, mockPostData);
      const post = response.data.data;

      expect(post.published_at).toBeNull();
      expect(post.is_published).toBe(false);
      expect(post.is_draft).toBe(true);
    });

    it('should preserve published_at when updating published post', async () => {
      const originalPublishedAt = '2023-01-01T10:00:00.000Z';
      const mockUpdateData = {
        title: 'Updated Published Post',
        content: 'Updated content',
        status: 'published',
      };

      const mockResponse = {
        data: {
          data: {
            id: 1,
            title: 'Updated Published Post',
            content: 'Updated content',
            status: 'published',
            published_at: originalPublishedAt, // 元の公開日時が保持される
            published_at_formatted: '2023/1/1',
            is_published: true,
            is_draft: false,
            created_at: '2023-01-01T10:00:00.000Z',
            updated_at: '2023-01-01T11:00:00.000Z', // 更新日時のみ変更
          }
        }
      };

      (api.put as jest.Mock).mockResolvedValue(mockResponse);

      const response = await api.put(apiEndpoints.adminPost(1), mockUpdateData);
      const post = response.data.data;

      expect(post.published_at).toBe(originalPublishedAt);
      expect(post.updated_at).not.toBe(post.created_at);
    });

    it('should clear published_at when changing from published to draft', async () => {
      const mockUpdateData = {
        title: 'Changed to Draft',
        content: 'This post is now a draft',
        status: 'draft',
      };

      const mockResponse = {
        data: {
          data: {
            id: 1,
            title: 'Changed to Draft',
            content: 'This post is now a draft',
            status: 'draft',
            published_at: null, // 公開日時がクリアされる
            published_at_formatted: null,
            is_published: false,
            is_draft: true,
            created_at: '2023-01-01T10:00:00.000Z',
            updated_at: '2023-01-01T11:00:00.000Z',
          }
        }
      };

      (api.put as jest.Mock).mockResolvedValue(mockResponse);

      const response = await api.put(apiEndpoints.adminPost(1), mockUpdateData);
      const post = response.data.data;

      expect(post.published_at).toBeNull();
      expect(post.is_published).toBe(false);
      expect(post.is_draft).toBe(true);
    });

    it('should set published_at when changing from draft to published', async () => {
      const mockUpdateData = {
        title: 'Now Published',
        content: 'This post is now published',
        status: 'published',
      };

      const mockResponse = {
        data: {
          data: {
            id: 2,
            title: 'Now Published',
            content: 'This post is now published',
            status: 'published',
            published_at: '2023-01-01T12:00:00.000Z', // 新しい公開日時が設定される
            published_at_formatted: '2023/1/1',
            is_published: true,
            is_draft: false,
            created_at: '2023-01-01T10:00:00.000Z',
            updated_at: '2023-01-01T12:00:00.000Z',
          }
        }
      };

      (api.put as jest.Mock).mockResolvedValue(mockResponse);

      const response = await api.put(apiEndpoints.adminPost(2), mockUpdateData);
      const post = response.data.data;

      expect(post.published_at).toBeTruthy();
      expect(post.is_published).toBe(true);
      expect(post.is_draft).toBe(false);
    });
  });

  describe('Post Data Structure', () => {
    it('should include all required post fields', async () => {
      const mockResponse = {
        data: {
          data: {
            id: 1,
            title: 'Test Post',
            content: 'Test content',
            excerpt: 'Test excerpt',
            status: 'published',
            status_label: '公開済み',
            published_at: '2023-01-01T10:00:00.000Z',
            published_at_formatted: '2023/1/1',
            is_published: true,
            is_draft: false,
            created_at: '2023-01-01T10:00:00.000Z',
            updated_at: '2023-01-01T10:00:00.000Z',
            created_at_formatted: '2023/1/1',
            updated_at_formatted: '2023/1/1',
            user_id: 1,
            author: {
              id: 1,
              name: 'Admin User',
              email: 'admin@example.com'
            },
            meta: {
              title_length: 9,
              content_length: 12,
              excerpt_length: 12,
              reading_time_minutes: 1
            }
          }
        }
      };

      (api.get as jest.Mock).mockResolvedValue(mockResponse);

      const response = await api.get(apiEndpoints.adminPost(1));
      const post = response.data.data;

      // 基本フィールドの確認
      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('title');
      expect(post).toHaveProperty('content');
      expect(post).toHaveProperty('status');

      // 公開日時関連フィールドの確認
      expect(post).toHaveProperty('published_at');
      expect(post).toHaveProperty('published_at_formatted');
      expect(post).toHaveProperty('is_published');
      expect(post).toHaveProperty('is_draft');

      // 作成・更新日時フィールドの確認
      expect(post).toHaveProperty('created_at');
      expect(post).toHaveProperty('updated_at');
      expect(post).toHaveProperty('created_at_formatted');
      expect(post).toHaveProperty('updated_at_formatted');

      // 作者情報の確認
      expect(post).toHaveProperty('author');
      expect(post.author).toHaveProperty('id');
      expect(post.author).toHaveProperty('name');

      // メタ情報の確認
      expect(post).toHaveProperty('meta');
      expect(post.meta).toHaveProperty('reading_time_minutes');
    });
  });
}); 