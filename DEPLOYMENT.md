# デプロイメントガイド

Vercel（フロントエンド）とSupabase（バックエンド・データベース）へのデプロイ手順

## 📋 デプロイ前の準備

### 1. 必要なアカウント
- [Vercel](https://vercel.com/) アカウント
- [Supabase](https://supabase.com/) アカウント
- GitHubリポジトリ

### 2. 環境変数の確認
作成した設定ファイルを確認：
- `frontend/.env.example`
- `backend/.env.example`
- `vercel.json`
- `supabase/config.toml`

## 🗄️ Supabaseセットアップ（バックエンド・データベース）

### 1. プロジェクト作成
1. [Supabase Dashboard](https://app.supabase.com/)にログイン
2. "New Project"をクリック
3. プロジェクト名: `rws-blog` 
4. データベースパスワードを設定（強力なパスワードを使用）
5. リージョンを選択（Asia Northeast推奨）

### 2. データベースセットアップ
1. Supabase CLIをインストール:
   ```bash
   npm install -g supabase
   ```

2. プロジェクトと接続:
   ```bash
   supabase login
   supabase init
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. マイグレーション実行:
   ```bash
   supabase db push
   ```

### 3. API URLとキーの取得
1. Supabase Dashboard → Settings → API
2. 以下をメモ：
   - Project URL: `https://your-project.supabase.co`
   - anon/public key
   - service_role key（管理用）

## 🚀 Vercelデプロイ（フロントエンド）

### 1. GitHubリポジトリ準備
```bash
git add .
git commit -m "Add deployment configuration"
git push origin main
```

### 2. Vercelプロジェクト作成
1. [Vercel Dashboard](https://vercel.com/dashboard)にログイン
2. "New Project"をクリック
3. GitHubリポジトリを選択
4. プロジェクト設定:
   - Framework Preset: **Next.js**
   - Root Directory: **frontend**
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3. 環境変数設定
Vercel Dashboard → Settings → Environment Variables で設定:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-project.supabase.co/rest/v1
NEXT_PUBLIC_FRONTEND_URL=https://your-vercel-app.vercel.app
NODE_ENV=production
```

### 4. デプロイ実行
1. "Deploy"ボタンをクリック
2. ビルドとデプロイが完了するまで待機
3. カスタムドメインの設定（必要に応じて）

## 🔧 Laravel（バックエンド）のデプロイ方法

### 方法1: Supabase Edge Functions（推奨）

1. **Edge Functionとして作成:**
   ```bash
   supabase functions new laravel-api
   ```

2. **Laravelコードを配置:**
   ```bash
   cp -r backend/* supabase/functions/laravel-api/
   ```

3. **デプロイ:**
   ```bash
   supabase functions deploy laravel-api
   ```

### 方法2: 外部サーバー（Railway、Heroku等）

1. **Railway使用例:**
   ```bash
   # Railwayアカウント作成後
   railway login
   railway new
   railway add
   railway up
   ```

2. **環境変数設定:**
   ```env
   APP_ENV=production
   APP_KEY=base64:your-app-key
   DB_CONNECTION=pgsql
   DB_HOST=db.your-project.supabase.co
   DB_PORT=5432
   DB_DATABASE=postgres
   DB_USERNAME=postgres
   DB_PASSWORD=your-database-password
   ```

## 🔗 設定の接続

### 1. CORS設定更新
backend/config/cors.php:
```php
'allowed_origins' => [
    'https://your-vercel-app.vercel.app',
    'http://localhost:3000', // 開発用
],
```

### 2. Sanctum設定更新
backend/config/sanctum.php:
```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'your-vercel-app.vercel.app,localhost:3000')),
```

### 3. フロントエンド設定更新
frontend/.env.production:
```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.com/api
NEXT_PUBLIC_FRONTEND_URL=https://your-vercel-app.vercel.app
```

## 📋 デプロイ後の確認項目

### ✅ フロントエンド確認
- [ ] Vercelでサイトが正常に表示される
- [ ] 管理者ページ（/admin）にアクセス可能
- [ ] 記事一覧ページが表示される
- [ ] レスポンシブデザインが正常

### ✅ バックエンド確認
- [ ] APIエンドポイントが応答する
- [ ] データベース接続が正常
- [ ] 認証システムが動作する
- [ ] CORS設定が正しい

### ✅ データベース確認
- [ ] テーブルが正常に作成されている
- [ ] 管理者ユーザーが作成されている
- [ ] サンプルデータが投入されている

## 🔒 セキュリティ設定

### SSL/TLS証明書
- Vercel: 自動的にLet's Encrypt証明書を提供
- カスタムドメイン使用時は適切なDNS設定が必要

### 環境変数の管理
- 本番環境では.envファイルは使用しない
- VecelとSupabaseの環境変数設定機能を使用
- 秘密鍵や認証情報は絶対にソースコードにコミットしない

### データベースセキュリティ
- Supabaseの Row Level Security (RLS) を有効化
- 適切なデータベースアクセス権限を設定
- 定期的なバックアップを設定

## 🚨 トラブルシューティング

### よくある問題

1. **CORS エラー**
   - backend/config/cors.php の allowed_origins を確認
   - フロントエンドのドメインが正しく設定されているか確認

2. **認証エラー**
   - SANCTUM_STATEFUL_DOMAINS の設定を確認
   - セッションドメインの設定を確認

3. **API接続エラー**
   - NEXT_PUBLIC_API_BASE_URL が正しく設定されているか確認
   - バックエンドAPIが正常に動作しているか確認

4. **ビルドエラー**
   - Node.jsとPHPのバージョンを確認
   - 依存関係の不整合を解決

### ログ確認
- Vercel: Vercel Dashboard → Functions → Logs
- Supabase: Supabase Dashboard → Logs
- Laravel: storage/logs/laravel.log

## 📞 サポート

技術的な問題が発生した場合：
1. まず[トラブルシューティング](#-トラブルシューティング)を確認
2. GitHubのIssuesで報告
3. 各プラットフォームの公式ドキュメントを参照:
   - [Vercel Docs](https://vercel.com/docs)
   - [Supabase Docs](https://supabase.com/docs)
   - [Laravel Deployment](https://laravel.com/docs/deployment)