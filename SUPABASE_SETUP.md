# Supabase Edge Functions デプロイガイド

このガイドでは、作成したEdge Functionを実際のSupabaseプロジェクトにデプロイする手順を説明します。

## 📋 前提条件

1. Supabaseアカウントとプロジェクトが作成済み
2. Supabase CLIがインストール済み
3. プロジェクトのREFERENCE IDを取得済み

## 🔧 セットアップ手順

### Step 1: Supabaseにログイン

**方法A: ブラウザ経由（推奨）**
```bash
npx supabase login
```

**方法B: アクセストークン使用**
1. [Supabase Dashboard](https://app.supabase.com/account/tokens) でアクセストークンを作成
2. トークンを使用してログイン:
```bash
export SUPABASE_ACCESS_TOKEN=your_access_token_here
npx supabase login --token $SUPABASE_ACCESS_TOKEN
```

### Step 2: プロジェクトにリンク

1. **Project Reference IDを取得:**
   - Supabase Dashboard → Settings → General
   - Reference ID をコピー（例: `abcdefghijklmnop`）

2. **プロジェクトにリンク:**
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

### Step 3: Edge Functionをデプロイ

```bash
npx supabase functions deploy laravel-api
```

### Step 4: 環境変数設定

```bash
# Supabase URL（自動設定）
npx supabase secrets set SUPABASE_URL=https://your-project.supabase.co

# Supabase Anon Key（自動設定）
npx supabase secrets set SUPABASE_ANON_KEY=your_anon_key_here
```

## 🔗 デプロイ後の設定

### Edge Function URL

デプロイ完了後、以下のURLでAPIにアクセス可能:
```
https://your-project.supabase.co/functions/v1/laravel-api
```

### フロントエンド環境変数更新

Vercel Dashboard → Settings → Environment Variables:
```env
NEXT_PUBLIC_API_BASE_URL=https://your-project.supabase.co/functions/v1/laravel-api
```

## 🧪 テスト

### API エンドポイントテスト

```bash
# Health check
curl https://your-project.supabase.co/functions/v1/laravel-api/api/health

# 記事一覧取得
curl https://your-project.supabase.co/functions/v1/laravel-api/api/posts

# 管理者ログイン
curl -X POST https://your-project.supabase.co/functions/v1/laravel-api/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

## 📝 利用可能なAPIエンドポイント

### パブリック
- `GET /api/health` - ヘルスチェック
- `GET /api/posts` - 公開記事一覧
- `GET /api/posts/{id}` - 記事詳細
- `POST /api/login` - ログイン
- `POST /api/logout` - ログアウト
- `GET /api/user` - ユーザー情報

### 管理者（認証要）
- `GET /api/admin/posts` - 全記事一覧
- `POST /api/admin/posts` - 記事作成
- `PUT /api/admin/posts/{id}` - 記事更新
- `DELETE /api/admin/posts/{id}` - 記事削除

## 🔧 トラブルシューティング

### ログ確認
```bash
npx supabase functions logs laravel-api
```

### 関数の詳細確認
```bash
npx supabase functions list
```

### 再デプロイ
```bash
npx supabase functions deploy laravel-api --no-verify-jwt
```

## 🚨 重要な注意事項

1. **認証の改善**: 現在のEdge Functionは簡易的な認証実装です。本番環境では適切なJWT認証を実装してください。

2. **パスワードハッシュ**: 実際のパスワード検証を実装する必要があります。

3. **エラーハンドリング**: より詳細なエラーハンドリングとロギングを追加してください。

4. **Rate Limiting**: APIアクセス制限を設定することを推奨します。

## 📞 サポート

デプロイで問題が発生した場合：
1. [Supabase Edge Functions ドキュメント](https://supabase.com/docs/guides/functions)を参照
2. `npx supabase functions logs laravel-api` でログを確認
3. Supabase Discord コミュニティで質問