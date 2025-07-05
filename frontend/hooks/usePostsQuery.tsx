"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, handleApiError } from "@/lib/api";
import type {
  Post,
  PostsResponse,
  PostResponse,
  CreatePostData,
  UpdatePostData,
  PostSearchParams,
} from "@/types/post";

// Query Keys
const QUERY_KEYS = {
  posts: (params?: PostSearchParams) => ['posts', params],
  adminPosts: (params?: PostSearchParams) => ['admin', 'posts', params],
  post: (id: number) => ['posts', id],
  adminPost: (id: number) => ['admin', 'posts', id],
} as const;

// Public Posts Queries
export function usePublicPosts(params?: PostSearchParams) {
  return useQuery({
    queryKey: QUERY_KEYS.posts(params),
    queryFn: async (): Promise<PostsResponse> => {
      const response = await api.get<PostsResponse>("/posts", { params });
      return response.data;
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5分間フレッシュ
  });
}

export function usePublicPost(id: number, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.post(id),
    queryFn: async (): Promise<Post> => {
      const response = await api.get<PostResponse>(`/posts/${id}`);
      return response.data.data;
    },
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10分間フレッシュ
  });
}

// Admin Posts Queries
export function useAdminPosts(params?: PostSearchParams) {
  return useQuery({
    queryKey: QUERY_KEYS.adminPosts(params),
    queryFn: async (): Promise<PostsResponse> => {
      const response = await api.get<PostsResponse>("/admin/posts", { params });
      return response.data;
    },
    enabled: true,
    staleTime: 2 * 60 * 1000, // 2分間フレッシュ（管理画面はより頻繁に更新）
  });
}

export function useAdminPost(id: number, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.adminPost(id),
    queryFn: async (): Promise<Post> => {
      const response = await api.get<PostResponse>(`/admin/posts/${id}`);
      return response.data.data;
    },
    enabled: enabled && !!id,
    staleTime: 1 * 60 * 1000, // 1分間フレッシュ
  });
}

// Mutations
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePostData): Promise<Post> => {
      const response = await api.post<PostResponse>("/admin/posts", data);
      return response.data.data;
    },
    onSuccess: (newPost) => {
      // 管理画面の投稿一覧を無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      // 公開投稿一覧も無効化（公開済みの場合）
      if (newPost.is_published) {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      }
      // 新しい投稿をキャッシュに追加
      queryClient.setQueryData(QUERY_KEYS.adminPost(newPost.id), newPost);
    },
    onError: (error) => {
      console.error('Create post error:', error);
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdatePostData }): Promise<Post> => {
      const response = await api.put<PostResponse>(`/admin/posts/${id}`, data);
      return response.data.data;
    },
    onSuccess: (updatedPost) => {
      // 管理画面の投稿一覧を無効化
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      // 公開投稿一覧も無効化
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      // 更新された投稿をキャッシュに反映
      queryClient.setQueryData(QUERY_KEYS.adminPost(updatedPost.id), updatedPost);
      queryClient.setQueryData(QUERY_KEYS.post(updatedPost.id), updatedPost);
    },
    onError: (error) => {
      console.error('Update post error:', error);
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/admin/posts/${id}`);
    },
    onSuccess: (_, deletedId) => {
      // 投稿一覧を無効化
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      // 削除された投稿をキャッシュから削除
      queryClient.removeQueries({ queryKey: QUERY_KEYS.adminPost(deletedId) });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.post(deletedId) });
    },
    onError: (error) => {
      console.error('Delete post error:', error);
    },
  });
}

// Optimistic Updates Hook
export function useOptimisticPostUpdate() {
  const queryClient = useQueryClient();

  const optimisticUpdate = (id: number, updates: Partial<Post>) => {
    // 楽観的更新を適用
    queryClient.setQueryData(QUERY_KEYS.adminPost(id), (old: Post | undefined) => {
      if (!old) return old;
      return { ...old, ...updates };
    });

    queryClient.setQueryData(QUERY_KEYS.post(id), (old: Post | undefined) => {
      if (!old) return old;
      return { ...old, ...updates };
    });
  };

  const revertUpdate = (id: number) => {
    // 楽観的更新を元に戻す
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminPost(id) });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.post(id) });
  };

  return { optimisticUpdate, revertUpdate };
}