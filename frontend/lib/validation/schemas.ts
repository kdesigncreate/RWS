/**
 * セキュアな入力検証スキーマ
 * Zodを使用した厳格な型安全バリデーション
 */

import { z } from 'zod';
import { InputSanitizer, PasswordValidator } from '@/lib/security';

// 基本的なバリデーション関数（現在未使用だが将来の拡張用に保持）
// const sanitizedString = (maxLength: number = 255) =>
//   z.string()
//     .max(maxLength, `${maxLength}文字以内で入力してください`)
//     .transform((val) => InputSanitizer.escapeHtml(val.trim()));

// const sanitizedText = (maxLength: number = 10000) =>
//   z.string()
//     .max(maxLength, `${maxLength}文字以内で入力してください`)
//     .transform((val) => InputSanitizer.stripHtml(val.trim()));

// const sanitizedHtml = (maxLength: number = 50000) =>
//   z.string()
//     .max(maxLength, `${maxLength}文字以内で入力してください`)
//     .transform((val) => {
//       // 許可されたHTMLタグのみ保持
//       const allowedTags = /<\/?(?:p|br|strong|em|u|ol|ul|li|h[1-6]|blockquote|a)(?:\s[^>]*)?\/?>/gi;
//       const sanitized = val.replace(/<(?!\/?(?:p|br|strong|em|u|ol|ul|li|h[1-6]|blockquote|a)\b)[^>]*>/gi, '');
//       return InputSanitizer.removeJavaScript(sanitized);
//     });

const secureEmail = z.string()
  .email('有効なメールアドレスを入力してください')
  .max(254, 'メールアドレスが長すぎます')
  .transform((val) => val.toLowerCase().trim())
  .refine(
    (email) => {
      // 危険なドメインのブラックリスト
      const dangerousDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com'];
      const domain = email.split('@')[1];
      return !dangerousDomains.includes(domain);
    },
    { message: '一時的なメールアドレスは使用できません' }
  );

const securePassword = z.string()
  .min(8, 'パスワードは8文字以上である必要があります')
  .max(128, 'パスワードが長すぎます')
  .refine(
    (password) => {
      const validation = PasswordValidator.validate(password);
      return validation.isValid;
    },
    {
      message: 'パスワードが安全性要件を満たしていません',
    }
  );

const secureUrl = z.string()
  .url('有効なURLを入力してください')
  .max(2048, 'URLが長すぎます')
  .transform((val) => InputSanitizer.sanitizeUrl(val))
  .refine(
    (url) => {
      try {
        const urlObj = new URL(url);
        // HTTPSまたはHTTPのみ許可
        return ['https:', 'http:'].includes(urlObj.protocol);
      } catch {
        return false;
      }
    },
    { message: '安全でないURLです' }
  );

const secureFilename = z.string()
  .max(255, 'ファイル名が長すぎます')
  .transform((val) => InputSanitizer.sanitizeFilename(val))
  .refine(
    (filename) => {
      // 危険なファイル拡張子をチェック
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.vbs'];
      const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
      return !dangerousExtensions.includes(ext);
    },
    { message: '危険なファイル形式です' }
  );

// 認証関連スキーマ
export const loginSchema = z.object({
  email: secureEmail,
  password: z.string().min(1, 'パスワードを入力してください'),
  rememberMe: z.boolean().optional(),
  csrfToken: z.string().min(1, 'CSRFトークンが必要です'),
});

export const registerSchema = z.object({
  name: z.string().min(1, '名前を入力してください').max(50).transform((val) => InputSanitizer.escapeHtml(val.trim())),
  email: secureEmail,
  password: securePassword,
  passwordConfirmation: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: '利用規約に同意してください',
  }),
  csrfToken: z.string().min(1, 'CSRFトークンが必要です'),
}).refine(
  (data) => data.password === data.passwordConfirmation,
  {
    message: 'パスワードが一致しません',
    path: ['passwordConfirmation'],
  }
);

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '現在のパスワードを入力してください'),
  newPassword: securePassword,
  newPasswordConfirmation: z.string(),
  csrfToken: z.string().min(1, 'CSRFトークンが必要です'),
}).refine(
  (data) => data.newPassword === data.newPasswordConfirmation,
  {
    message: '新しいパスワードが一致しません',
    path: ['newPasswordConfirmation'],
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: '現在のパスワードと異なるパスワードを設定してください',
    path: ['newPassword'],
  }
);

export const forgotPasswordSchema = z.object({
  email: secureEmail,
  csrfToken: z.string().min(1, 'CSRFトークンが必要です'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'リセットトークンが必要です'),
  password: securePassword,
  passwordConfirmation: z.string(),
  csrfToken: z.string().min(1, 'CSRFトークンが必要です'),
}).refine(
  (data) => data.password === data.passwordConfirmation,
  {
    message: 'パスワードが一致しません',
    path: ['passwordConfirmation'],
  }
);

// 投稿関連スキーマ
export const createPostSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください').max(200).transform((val) => InputSanitizer.escapeHtml(val.trim())),
  content: z.string().min(1, '本文を入力してください').max(50000).transform((val) => {
    const sanitized = val.replace(/<(?!\/?(?:p|br|strong|em|u|ol|ul|li|h[1-6]|blockquote|a)\b)[^>]*>/gi, '');
    return InputSanitizer.removeJavaScript(sanitized);
  }),
  excerpt: z.string().max(500).transform((val) => InputSanitizer.stripHtml(val.trim())).optional(),
  status: z.enum(['draft', 'published'], {
    errorMap: () => ({ message: '有効なステータスを選択してください' }),
  }),
  publishedAt: z.string().datetime().optional(),
  csrfToken: z.string().min(1, 'CSRFトークンが必要です'),
});

export const updatePostSchema = createPostSchema.extend({
  id: z.number().int().positive('有効な投稿IDが必要です'),
});

export const deletePostSchema = z.object({
  id: z.number().int().positive('有効な投稿IDが必要です'),
  csrfToken: z.string().min(1, 'CSRFトークンが必要です'),
});

// コメント関連スキーマ
export const createCommentSchema = z.object({
  postId: z.number().int().positive('有効な投稿IDが必要です'),
  content: z.string().min(1, 'コメントを入力してください').max(1000).transform((val) => InputSanitizer.stripHtml(val.trim())),
  parentId: z.number().int().positive().optional(),
  authorName: z.string().min(1, '名前を入力してください').max(50).transform((val) => InputSanitizer.escapeHtml(val.trim())),
  authorEmail: secureEmail,
  csrfToken: z.string().min(1, 'CSRFトークンが必要です'),
});

// ファイルアップロード関連スキーマ
export const fileUploadSchema = z.object({
  file: z.object({
    name: secureFilename,
    size: z.number().max(10 * 1024 * 1024, 'ファイルサイズは10MB以下である必要があります'),
    type: z.string().refine(
      (type) => {
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'text/plain',
        ];
        return allowedTypes.includes(type);
      },
      { message: '許可されていないファイル形式です' }
    ),
  }),
  csrfToken: z.string().min(1, 'CSRFトークンが必要です'),
});

// お問い合わせ関連スキーマ
export const contactSchema = z.object({
  name: z.string().min(1, '名前を入力してください').max(100).transform((val) => InputSanitizer.escapeHtml(val.trim())),
  email: secureEmail,
  subject: z.string().min(1, '件名を入力してください').max(200).transform((val) => InputSanitizer.escapeHtml(val.trim())),
  message: z.string().min(10, 'メッセージは10文字以上入力してください').max(2000).transform((val) => InputSanitizer.stripHtml(val.trim())),
  phone: z.string()
    .regex(/^[\d\-\+\(\)\s]+$/, '有効な電話番号を入力してください')
    .optional()
    .transform((val) => val ? val.replace(/[^\d]/g, '') : undefined),
  csrfToken: z.string().min(1, 'CSRFトークンが必要です'),
});

// 検索関連スキーマ
export const searchSchema = z.object({
  query: z.string().min(1, '検索キーワードを入力してください').max(100).transform((val) => InputSanitizer.escapeHtml(val.trim())),
  category: z.enum(['all', 'posts', 'pages'], {
    errorMap: () => ({ message: '有効なカテゴリを選択してください' }),
  }).optional(),
  sortBy: z.enum(['relevance', 'date', 'title'], {
    errorMap: () => ({ message: '有効なソート方法を選択してください' }),
  }).optional(),
  page: z.number().int().min(1).max(1000).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// 設定関連スキーマ
export const userSettingsSchema = z.object({
  name: z.string().min(1, '名前を入力してください').max(50).transform((val) => InputSanitizer.escapeHtml(val.trim())),
  email: secureEmail,
  bio: z.string().max(500).transform((val) => InputSanitizer.stripHtml(val.trim())).optional(),
  website: secureUrl.optional(),
  avatar: secureFilename.optional(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    newsletter: z.boolean(),
  }),
  privacy: z.object({
    profilePublic: z.boolean(),
    showEmail: z.boolean(),
  }),
  csrfToken: z.string().min(1, 'CSRFトークンが必要です'),
});

// API エンドポイント関連スキーマ
export const paginationSchema = z.object({
  page: z.number().int().min(1).max(1000).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const filterSchema = z.object({
  status: z.enum(['all', 'published', 'draft']).optional(),
  category: z.string().max(50).optional(),
  tag: z.string().max(50).optional(),
  author: z.string().max(50).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

// 型定義のエクスポート
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type DeletePostInput = z.infer<typeof deletePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type UserSettingsInput = z.infer<typeof userSettingsSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type FilterInput = z.infer<typeof filterSchema>;

// バリデーションヘルパー関数
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      
      return { success: false, errors };
    }
    
    return {
      success: false,
      errors: { _global: ['予期しないエラーが発生しました'] },
    };
  }
}

// サニタイゼーション専用関数
export function sanitizeForDisplay(input: string): string {
  return InputSanitizer.escapeHtml(input);
}

export function sanitizeForStorage(input: string): string {
  return InputSanitizer.stripHtml(input);
}

export function sanitizeHtmlContent(input: string): string {
  // 基本的なHTMLタグのみ許可
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'a'];
  const tagRegex = new RegExp(`<(?!/?(?:${allowedTags.join('|')})\\b)[^>]*>`, 'gi');
  
  return InputSanitizer.removeJavaScript(input.replace(tagRegex, ''));
}