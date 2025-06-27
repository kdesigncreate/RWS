# R.W.S Blog デプロイ手順書

## 概要
このドキュメントでは、R.W.S BlogアプリケーションをVercel（フロントエンド）とSupabase（バックエンド・データベース）にデプロイする手順を説明します。

## 前提条件
- Node.js 22.14.0以上
- npm 10.9.2以上
- Git

## 1. Supabaseプロジェクトのセットアップ

### 1.1 Supabaseプロジェクトの作成
1. [Supabase](https://supabase.com)にログイン
2. 新しいプロジェクトを作成
3. プロジェクト名: `rws-blog`
4. データベースパスワードを設定して保存

### 1.2 ローカル環境の初期化
```bash
# Supabase CLIのインストール（プロジェクトローカル）
npm install supabase --save-dev

# プロジェクトディレクトリで初期化
cd supabase
npx supabase init

# リモートプロジェクトにリンク
npx supabase link --project-ref YOUR_PROJECT_REF
```

### 1.3 データベースマイグレーションの実行
```bash
# マイグレーションを実行
npx supabase db push

# シードデータを投入（必要に応じて）
npx supabase db reset
```

### 1.4 Edge Functionのデプロイ
```bash
# Edge Functionをデプロイ
npx supabase functions deploy laravel-api

# 環境変数を設定
npx supabase secrets set SUPABASE_URL=YOUR_SUPABASE_URL
npx supabase secrets set SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
npx supabase secrets set JWT_SECRET=YOUR_JWT_SECRET
npx supabase secrets set ALLOWED_ORIGINS=https://rws-3ygr4esxd-kentas-projects-9fa01438.vercel.app,http://localhost:3000
```

## 2. Vercelプロジェクトのセットアップ

### 2.1 Vercelプロジェクトの作成
1. [Vercel](https://vercel.com)にログイン
2. GitHubリポジトリをインポート
3. プロジェクト名: `rws-blog-frontend`
4. フレームワーク: Next.js
5. ルートディレクトリ: `frontend`

### 2.2 環境変数の設定
Vercelダッシュボードで以下の環境変数を設定：

```
NEXT_PUBLIC_API_BASE_URL=https://ixrwzaasrxoshjnpxnme.supabase.co/functions/v1/laravel-api/api
NEXT_PUBLIC_FRONTEND_URL=https://rws-3ygr4esxd-kentas-projects-9fa01438.vercel.app
NODE_ENV=production
```

### 2.3 デプロイ設定
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

## 3. データベースの初期設定

### 3.1 管理者ユーザーの作成
Supabaseダッシュボードで以下のSQLを実行：

```sql
-- 管理者ユーザーの作成
INSERT INTO users (name, email, password, created_at, updated_at)
VALUES (
  'Admin User',
  'admin@example.com',
  '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', -- password: Admin123!
  NOW(),
  NOW()
);

-- サンプル記事の作成
INSERT INTO posts (title, content, status, is_published, is_draft, published_at, user_id, created_at, updated_at)
VALUES (
  'ようこそ R.W.S Blogへ',
  'これは最初の記事です。R.W.S Blogへようこそ！',
  'published',
  true,
  false,
  NOW(),
  1,
  NOW(),
  NOW()
);
```

## 4. セキュリティ設定

### 4.1 データベースセキュリティの設定
```bash
# セキュリティ設定エンドポイントを呼び出し
curl -X POST https://ixrwzaasrxoshjnpxnme.supabase.co/functions/v1/laravel-api/api/setup-security \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 4.2 CORS設定の確認
Supabaseダッシュボードで以下を確認：
- Authentication > Settings > URL Configuration
- サイトURL: `https://rws-3ygr4esxd-kentas-projects-9fa01438.vercel.app`
- リダイレクトURL: `https://rws-3ygr4esxd-kentas-projects-9fa01438.vercel.app/admin`

## 5. デプロイ後の確認

### 5.1 ヘルスチェック
```bash
# APIのヘルスチェック
curl https://ixrwzaasrxoshjnpxnme.supabase.co/functions/v1/laravel-api/api/health

# フロントエンドの確認
curl https://rws-3ygr4esxd-kentas-projects-9fa01438.vercel.app
```

### 5.2 機能テスト
1. フロントエンドにアクセス: https://rws-3ygr4esxd-kentas-projects-9fa01438.vercel.app
2. 記事一覧の表示確認
3. 管理者ログイン: https://rws-3ygr4esxd-kentas-projects-9fa01438.vercel.app/admin
4. 記事の作成・編集・削除

## 6. トラブルシューティング

### 6.1 よくある問題

#### CORSエラー
- SupabaseのCORS設定を確認
- Edge FunctionのCORS設定を確認

#### 認証エラー
- JWT_SECRETの設定を確認
- ユーザーテーブルのデータを確認

#### データベース接続エラー
- Supabaseの接続情報を確認
- RLSポリシーの設定を確認

### 6.2 ログの確認
```bash
# Supabase Edge Functionのログ
npx supabase functions logs laravel-api

# Vercelのログ
vercel logs
```

## 7. 本番環境での注意事項

### 7.1 セキュリティ
- 強力なパスワードの使用
- 定期的なセキュリティアップデート
- ログの監視

### 7.2 パフォーマンス
- 画像の最適化
- キャッシュの活用
- CDNの利用

### 7.3 バックアップ
- データベースの定期バックアップ
- コードのバージョン管理

## 8. 更新手順

### 8.1 フロントエンドの更新
```bash
# コードをプッシュ
git push origin main

# Vercelが自動デプロイ
```

### 8.2 バックエンドの更新
```bash
# Edge Functionを再デプロイ
npx supabase functions deploy laravel-api

# データベースマイグレーション
npx supabase db push
```

## 9. 監視とメンテナンス

### 9.1 監視項目
- アプリケーションの応答時間
- エラー率
- データベースのパフォーマンス
- セキュリティイベント

### 9.2 定期メンテナンス
- 依存関係の更新
- セキュリティパッチの適用
- ログの整理
- パフォーマンスの最適化

---

この手順書に従ってデプロイを実行してください。問題が発生した場合は、ログを確認し、必要に応じてサポートに連絡してください。 