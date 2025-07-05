"use client";

import { useState, useCallback, useEffect } from "react";
import { api, handleApiError } from "@/lib/api";
import type {
  Post,
  PostsResponse,
  PostResponse,
  CreatePostData,
  UpdatePostData,
  PostSearchParams,
  UsePostsState,
  UsePostsReturn,
} from "@/types/post";

/**
 * 記事管理用カスタムフック
 */
export function usePosts(): UsePostsReturn {
  const [state, setState] = useState<UsePostsState>({
    posts: [],
    currentPost: null,
    loading: false,
    error: null,
    pagination: {
      currentPage: 1,
      lastPage: 1,
      total: 0,
      perPage: 10,
    },
  });

  /**
   * ローディング状態を設定
   */
  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  }, []);

  /**
   * エラー状態を設定
   */
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  /**
   * エラーをクリア
   */
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  /**
   * 現在の記事をクリア
   */
  const clearCurrentPost = useCallback(() => {
    setState((prev) => ({ ...prev, currentPost: null }));
  }, []);

  /**
   * 記事一覧をリセット
   */
  const resetPosts = useCallback(() => {
    setState({
      posts: [],
      currentPost: null,
      loading: false,
      error: null,
      pagination: {
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 10,
      },
    });
  }, []);

  /**
   * 公開記事一覧を取得
   */
  const fetchPublicPosts = useCallback(
    async (params?: PostSearchParams) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<{ data: PostsResponse }>("/posts", { params });
        const postsData = response.data.data; // ← { data, meta, links }
        const responseData = Array.isArray(postsData.data) ? postsData.data : [];
        const newPosts =
          params?.page === 1 || !params?.page
            ? responseData
            : [...state.posts, ...responseData];

        setState((prev) => ({
          ...prev,
          posts: newPosts,
          pagination: {
            currentPage: postsData.meta?.current_page || 1,
            lastPage: postsData.meta?.last_page || 1,
            total: postsData.meta?.total || 0,
            perPage: postsData.meta?.per_page || 10,
          },
          loading: false,
        }));
      } catch (error) {
        const apiError = handleApiError(error);
        setError(apiError.message);
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  /**
   * 公開記事詳細を取得
   */
  const fetchPublicPost = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<PostResponse>(`/posts/${id}`);

        setState((prev) => ({
          ...prev,
          currentPost: response.data.data,
          loading: false,
        }));
      } catch (error) {
        const apiError = handleApiError(error);
        setError(apiError.message);
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  /**
   * 管理者用記事一覧を取得
   */
  const fetchAdminPosts = useCallback(
    async (params?: PostSearchParams) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<PostsResponse>("/admin/posts", {
          params,
        });

        setState((prev) => ({
          ...prev,
          posts: Array.isArray(response.data.data) ? response.data.data : [],
          pagination: {
            currentPage: response.data.meta?.current_page || 1,
            lastPage: response.data.meta?.last_page || 1,
            total: response.data.meta?.total || 0,
            perPage: response.data.meta?.per_page || 10,
          },
          loading: false,
        }));
      } catch (error) {
        const apiError = handleApiError(error);
        setError(apiError.message);
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  /**
   * 管理者用記事詳細を取得
   */
  const fetchAdminPost = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<PostResponse>(`/admin/posts/${id}`);

        setState((prev) => ({
          ...prev,
          currentPost: response.data.data,
          loading: false,
        }));
      } catch (error) {
        console.error("fetchAdminPost error:", error);
        const apiError = handleApiError(error);
        console.error("API Error details:", apiError);
        setError(apiError.message);
        setLoading(false);
      }
    },
    [setLoading, setError],
  );

  /**
   * 記事を作成
   */
  const createPost = useCallback(
    async (data: CreatePostData) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.post<PostResponse>("/admin/posts", data);

        setState((prev) => ({
          ...prev,
          currentPost: response.data.data,
          loading: false,
        }));

        return { success: true, post: response.data.data };
      } catch (error) {
        const apiError = handleApiError(error);
        setError(apiError.message);
        setLoading(false);
        return { success: false, error: apiError.message };
      }
    },
    [setLoading, setError],
  );

  /**
   * 記事を更新
   */
  const updatePost = useCallback(
    async (id: number, data: UpdatePostData) => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.put<PostResponse>(
          `/admin/posts/${id}`,
          data,
        );

        setState((prev) => ({
          ...prev,
          currentPost: response.data.data,
          // 一覧にある場合は更新
          posts: prev.posts.map((post) =>
            post.id === id ? response.data.data : post,
          ),
          loading: false,
        }));

        return { success: true, post: response.data.data };
      } catch (error) {
        const apiError = handleApiError(error);
        setError(apiError.message);
        setLoading(false);
        return { success: false, error: apiError.message };
      }
    },
    [setLoading, setError],
  );

  /**
   * 記事を削除
   */
  const deletePost = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);

      try {
        await api.delete(`/admin/posts/${id}`);

        setState((prev) => ({
          ...prev,
          posts: prev.posts.filter((post) => post.id !== id),
          currentPost: prev.currentPost?.id === id ? null : prev.currentPost,
          loading: false,
        }));

        return { success: true };
      } catch (error) {
        const apiError = handleApiError(error);
        setError(apiError.message);
        setLoading(false);
        return { success: false, error: apiError.message };
      }
    },
    [setLoading, setError],
  );

  return {
    // 状態
    ...state,

    // 公開記事用メソッド
    fetchPublicPosts,
    fetchPublicPost,

    // 管理者用メソッド
    fetchAdminPosts,
    fetchAdminPost,
    createPost,
    updatePost,
    deletePost,

    // ユーティリティメソッド
    clearError,
    clearCurrentPost,
    resetPosts,
  };
}
