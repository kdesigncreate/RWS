import { z } from 'zod';

// ログイン用スキーマ
export const loginSchema = z.object({
    email: z
      .string()
      .min(1, 'メールアドレスは必須です')
      .email('有効なメールアドレスを入力してください')
      .max(255, 'メールアドレスは255文字以内で入力してください'),
    
    password: z
      .string()
      .min(8, 'パスワードは8文字以上で入力してください')
      .max(255, 'パスワードは255文字以内で入力してください'),
    
    remember: z
      .boolean()
      .optional()
      .default(false),
  });

// パスワード変更用スキーマ（将来的な拡張用）
export const changePasswordSchema = z.object({
    current_password: z
      .string()
      .min(8, '現在のパスワードは8文字以上である必要があります'),
    
    new_password: z
      .string()
      .min(8, '新しいパスワードは8文字以上で入力してください')
      .max(255, 'パスワードは255文字以内で入力してください'),
    
    new_password_confirmation: z
      .string()
      .min(8, 'パスワード確認は8文字以上で入力してください'),
  }).refine(
    (data) => data.new_password === data.new_password_confirmation,
    {
      message: 'パスワードが一致しません',
      path: ['new_password_confirmation'],
    }
  );

// プロフィール更新用スキーマ（将来的な拡張用）
export const updateProfileSchema = z.object({
    name: z
      .string()
      .min(1, '名前は必須です')
      .max(255, '名前は255文字以内で入力してください'),
    
    email: z
      .string()
      .min(1, 'メールアドレスは必須です')
      .email('有効なメールアドレスを入力してください')
      .max(255, 'メールアドレスは255文字以内で入力してください'),
  });
  

// バリデーション関数のエクスポート
export const validateLogin = (data: unknown) => {
    return loginSchema.safeParse(data);
  };
  
export const validateChangePassword = (data: unknown) => {
    return changePasswordSchema.safeParse(data);
  };
  
export const validateUpdateProfile = (data: unknown) => {
    return updateProfileSchema.safeParse(data);
  };

// 型推論のエクスポート
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// エラーメッセージのカスタマイズ
export const authErrorMessages = {
    email: {
      required: 'メールアドレスは必須です',
      invalid: '有効なメールアドレスを入力してください',
      tooLong: 'メールアドレスは255文字以内で入力してください',
    },
    password: {
      required: 'パスワードは必須です',
      tooShort: 'パスワードは8文字以上で入力してください',
      tooLong: 'パスワードは255文字以内で入力してください',
    },
    name: {
      required: '名前は必須です',
      tooLong: '名前は255文字以内で入力してください',
    },
  } as const;