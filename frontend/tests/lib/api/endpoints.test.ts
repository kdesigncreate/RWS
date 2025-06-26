import { queryKeys, authApi, postsApi, commentsApi, uploadApi, contactApi, healthApi, securityApi } from '@/lib/api/endpoints';
import { secureApiClient } from '@/lib/api/secure-client';

// Mock the secure API client
jest.mock('@/lib/api/secure-client', () => ({
  secureApiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    upload: jest.fn(),
  },
}));

const mockSecureApiClient = secureApiClient as jest.Mocked<typeof secureApiClient>;

describe('API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('queryKeys', () => {
    it('should generate correct query keys for posts', () => {
      expect(queryKeys.posts.all).toEqual(['posts']);
      expect(queryKeys.posts.lists()).toEqual(['posts', 'list']);
      expect(queryKeys.posts.list({ status: 'published' })).toEqual(['posts', 'list', { status: 'published' }]);
      expect(queryKeys.posts.details()).toEqual(['posts', 'detail']);
      expect(queryKeys.posts.detail(123)).toEqual(['posts', 'detail', 123]);
      expect(queryKeys.posts.search('test')).toEqual(['posts', 'search', 'test']);
    });

    it('should generate correct query keys for comments', () => {
      expect(queryKeys.comments.all).toEqual(['comments']);
      expect(queryKeys.comments.byPost(456)).toEqual(['comments', 'post', 456]);
    });

    it('should generate correct query keys for auth and security', () => {
      expect(queryKeys.auth.profile).toEqual(['auth', 'profile']);
      expect(queryKeys.security.events).toEqual(['security', 'events']);
    });
  });

  describe('authApi', () => {
    it('should call login endpoint correctly', async () => {
      const loginData = { email: 'test@example.com', password: 'password123', csrfToken: 'csrf-token' };
      const mockResponse = { data: { message: 'Login successful', user: { id: 1, name: 'Test' }, token: 'mock-token' } } as any;
      
      mockSecureApiClient.post.mockResolvedValue(mockResponse);

      const result = await authApi.login(loginData);

      expect(mockSecureApiClient.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(result).toBe(mockResponse);
    });

    it('should call logout endpoint correctly', async () => {
      mockSecureApiClient.post.mockResolvedValue({ data: { message: 'Logout successful' } } as any);

      await authApi.logout();

      expect(mockSecureApiClient.post).toHaveBeenCalledWith('/auth/logout');
    });

    it('should call profile endpoints correctly', async () => {
      const mockUser = { data: { id: 1, name: 'Test User', email: 'test@example.com' } } as any;
      
      mockSecureApiClient.get.mockResolvedValue(mockUser);
      await authApi.getProfile();
      expect(mockSecureApiClient.get).toHaveBeenCalledWith('/auth/profile');

      const updateData = { 
        email: 'test@example.com',
        name: 'Updated Name',
        csrfToken: 'csrf-token',
        notifications: {
          push: true,
          email: true,
          newsletter: false
        },
        privacy: {
          profilePublic: true,
          showEmail: false
        }
      };
      mockSecureApiClient.put.mockResolvedValue({ data: { updated: true } } as any);
      await authApi.updateProfile(updateData);
      expect(mockSecureApiClient.put).toHaveBeenCalledWith('/auth/profile', updateData);
    });

    it('should call password-related endpoints correctly', async () => {
      const forgotData = { email: 'test@example.com', csrfToken: 'csrf-token' };
      await authApi.forgotPassword(forgotData);
      expect(mockSecureApiClient.post).toHaveBeenCalledWith('/auth/forgot-password', forgotData);

      const resetData = { token: 'reset-token', password: 'newpassword', csrfToken: 'csrf-token', passwordConfirmation: 'newpassword' };
      await authApi.resetPassword(resetData);
      expect(mockSecureApiClient.post).toHaveBeenCalledWith('/auth/reset-password', resetData);

      const changeData = { csrfToken: 'csrf-token', currentPassword: 'old', newPassword: 'new', newPasswordConfirmation: 'new' };
      await authApi.changePassword(changeData);
      expect(mockSecureApiClient.put).toHaveBeenCalledWith('/auth/change-password', changeData);
    });
  });

  describe('postsApi', () => {
    it('should call posts endpoints correctly', async () => {
      const mockPost = { id: 1, title: 'Test Post', content: 'Content' };
      
      // Get all posts
      await postsApi.getAll();
      expect(mockSecureApiClient.get).toHaveBeenCalledWith('/posts?');

      // Get all posts with filters
      await postsApi.getAll({ page: 1, limit: 10, status: 'published' });
      expect(mockSecureApiClient.get).toHaveBeenCalledWith('/posts?page=1&limit=10&status=published');

      // Get by ID
      await postsApi.getById(123);
      expect(mockSecureApiClient.get).toHaveBeenCalledWith('/posts/123');

      // Create post
      const createData = { title: 'New Post', content: 'Content', status: 'draft' as const, csrfToken: 'csrf-token' };
      await postsApi.create(createData);
      expect(mockSecureApiClient.post).toHaveBeenCalledWith('/posts', createData);

      // Update post
      const updateData = { id: 123, title: 'Updated Post', content: 'Updated Content', status: 'published' as const, csrfToken: 'csrf-token' };
      await postsApi.update(updateData);
      expect(mockSecureApiClient.put).toHaveBeenCalledWith('/posts/123', { title: 'Updated Post', content: 'Updated Content', status: 'published', csrfToken: 'csrf-token' });

      // Delete post
      const deleteData = { id: 123, csrfToken: 'csrf-token' };
      await postsApi.delete(deleteData);
      expect(mockSecureApiClient.delete).toHaveBeenCalledWith('/posts/123', {
        body: JSON.stringify({ csrfToken: 'csrf-token' }),
      });
    });

    it('should handle search correctly', async () => {
      const searchParams = { query: 'test search', page: 1 };
      await postsApi.search(searchParams);
      // URLSearchParams encodes spaces as + or %20
      const call = mockSecureApiClient.get.mock.calls[mockSecureApiClient.get.mock.calls.length - 1][0];
      expect(call).toMatch(/\/posts\/search\?query=test[\+%20]search&page=1/);
    });
  });

  describe('commentsApi', () => {
    it('should handle comment operations correctly', async () => {
      // Get comments by post ID
      await commentsApi.getByPostId(123);
      expect(mockSecureApiClient.get).toHaveBeenCalledWith('/posts/123/comments?');

      await commentsApi.getByPostId(123, { page: 1, limit: 5 });
      expect(mockSecureApiClient.get).toHaveBeenCalledWith('/posts/123/comments?page=1&limit=5');

      // Create comment
      const commentData = { postId: 123, content: 'Test comment', authorName: 'Test User', authorEmail: 'test@example.com', csrfToken: 'csrf-token' };
      await commentsApi.create(commentData);
      expect(mockSecureApiClient.post).toHaveBeenCalledWith('/comments', commentData);

      // Delete comment
      await commentsApi.delete(456, 'csrf-token');
      expect(mockSecureApiClient.delete).toHaveBeenCalledWith('/comments/456', {
        body: JSON.stringify({ csrfToken: 'csrf-token' }),
      });
    });
  });

  describe('uploadApi', () => {
    it('should handle file uploads correctly', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const csrfToken = 'csrf-token';

      // Upload file
      await uploadApi.uploadFile(mockFile, csrfToken);
      expect(mockSecureApiClient.upload).toHaveBeenCalledWith('/upload', expect.any(FormData));

      // Upload avatar
      await uploadApi.uploadAvatar(mockFile, csrfToken);
      expect(mockSecureApiClient.upload).toHaveBeenCalledWith('/upload/avatar', expect.any(FormData));

      // Delete file
      await uploadApi.deleteFile('test.txt', csrfToken);
      expect(mockSecureApiClient.delete).toHaveBeenCalledWith('/upload', {
        body: JSON.stringify({ filename: 'test.txt', csrfToken }),
      });
    });
  });

  describe('contactApi', () => {
    it('should submit contact form correctly', async () => {
      const contactData = { name: 'Test User', email: 'test@example.com', message: 'Hello', subject: 'Test Subject', csrfToken: 'csrf-token' };
      await contactApi.submit(contactData);
      expect(mockSecureApiClient.post).toHaveBeenCalledWith('/contact', contactData);
    });
  });

  describe('healthApi', () => {
    it('should check health correctly', async () => {
      await healthApi.check();
      expect(mockSecureApiClient.get).toHaveBeenCalledWith('/health', {
        skipAuth: true,
        timeout: 5000,
      });
    });
  });

  describe('securityApi', () => {
    it('should handle security reporting correctly', async () => {
      const cspViolation = {
        documentUri: 'https://example.com',
        violatedDirective: 'script-src',
        blockedUri: 'https://malicious.com/script.js',
      };
      
      await securityApi.reportCSPViolation(cspViolation);
      expect(mockSecureApiClient.post).toHaveBeenCalledWith('/security/csp-violation', cspViolation, {
        skipAuth: true,
      });

      const xssAttempt = {
        url: 'https://example.com/page',
        payload: '<script>alert("xss")</script>',
        timestamp: '2024-01-01T00:00:00Z',
      };
      
      await securityApi.reportXSSAttempt(xssAttempt);
      expect(mockSecureApiClient.post).toHaveBeenCalledWith('/security/xss-attempt', xssAttempt, {
        skipAuth: true,
      });

      await securityApi.getSecurityEvents();
      expect(mockSecureApiClient.get).toHaveBeenCalledWith('/security/events?');

      await securityApi.getSecurityEvents({ page: 1, limit: 20 });
      expect(mockSecureApiClient.get).toHaveBeenCalledWith('/security/events?page=1&limit=20');
    });
  });

  describe('Parameter handling', () => {
    it('should handle undefined parameters correctly', async () => {
      const params = { page: 1, limit: undefined, status: 'published' as const, other: undefined };
      await postsApi.getAll(params);
      
      // Should only include defined parameters
      expect(mockSecureApiClient.get).toHaveBeenCalledWith('/posts?page=1&status=published');
    });

    it('should handle empty parameter objects', async () => {
      await postsApi.getAll({});
      expect(mockSecureApiClient.get).toHaveBeenCalledWith('/posts?');
    });

    it('should convert parameter values to strings', async () => {
      const params = { page: 1, limit: 10, active: true };
      await postsApi.getAll(params);
      expect(mockSecureApiClient.get).toHaveBeenCalledWith('/posts?page=1&limit=10&active=true');
    });
  });
});