/**
 * APIエンドポイント定義
 * 型安全なAPIコール用のインターフェース
 */

import { secureApiClient, ApiResponse } from './secure-client';
import type {
  LoginInput,
  RegisterInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  CreatePostInput,
  UpdatePostInput,
  DeletePostInput,
  CreateCommentInput,
  FileUploadInput,
  ContactInput,
  SearchInput,
  UserSettingsInput,
  PaginationInput,
  FilterInput,
} from '@/lib/validation/schemas';

// レスポンス型定義
export interface User {
  id: number;
  name: string;
  email: string;
  bio?: string;
  website?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published';
  publishedAt?: string;
  authorId: number;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  content: string;
  postId: number;
  parentId?: number;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  type: string;
}

// 認証API
export const authApi = {
  login: async (data: LoginInput): Promise<ApiResponse<AuthResponse>> => {
    return secureApiClient.post<AuthResponse>('/auth/login', data);
  },

  register: async (data: RegisterInput): Promise<ApiResponse<AuthResponse>> => {
    return secureApiClient.post<AuthResponse>('/auth/register', data);
  },

  logout: async (): Promise<ApiResponse<void>> => {
    return secureApiClient.post<void>('/auth/logout');
  },

  forgotPassword: async (data: ForgotPasswordInput): Promise<ApiResponse<{ message: string }>> => {
    return secureApiClient.post<{ message: string }>('/auth/forgot-password', data);
  },

  resetPassword: async (data: ResetPasswordInput): Promise<ApiResponse<{ message: string }>> => {
    return secureApiClient.post<{ message: string }>('/auth/reset-password', data);
  },

  changePassword: async (data: ChangePasswordInput): Promise<ApiResponse<{ message: string }>> => {
    return secureApiClient.put<{ message: string }>('/auth/change-password', data);
  },

  refreshToken: async (): Promise<ApiResponse<{ token: string; expiresAt: string }>> => {
    return secureApiClient.post<{ token: string; expiresAt: string }>('/auth/refresh');
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    return secureApiClient.get<User>('/auth/profile');
  },

  updateProfile: async (data: UserSettingsInput): Promise<ApiResponse<User>> => {
    return secureApiClient.put<User>('/auth/profile', data);
  },
};

// 投稿API
export const postsApi = {
  getAll: async (params: PaginationInput & FilterInput = {}): Promise<ApiResponse<PaginatedResponse<Post>>> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    return secureApiClient.get<PaginatedResponse<Post>>(`/posts?${searchParams.toString()}`);
  },

  getById: async (id: number): Promise<ApiResponse<Post>> => {
    return secureApiClient.get<Post>(`/posts/${id}`);
  },

  create: async (data: CreatePostInput): Promise<ApiResponse<Post>> => {
    return secureApiClient.post<Post>('/posts', data);
  },

  update: async (data: UpdatePostInput): Promise<ApiResponse<Post>> => {
    const { id, ...updateData } = data;
    return secureApiClient.put<Post>(`/posts/${id}`, updateData);
  },

  delete: async (data: DeletePostInput): Promise<ApiResponse<void>> => {
    return secureApiClient.delete<void>(`/posts/${data.id}`, {
      body: JSON.stringify({ csrfToken: data.csrfToken }),
    });
  },

  search: async (params: SearchInput): Promise<ApiResponse<PaginatedResponse<Post>>> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    return secureApiClient.get<PaginatedResponse<Post>>(`/posts/search?${searchParams.toString()}`);
  },
};

// コメントAPI
export const commentsApi = {
  getByPostId: async (postId: number, params: PaginationInput = {}): Promise<ApiResponse<PaginatedResponse<Comment>>> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    return secureApiClient.get<PaginatedResponse<Comment>>(`/posts/${postId}/comments?${searchParams.toString()}`);
  },

  create: async (data: CreateCommentInput): Promise<ApiResponse<Comment>> => {
    return secureApiClient.post<Comment>('/comments', data);
  },

  delete: async (id: number, csrfToken: string): Promise<ApiResponse<void>> => {
    return secureApiClient.delete<void>(`/comments/${id}`, {
      body: JSON.stringify({ csrfToken }),
    });
  },
};

// ファイルアップロードAPI
export const uploadApi = {
  uploadFile: async (file: File, csrfToken: string): Promise<ApiResponse<UploadResponse>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('csrfToken', csrfToken);
    
    return secureApiClient.upload<UploadResponse>('/upload', formData);
  },

  uploadAvatar: async (file: File, csrfToken: string): Promise<ApiResponse<UploadResponse>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('csrfToken', csrfToken);
    
    return secureApiClient.upload<UploadResponse>('/upload/avatar', formData);
  },

  deleteFile: async (filename: string, csrfToken: string): Promise<ApiResponse<void>> => {
    return secureApiClient.delete<void>('/upload', {
      body: JSON.stringify({ filename, csrfToken }),
    });
  },
};

// お問い合わせAPI
export const contactApi = {
  submit: async (data: ContactInput): Promise<ApiResponse<{ message: string }>> => {
    return secureApiClient.post<{ message: string }>('/contact', data);
  },
};

// ヘルスチェックAPI
export const healthApi = {
  check: async (): Promise<ApiResponse<{ status: string; timestamp: string }>> => {
    return secureApiClient.get<{ status: string; timestamp: string }>('/health', {
      skipAuth: true,
      timeout: 5000,
    });
  },
};

// セキュリティAPI
export const securityApi = {
  reportCSPViolation: async (violation: any): Promise<ApiResponse<void>> => {
    return secureApiClient.post<void>('/security/csp-violation', violation, {
      skipAuth: true,
    });
  },

  reportXSSAttempt: async (attempt: any): Promise<ApiResponse<void>> => {
    return secureApiClient.post<void>('/security/xss-attempt', attempt, {
      skipAuth: true,
    });
  },

  getSecurityEvents: async (params: PaginationInput = {}): Promise<ApiResponse<PaginatedResponse<any>>> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    return secureApiClient.get<PaginatedResponse<any>>(`/security/events?${searchParams.toString()}`);
  },
};

// React Query用のキー生成ヘルパー
export const queryKeys = {
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters: FilterInput) => [...queryKeys.posts.lists(), filters] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.posts.details(), id] as const,
    search: (query: string) => [...queryKeys.posts.all, 'search', query] as const,
  },
  comments: {
    all: ['comments'] as const,
    byPost: (postId: number) => [...queryKeys.comments.all, 'post', postId] as const,
  },
  auth: {
    profile: ['auth', 'profile'] as const,
  },
  security: {
    events: ['security', 'events'] as const,
  },
} as const;