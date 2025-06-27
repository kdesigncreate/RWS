-- R.W.S管理者データの挿入
-- 管理者ログイン情報:
-- メールアドレス: admin@rws-dribble.com
-- パスワード: RWS2024!AdminPass

INSERT INTO public.users (
    id, 
    name, 
    email, 
    email_verified_at, 
    password, 
    remember_token, 
    created_at, 
    updated_at
) VALUES (
    1,
    'R.W.S管理者',
    'admin@rws-dribble.com',
    NOW(),
    '$2b$12$oXnJNGXDKBZLqY8e6.Q8UOj7V3pHj5ZK8tQrX9YpLm4NzSgE2O.2W',  -- bcrypt hash for 'RWS2024!AdminPass'
    NULL,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    updated_at = NOW();

-- 管理者権限の確認コメント
COMMENT ON TABLE public.users IS 'Users table with admin user: admin@rws-dribble.com';

-- セキュリティのためのメモ
-- このパスワードハッシュは bcrypt で安全にハッシュ化されています
-- 本番環境では定期的なパスワード変更を推奨します