import type { AuthUser } from "./auth";

// 記事のステータス型
export type PostStatus = "draft" | "published";

// 記事の基本型
export interface Post {
  id: number;
  title: string;
  content: string;
  excerpt: string | null;
  status: PostStatus;
  status_label: string;
  published_at: string | null;
  published_at_formatted: string | null;
  is_published: boolean;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  created_at_formatted: string;
  updated_at_formatted: string;
  author?: AuthUser;
  user_id?: number;
  meta: {
    title_length: number;
    content_length: number;
    excerpt_length: number;
    reading_time_minutes: number;
  };
}

// 記事作成・更新用の型
export interface CreatePostData {
  title: string;
  content: string;
  excerpt?: string;
  status: PostStatus;
  published_at?: string;
  user_id?: number | null;
}

export interface UpdatePostData extends CreatePostData {
  id: number;
}

// 記事検索パラメータ型
export interface PostSearchParams {
  search?: string;
  status?: PostStatus | "all";
  page?: number;
  limit?: number;
  sort?: "created_at" | "published_at" | "title";
  order?: "asc" | "desc";
}

// ページネーション情報型
export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  per_page: number;
  to: number | null;
  total: number;
}

// API レスポンス型（一覧）
export interface PostsResponse {
  data: Post[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: PaginationMeta;
}

// API レスポンス型（単体）
export interface PostResponse {
  data: Post;
}

// フォーム用の型
export interface PostFormData {
  title: string;
  content: string;
  excerpt: string;
  status: PostStatus;
  published_at?: Date | null;
}

// usePostsフック用の型定義
export interface UsePostsState {
  posts: Post[];
  currentPost: Post | null;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
  };
}

export interface UsePostsReturn extends UsePostsState {
  // 公開記事用メソッド
  fetchPublicPosts: (params?: PostSearchParams) => Promise<void>;
  fetchPublicPost: (id: number) => Promise<void>;

  // 管理者用メソッド
  fetchAdminPosts: (params?: PostSearchParams) => Promise<void>;
  fetchAdminPost: (id: number) => Promise<void>;
  createPost: (
    data: CreatePostData,
  ) => Promise<{ success: boolean; post?: Post; error?: string }>;
  updatePost: (
    id: number,
    data: UpdatePostData,
  ) => Promise<{ success: boolean; post?: Post; error?: string }>;
  deletePost: (id: number) => Promise<{ success: boolean; error?: string }>;

  // ユーティリティメソッド
  clearError: () => void;
  clearCurrentPost: () => void;
  resetPosts: () => void;
}

// PostTable関連の型定義
export type SortableField = "title" | "status" | "created_at" | "published_at";

export interface PostTableProps {
  posts: Post[];
  loading?: boolean;
  selectedPosts?: number[];
  onSelectionChange?: (selectedIds: number[]) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  onView?: (post: Post) => void;
  onSort?: (field: string, direction: "asc" | "desc") => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  className?: string;
}

export interface PostTableActionsProps {
  selectedCount: number;
  onBulkDelete?: () => void;
  onBulkPublish?: () => void;
  onBulkUnpublish?: () => void;
  onClearSelection?: () => void;
  className?: string;
}
