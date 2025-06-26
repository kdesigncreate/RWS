import type { Post, PostStatus } from '@/types/post';
import type { AuthUser, LoginCredentials, AuthResponse } from '@/types/auth';
import type { ApiResponse, ApiError } from '@/types/api';
import type { PaginationMeta } from '@/types/post';

describe('Type definitions', () => {
  describe('Post types', () => {
    it('should have correct Post type structure', () => {
      const mockPost: Post = {
        id: 1,
        title: 'Test Post',
        content: 'Test content',
        excerpt: 'Test excerpt',
        status: 'published',
        status_label: '公開',
        published_at: '2024-01-01T00:00:00Z',
        published_at_formatted: '2024年1月1日',
        is_published: true,
        is_draft: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_at_formatted: '2024年1月1日',
        updated_at_formatted: '2024年1月1日',
        meta: {
          title_length: 9,
          content_length: 12,
          excerpt_length: 12,
          reading_time_minutes: 1,
        },
      };

      expect(mockPost.id).toBe(1);
      expect(mockPost.title).toBe('Test Post');
      expect(mockPost.is_published).toBe(true);
      expect(mockPost.meta.reading_time_minutes).toBe(1);
    });

    it('should have correct PostStatus values', () => {
      const publishedStatus: PostStatus = 'published';
      const draftStatus: PostStatus = 'draft';

      expect(publishedStatus).toBe('published');
      expect(draftStatus).toBe('draft');
    });

    it('should have correct Post meta structure', () => {
      const meta = {
        title_length: 10,
        content_length: 100,
        excerpt_length: 50,
        reading_time_minutes: 2,
      };

      expect(typeof meta.title_length).toBe('number');
      expect(typeof meta.reading_time_minutes).toBe('number');
    });
  });

  describe('Auth types', () => {
    it('should have correct User type structure', () => {
      const mockUser: AuthUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        email_verified_at: '2024-01-01T00:00:00Z',
        is_email_verified: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        created_at_formatted: '2024年1月1日',
        updated_at_formatted: '2024年1月1日',
        account_age_days: 30,
      };

      expect(mockUser.id).toBe(1);
      expect(mockUser.email).toBe('test@example.com');
      expect(typeof mockUser.name).toBe('string');
    });

    it('should have correct LoginCredentials structure', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
        remember: true,
      };

      expect(credentials.email).toBe('test@example.com');
      expect(credentials.remember).toBe(true);
    });

    it('should handle optional fields in LoginCredentials', () => {
      const minimalCredentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      expect(minimalCredentials.email).toBe('test@example.com');
      expect(minimalCredentials.remember).toBeUndefined();
    });

    it('should have correct AuthResponse structure', () => {
      const authResponse: AuthResponse = {
        message: 'Login successful',
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          email_verified_at: null,
          is_email_verified: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_at_formatted: '2024年1月1日',
          updated_at_formatted: '2024年1月1日',
          account_age_days: 30,
        },
        token: 'jwt-token-here',
      };

      expect(authResponse.user.id).toBe(1);
      expect(authResponse.token).toBe('jwt-token-here');
      expect(typeof authResponse.message).toBe('string');
    });
  });

  describe('API types', () => {
    it('should have correct ApiResponse structure', () => {
      const apiResponse: ApiResponse<string> = {
        data: 'test data',
        message: 'Success',
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: 1,
          from: 1,
          to: 1,
        },
      };

      expect(apiResponse.data).toBe('test data');
      expect(apiResponse.message).toBe('Success');
      expect(apiResponse.meta?.total).toBe(1);
    });

    it('should handle ApiResponse without meta', () => {
      const simpleResponse: ApiResponse<number> = {
        data: 42,
        message: 'Simple response',
      };

      expect(simpleResponse.data).toBe(42);
      expect(simpleResponse.meta).toBeUndefined();
    });

    it('should have correct PaginationMeta structure', () => {
      const pagination: PaginationMeta = {
        current_page: 2,
        last_page: 5,
        per_page: 10,
        total: 50,
        from: 11,
        to: 20,
      };

      expect(pagination.current_page).toBe(2);
      expect(pagination.total).toBe(50);
      expect(typeof pagination.last_page).toBe('number');
    });

    it('should have correct ApiError structure', () => {
      const apiError: ApiError = {
        message: 'Something went wrong',
        errors: {
          email: ['Email is required'],
          password: ['Password too short'],
        },
        error: 'VALIDATION_ERROR',
      };

      expect(apiError.message).toBe('Something went wrong');
      expect(apiError.error).toBe('VALIDATION_ERROR');
      expect(apiError.errors?.email).toEqual(['Email is required']);
    });
  });

  describe('Type compatibility', () => {
    it('should allow Post to be used in ApiResponse', () => {
      const postResponse: ApiResponse<Post> = {
        data: {
          id: 1,
          title: 'Test',
          content: 'Content',
          excerpt: 'Excerpt',
          status: 'published',
          status_label: '公開',
          published_at: '2024-01-01T00:00:00Z',
          published_at_formatted: '2024年1月1日',
          is_published: true,
          is_draft: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_at_formatted: '2024年1月1日',
          updated_at_formatted: '2024年1月1日',
          meta: {
            title_length: 4,
            content_length: 7,
            excerpt_length: 7,
            reading_time_minutes: 1,
          },
        },
        message: 'Post retrieved',
      };

      expect(postResponse.data?.title).toBe('Test');
    });

    it('should allow arrays in ApiResponse', () => {
      const postsResponse: ApiResponse<Post[]> = {
        data: [],
        message: 'Posts retrieved',
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: 0,
          from: 0,
          to: 0,
        },
      };

      expect(Array.isArray(postsResponse.data)).toBe(true);
      expect(postsResponse.meta?.total).toBe(0);
    });
  });
});