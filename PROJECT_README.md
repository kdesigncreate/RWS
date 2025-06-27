# R.W.S Blog - サッカースクールブログサイト

## 概要

R.W.S Blogは、サッカースクール向けのシンプルなブログサイトです。Next.js（フロントエンド）とSupabase（バックエンド・データベース）を使用して構築されています。

**🌐 本番環境**: https://rws-3ygr4esxd-kentas-projects-9fa01438.vercel.app

## 主な機能

### 公開側
- 📰 記事一覧表示
- 📖 個別記事表示
- 🔍 記事検索機能

### 管理者側
- 🔐 ログイン認証
- ✏️ 記事の作成・編集・削除
- 📊 公開/非公開設定
- 🔍 記事の検索・フィルタリング

## 技術スタック

### フロントエンド
- **TypeScript** - 型安全性
- **Next.js 15** - Reactフレームワーク（App Router）
- **Tailwind CSS** - スタイリング
- **shadcn/ui** - UIコンポーネント
- **Zod** - スキーマ定義・バリデーション
- **SWR** - データフェッチング・キャッシュ

### バックエンド
- **Supabase Edge Functions** - サーバーレスAPI
- **PostgreSQL** - データベース
- **JWT** - 認証
- **Row Level Security (RLS)** - データベースセキュリティ

### インフラ
- **Vercel** - フロントエンドホスティング
- **Supabase** - バックエンド・データベース
- **GitHub Actions** - CI/CD

## クイックスタート

### 前提条件
- Node.js 22.14.0以上
- npm 10.9.2以上
- Git

### 1. リポジトリのクローン
```bash
git clone https://github.com/your-username/rws-blog.git
cd rws-blog
```

### 2. フロントエンドのセットアップ
```bash
cd frontend
npm install
cp env.example .env.local
# .env.localファイルを編集して環境変数を設定
npm run dev
```

### 3. Supabaseのセットアップ
```bash
cd supabase
npx supabase init
npx supabase start
```

### 4. データベースの初期化
```bash
npx supabase db reset
```

## 開発環境

### フロントエンド開発
```bash
cd frontend
npm run dev          # 開発サーバー起動
npm run build        # ビルド
npm run test         # テスト実行
npm run lint         # リンター実行
```

### バックエンド開発
```bash
cd supabase
npx supabase functions serve laravel-api  # Edge Functionのローカル実行
npx supabase db diff                      # データベースの差分確認
```

## デプロイ

### 自動デプロイ（推奨）
GitHubのmainブランチにプッシュすると、GitHub Actionsが自動的にデプロイを実行します。

### 手動デプロイ
詳細な手順は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

```bash
# デプロイスクリプトの実行
./scripts/deploy.sh all
```

## 環境変数

### フロントエンド（.env.local）
```env
NEXT_PUBLIC_API_BASE_URL=https://your-project.supabase.co/functions/v1/laravel-api/api
NEXT_PUBLIC_FRONTEND_URL=https://rws-3ygr4esxd-kentas-projects-9fa01438.vercel.app
```

### Supabase（secrets）
```bash
npx supabase secrets set SUPABASE_URL=your-supabase-url
npx supabase secrets set SUPABASE_ANON_KEY=your-anon-key
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
npx supabase secrets set JWT_SECRET=your-jwt-secret
npx supabase secrets set ALLOWED_ORIGINS=https://rws-3ygr4esxd-kentas-projects-9fa01438.vercel.app,http://localhost:3000
```

## プロジェクト構造

```
├── frontend/                 # Next.jsフロントエンド
│   ├── app/                 # App Router
│   ├── components/          # Reactコンポーネント
│   ├── lib/                 # ユーティリティ
│   ├── types/               # TypeScript型定義
│   └── tests/               # テストファイル
├── supabase/                # Supabase設定
│   ├── functions/           # Edge Functions
│   ├── migrations/          # データベースマイグレーション
│   └── config.toml          # Supabase設定
├── scripts/                 # デプロイスクリプト
├── .github/                 # GitHub Actions
└── docs/                    # ドキュメント
```

## API エンドポイント

### 公開API
- `GET /api/posts` - 記事一覧取得
- `GET /api/posts/{id}` - 個別記事取得
- `GET /api/health` - ヘルスチェック

### 管理者API（認証必須）
- `POST /api/login` - ログイン
- `POST /api/logout` - ログアウト
- `GET /api/user` - ユーザー情報取得
- `GET /api/admin/posts` - 管理者用記事一覧
- `POST /api/admin/posts` - 記事作成
- `PUT /api/admin/posts/{id}` - 記事更新
- `DELETE /api/admin/posts/{id}` - 記事削除

## セキュリティ

- **Row Level Security (RLS)** - データベースレベルでのセキュリティ
- **JWT認証** - トークンベースの認証
- **CORS設定** - クロスオリジンリクエストの制御
- **レート制限** - API呼び出しの制限
- **入力値検証** - Zodによるバリデーション

## テスト

```bash
# フロントエンドテスト
cd frontend
npm run test
npm run test:e2e

# バックエンドテスト
cd supabase
npx supabase functions test laravel-api
```

## 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](./LICENSE) ファイルを参照してください。

## サポート

問題や質問がある場合は、GitHubのIssuesページでお知らせください。

## 更新履歴

- **v1.0.0** - 初期リリース
  - 基本的なブログ機能
  - 管理者認証
  - 記事管理機能 