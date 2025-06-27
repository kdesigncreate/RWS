# Supabaseプロジェクトセットアップガイド

## 1. Supabaseプロジェクトの作成

### 1.1 Supabaseダッシュボードでの操作
1. [Supabase](https://supabase.com)にログイン
2. 「New Project」をクリック
3. 組織を選択（または新規作成）
4. プロジェクト設定：
   - **Name**: `rws-blog`
   - **Database Password**: 強力なパスワードを設定（例: `RwsBlog2024!`)
   - **Region**: 最寄りのリージョンを選択（例: `Asia Pacific (Tokyo)`）
5. 「Create new project」をクリック

### 1.2 プロジェクト情報の取得
プロジェクト作成後、以下の情報をメモしてください：

- **Project Reference**: `ixrwzaasrxoshjnpxnme`（URLから取得）
- **Database URL**: `postgresql://postgres:[YOUR-PASSWORD]@db.ixrwzaasrxoshjnpxnme.supabase.co:5432/postgres`
- **API URL**: `https://ixrwzaasrxoshjnpxnme.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 2. ローカルプロジェクトのリンク

### 2.1 プロジェクトリファレンスの確認
```bash
# プロジェクトディレクトリに移動
cd /home/kenta/RWS/supabase

# プロジェクトをリンク
npx supabase link --project-ref ixrwzaasrxoshjnpxnme
```

### 2.2 データベースパスワードの設定
```bash
# データベースパスワードを設定
npx supabase db remote commit --password "RwsBlog2024!"
```

## 3. データベースマイグレーション

### 3.1 マイグレーションの実行
```bash
# マイグレーションをリモートにプッシュ
npx supabase db push

# データベースの状態を確認
npx supabase db diff
```

### 3.2 初期データの確認
Supabaseダッシュボードの「Table Editor」で以下を確認：
- `users`テーブルに管理者ユーザーが作成されているか
- `posts`テーブルにサンプル記事が作成されているか

## 4. Edge Functionのデプロイ

### 4.1 環境変数の設定
```bash
# 環境変数を設定
npx supabase secrets set SUPABASE_URL=https://ixrwzaasrxoshjnpxnme.supabase.co
npx supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
npx supabase secrets set JWT_SECRET=your-super-secret-jwt-key-here
npx supabase secrets set ALLOWED_ORIGINS=https://rws-3ygr4esxd-kentas-projects-9fa01438.vercel.app,http://localhost:3000
```

### 4.2 Edge Functionのデプロイ
```bash
# Edge Functionをデプロイ
npx supabase functions deploy laravel-api

# デプロイ状況を確認
npx supabase functions list
```

## 5. セキュリティ設定

### 5.1 RLSポリシーの確認
Supabaseダッシュボードの「Authentication > Policies」で以下を確認：
- `users`テーブル: 全てのアクセスが拒否されているか
- `posts`テーブル: 公開記事のみ読み取り可能か

### 5.2 セキュリティ設定の実行
```bash
# セキュリティ設定エンドポイントを呼び出し
curl -X POST https://ixrwzaasrxoshjnpxnme.supabase.co/functions/v1/laravel-api/api/setup-security \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 6. テスト

### 6.1 APIヘルスチェック
```bash
# ヘルスチェックエンドポイント
curl https://ixrwzaasrxoshjnpxnme.supabase.co/functions/v1/laravel-api/api/health
```

### 6.2 記事一覧の取得
```bash
# 公開記事一覧の取得
curl https://ixrwzaasrxoshjnpxnme.supabase.co/functions/v1/laravel-api/api/posts
```

### 6.3 管理者ログイン
```bash
# 管理者ログイン
curl -X POST https://ixrwzaasrxoshjnpxnme.supabase.co/functions/v1/laravel-api/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

## 7. トラブルシューティング

### 7.1 よくある問題

#### プロジェクトリンクエラー
```bash
# プロジェクトリファレンスを確認
npx supabase projects list

# 再リンク
npx supabase link --project-ref ixrwzaasrxoshjnpxnme
```

#### データベース接続エラー
```bash
# 接続情報を確認
npx supabase status

# パスワードを再設定
npx supabase db remote commit --password "RwsBlog2024!"
```

#### Edge Functionデプロイエラー
```bash
# ログを確認
npx supabase functions logs laravel-api

# 再デプロイ
npx supabase functions deploy laravel-api --no-verify-jwt
```

### 7.2 ログの確認
```bash
# Edge Functionのログ
npx supabase functions logs laravel-api

# データベースのログ
npx supabase db logs
```

## 8. 次のステップ

1. **Vercel環境変数の設定**
   - `NEXT_PUBLIC_API_BASE_URL`
   - `NEXT_PUBLIC_FRONTEND_URL`

2. **フロントエンドのデプロイ**
   - GitHubにプッシュしてVercelが自動デプロイ

3. **機能テスト**
   - フロントエンドからのAPI呼び出し
   - 管理者ログイン機能
   - 記事管理機能

---

このガイドに従ってSupabaseプロジェクトをセットアップしてください。 