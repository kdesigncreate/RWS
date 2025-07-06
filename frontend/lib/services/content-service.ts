/**
 * コンテンツサービス層
 * マイクロサービス化準備として、コンテンツ関連の処理を分離
 */

import { api, apiEndpoints } from '@/lib/api';
import { AppError, ErrorUtils } from '@/lib/errors';
import { logger } from '@/lib/logger';

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  author_id: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  tags?: string[];
  categories?: string[];
  featured_image?: string;
  meta_title?: string;
  meta_description?: string;
  slug?: string;
}

export interface CreatePostData {
  title: string;
  content: string;
  status?: 'draft' | 'published' | 'archived';
  tags?: string[];
  categories?: string[];
  featured_image?: string;
  meta_title?: string;
  meta_description?: string;
}

export interface UpdatePostData extends Partial<CreatePostData> {
  id: string;
}

export interface PostsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  tags?: string[];
  categories?: string[];
  sortBy?: 'created_at' | 'updated_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface PostsResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ContentStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  archivedPosts: number;
  totalViews: number;
  totalComments: number;
}

export class ContentService {
  private static instance: ContentService;
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5分

  private constructor() {}

  public static getInstance(): ContentService {
    if (!ContentService.instance) {
      ContentService.instance = new ContentService();
    }
    return ContentService.instance;
  }

  // 公開投稿の取得
  public async getPublicPosts(query: PostsQuery = {}): Promise<PostsResponse> {
    const cacheKey = `public-posts-${JSON.stringify(query)}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      logger.info('Fetching public posts', { query });
      
      const response = await api.get<PostsResponse>(apiEndpoints.posts, {
        params: query,
      });
      
      this.setCache(cacheKey, response.data);
      
      logger.info('Public posts fetched successfully', { 
        count: response.data.posts.length,
        total: response.data.pagination.total 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch public posts', { query, error });
      throw error;
    }
  }

  // 投稿詳細の取得
  public async getPost(id: string): Promise<Post> {
    const cacheKey = `post-${id}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      logger.info('Fetching post', { postId: id });
      
      const response = await api.get<{ post: Post }>(apiEndpoints.post(parseInt(id)));
      
      this.setCache(cacheKey, response.data.post);
      
      logger.info('Post fetched successfully', { postId: id });
      
      return response.data.post;
    } catch (error) {
      logger.error('Failed to fetch post', { postId: id, error });
      throw error;
    }
  }

  // 管理者向け投稿一覧の取得
  public async getAdminPosts(query: PostsQuery = {}): Promise<PostsResponse> {
    try {
      logger.info('Fetching admin posts', { query });
      
      const response = await api.get<PostsResponse>(apiEndpoints.adminPosts, {
        params: query,
      });
      
      logger.info('Admin posts fetched successfully', { 
        count: response.data.posts.length,
        total: response.data.pagination.total 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch admin posts', { query, error });
      throw error;
    }
  }

  // 管理者向け投稿詳細の取得
  public async getAdminPost(id: string): Promise<Post> {
    try {
      logger.info('Fetching admin post', { postId: id });
      
      const response = await api.get<{ post: Post }>(apiEndpoints.adminPost(parseInt(id)));
      
      logger.info('Admin post fetched successfully', { postId: id });
      
      return response.data.post;
    } catch (error) {
      logger.error('Failed to fetch admin post', { postId: id, error });
      throw error;
    }
  }

  // 投稿の作成
  public async createPost(data: CreatePostData): Promise<Post> {
    try {
      logger.info('Creating post', { title: data.title, status: data.status });
      
      const response = await api.post<{ post: Post }>(apiEndpoints.adminPosts, data);
      
      // キャッシュをクリア
      this.clearCacheByPattern('public-posts-');
      this.clearCacheByPattern('admin-posts-');
      
      logger.info('Post created successfully', { 
        postId: response.data.post.id,
        title: response.data.post.title 
      });
      
      return response.data.post;
    } catch (error) {
      logger.error('Failed to create post', { title: data.title, error });
      throw error;
    }
  }

  // 投稿の更新
  public async updatePost(data: UpdatePostData): Promise<Post> {
    try {
      logger.info('Updating post', { postId: data.id, title: data.title });
      
      const { id, ...updateData } = data;
      const response = await api.put<{ post: Post }>(
        apiEndpoints.adminPost(parseInt(id)),
        updateData
      );
      
      // 関連キャッシュをクリア
      this.clearCacheByPattern('public-posts-');
      this.clearCacheByPattern('admin-posts-');
      this.cache.delete(`post-${id}`);
      
      logger.info('Post updated successfully', { 
        postId: response.data.post.id,
        title: response.data.post.title 
      });
      
      return response.data.post;
    } catch (error) {
      logger.error('Failed to update post', { postId: data.id, error });
      throw error;
    }
  }

  // 投稿の削除
  public async deletePost(id: string): Promise<void> {
    try {
      logger.info('Deleting post', { postId: id });
      
      await api.delete(apiEndpoints.adminPost(parseInt(id)));
      
      // 関連キャッシュをクリア
      this.clearCacheByPattern('public-posts-');
      this.clearCacheByPattern('admin-posts-');
      this.cache.delete(`post-${id}`);
      
      logger.info('Post deleted successfully', { postId: id });
    } catch (error) {
      logger.error('Failed to delete post', { postId: id, error });
      throw error;
    }
  }

  // 投稿の公開
  public async publishPost(id: string): Promise<Post> {
    return this.updatePost({
      id,
      status: 'published',
    });
  }

  // 投稿の下書き化
  public async unpublishPost(id: string): Promise<Post> {
    return this.updatePost({
      id,
      status: 'draft',
    });
  }

  // 投稿のアーカイブ
  public async archivePost(id: string): Promise<Post> {
    return this.updatePost({
      id,
      status: 'archived',
    });
  }

  // 投稿の複製
  public async duplicatePost(id: string): Promise<Post> {
    try {
      logger.info('Duplicating post', { postId: id });
      
      const original = await this.getAdminPost(id);
      
      const duplicateData: CreatePostData = {
        title: `${original.title} (Copy)`,
        content: original.content,
        status: 'draft',
        tags: original.tags,
        categories: original.categories,
        meta_title: original.meta_title,
        meta_description: original.meta_description,
      };
      
      const duplicate = await this.createPost(duplicateData);
      
      logger.info('Post duplicated successfully', { 
        originalId: id,
        duplicateId: duplicate.id 
      });
      
      return duplicate;
    } catch (error) {
      logger.error('Failed to duplicate post', { postId: id, error });
      throw error;
    }
  }

  // 投稿の検索
  public async searchPosts(query: string, options: PostsQuery = {}): Promise<PostsResponse> {
    try {
      logger.info('Searching posts', { query, options });
      
      const searchQuery = {
        ...options,
        search: query,
      };
      
      const response = await api.get<PostsResponse>(apiEndpoints.posts, {
        params: searchQuery,
      });
      
      logger.info('Post search completed', { 
        query,
        results: response.data.posts.length 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to search posts', { query, error });
      throw error;
    }
  }

  // コンテンツ統計の取得
  public async getContentStats(): Promise<ContentStats> {
    try {
      logger.info('Fetching content stats');
      
      const response = await api.get<ContentStats>('/admin/stats/content');
      
      logger.info('Content stats fetched successfully');
      
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch content stats', { error });
      throw error;
    }
  }

  // タグ一覧の取得
  public async getTags(): Promise<string[]> {
    const cacheKey = 'tags';
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      logger.info('Fetching tags');
      
      const response = await api.get<{ tags: string[] }>('/tags');
      
      this.setCache(cacheKey, response.data.tags);
      
      return response.data.tags;
    } catch (error) {
      logger.error('Failed to fetch tags', { error });
      throw error;
    }
  }

  // カテゴリ一覧の取得
  public async getCategories(): Promise<string[]> {
    const cacheKey = 'categories';
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      logger.info('Fetching categories');
      
      const response = await api.get<{ categories: string[] }>('/categories');
      
      this.setCache(cacheKey, response.data.categories);
      
      return response.data.categories;
    } catch (error) {
      logger.error('Failed to fetch categories', { error });
      throw error;
    }
  }

  // キャッシュ管理
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.cacheTimeout,
    });
  }

  private clearCacheByPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  public clearCache(): void {
    this.cache.clear();
    logger.info('Content service cache cleared');
  }
}

// シングルトンインスタンスをエクスポート
export const contentService = ContentService.getInstance();