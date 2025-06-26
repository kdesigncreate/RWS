import { 
  api, 
  apiEndpoints, 
  setAuthToken, 
  initializeAuth, 
  handleApiError
} from '@/lib/api';
import axios from 'axios';
import { AppError, ErrorType } from '@/lib/errors';

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
    // axiosインスタンスのヘッダーをリセット
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