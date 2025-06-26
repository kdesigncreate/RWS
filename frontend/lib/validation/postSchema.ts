import { z } from 'zod';
// import type { PostStatus } from '@/types/post'; // 将来の拡張用にコメントアウト

// 記事ステータスのスキーマ
export const postStatusSchema = z.enum(['draft', 'published'] as const);

// 記事作成用スキーマ
export const createPostSchema = z.object({
    title: z
      .string()
      .min(1, 'タイトルは必須です')
      .max(255, 'タイトルは255文字以内で入力してください'),
    
    content: z
      .string()
      .min(10, '本文は10文字以上入力してください'),
    
    excerpt: z
      .string()
      .max(500, '抜粋は500文字以内で入力してください')
      .optional()
      .or(z.literal('')),
    
    status: postStatusSchema,
    
    published_at: z
      .string()
      .datetime()
      .optional()
      .or(z.literal(''))
      .or(z.null()),
  });

// 記事更新用スキーマ（部分更新用）
export const updatePostSchema = createPostSchema.partial().extend({
    id: z.number().positive('記事IDは正の数である必要があります').optional(),
  });

// 記事検索用スキーマ
export const searchPostSchema = z.object({
    search: z
      .string()
      .max(100, '検索キーワードは100文字以内で入力してください')
      .optional(),
    
    status: z
      .enum(['draft', 'published', 'all'] as const)
      .optional(),
    
    page: z
      .number()
      .int()
      .min(1, 'ページ番号は1以上である必要があります')
      .max(1000, 'ページ番号は1000以下である必要があります')
      .optional()
      .default(1),
    
    limit: z
      .number()
      .int()
      .min(1, '表示件数は1以上である必要があります')
      .max(50, '表示件数は50以下である必要があります')
      .optional()
      .default(10),
    
    sort: z
      .enum(['created_at', 'published_at', 'title'] as const)
      .optional()
      .default('created_at'),
    
    order: z
      .enum(['asc', 'desc'] as const)
      .optional()
      .default('desc'),
  });

// フォーム用スキーマ（フロントエンド用）
export const postFormSchema = z.object({
    title: z
      .string()
      .min(1, 'タイトルは必須です')
      .max(255, 'タイトルは255文字以内で入力してください'),
    
    content: z
      .string()
      .min(10, '本文は10文字以上入力してください'),
    
    excerpt: z
      .string()
      .max(500, '抜粋は500文字以内で入力してください')
      .optional(),
    
    status: postStatusSchema,
    
    published_at: z
      .date()
      .optional()
      .or(z.null()),
  });

// バリデーション関数のエクスポート
export const validateCreatePost = (data: unknown) => {
    return createPostSchema.safeParse(data);
  };
  
  export const validateUpdatePost = (data: unknown) => {
    return updatePostSchema.safeParse(data);
  };
  
  export const validateSearchPost = (data: unknown) => {
    return searchPostSchema.safeParse(data);
  };
  
  export const validatePostForm = (data: unknown) => {
    return postFormSchema.safeParse(data);
  };

// 型推論のエクスポート
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type SearchPostInput = z.infer<typeof searchPostSchema>;
export type PostFormInput = z.infer<typeof postFormSchema>;