#!/bin/bash

# R.W.S Blog デプロイスクリプト
# 使用方法: ./scripts/deploy.sh [frontend|backend|all]

set -e

# 色付きログ関数
log_info() {
    echo -e "\033[32m[INFO]\033[0m $1"
}

log_warn() {
    echo -e "\033[33m[WARN]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

# 環境変数ファイルの読み込み
load_env_file() {
    local env_file="${1:-.env.deploy}"
    
    if [ -f "$env_file" ]; then
        log_info "環境変数ファイルを読み込み中: $env_file"
        # shellcheck source=/dev/null
        set -a  # 自動エクスポートを有効化
        source "$env_file"
        set +a  # 自動エクスポートを無効化
    else
        log_warn "環境変数ファイルが見つかりません: $env_file"
        log_info "使用方法: cp .env.deploy.example .env.deploy && vi .env.deploy"
    fi
}

# 環境変数の確認
check_env_vars() {
    log_info "環境変数の確認中..."
    
    local missing_vars=()
    
    # Supabase環境変数をチェック
    [ -z "$SUPABASE_URL" ] && missing_vars+=("SUPABASE_URL")
    [ -z "$SUPABASE_ANON_KEY" ] && missing_vars+=("SUPABASE_ANON_KEY")
    [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] && missing_vars+=("SUPABASE_SERVICE_ROLE_KEY")
    [ -z "$JWT_SECRET" ] && missing_vars+=("JWT_SECRET")
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "以下の環境変数が設定されていません:"
        for var in "${missing_vars[@]}"; do
            log_error "  - $var"
        done
        log_info "環境変数を設定してから再実行してください。"
        log_info "設定方法:"
        log_info "  1. cp .env.deploy.example .env.deploy"
        log_info "  2. vi .env.deploy (値を設定)"
        log_info "  3. source .env.deploy (現在のセッションに読み込み)"
        exit 1
    fi
    
    log_info "環境変数の確認完了"
}

# フロントエンドのデプロイ
deploy_frontend() {
    log_info "フロントエンドのデプロイを開始..."
    
    cd frontend
    
    # 依存関係のインストール
    log_info "依存関係をインストール中..."
    npm ci
    
    # ビルド
    log_info "ビルド中..."
    npm run build
    
    # Vercelへのデプロイ
    log_info "Vercelにデプロイ中..."
    if command -v vercel &> /dev/null; then
        vercel --prod
    else
        log_warn "Vercel CLIがインストールされていません。手動でデプロイしてください。"
        log_info "GitHubにプッシュするとVercelが自動デプロイします。"
    fi
    
    cd ..
    log_info "フロントエンドのデプロイ完了"
}

# バックエンドのデプロイ
deploy_backend() {
    log_info "バックエンドのデプロイを開始..."
    
    cd supabase
    
    # Supabase CLIの確認
    if ! npx supabase --version &> /dev/null; then
        log_error "Supabase CLIがインストールされていません"
        log_info "インストール方法: npm install supabase --save-dev"
        exit 1
    fi
    
    # プロジェクトのリンク確認
    log_info "Supabaseプロジェクトの確認中..."
    if ! npx supabase status &> /dev/null; then
        log_error "Supabaseプロジェクトがリンクされていません"
        log_info "リンク方法: npx supabase link --project-ref YOUR_PROJECT_REF"
        exit 1
    fi
    
    # データベースマイグレーション
    log_info "データベースマイグレーションを実行中..."
    npx supabase db push
    
    # Edge Functionのデプロイ
    log_info "Edge Functionをデプロイ中..."
    npx supabase functions deploy api
    
    # 環境変数の設定
    log_info "環境変数を設定中..."
    npx supabase secrets set SUPABASE_URL="$SUPABASE_URL"
    npx supabase secrets set SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
    npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
    npx supabase secrets set JWT_SECRET="$JWT_SECRET"
    
    # フロントエンド用の環境変数も設定
    npx supabase secrets set NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
    npx supabase secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
    
    # 動的な許可オリジン設定
    if [ -n "$ALLOWED_ORIGINS" ]; then
        npx supabase secrets set ALLOWED_ORIGINS="$ALLOWED_ORIGINS"
    else
        # デフォルトオリジン設定
        default_origins="http://localhost:3000"
        if [ -n "$VERCEL_URL" ]; then
            default_origins="$default_origins,https://$VERCEL_URL"
        fi
        if [ -n "$VERCEL_PROJECT_PRODUCTION_URL" ]; then
            default_origins="$default_origins,https://$VERCEL_PROJECT_PRODUCTION_URL"
        fi
        npx supabase secrets set ALLOWED_ORIGINS="$default_origins"
        log_warn "ALLOWED_ORIGINS not set, using defaults: $default_origins"
    fi
    
    cd ..
    log_info "バックエンドのデプロイ完了"
}

# セキュリティ設定
setup_security() {
    log_info "セキュリティ設定を実行中..."
    
    # セキュリティ設定エンドポイントを呼び出し
    curl -X POST "$SUPABASE_URL/functions/v1/api/api/setup-security" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{}' || log_warn "セキュリティ設定の実行に失敗しました"
    
    log_info "セキュリティ設定完了"
}

# ヘルスチェック
health_check() {
    log_info "ヘルスチェックを実行中..."
    
    # APIのヘルスチェック
    if curl -f "$SUPABASE_URL/functions/v1/api/api/health" > /dev/null 2>&1; then
        log_info "APIヘルスチェック: OK"
    else
        log_error "APIヘルスチェック: FAILED"
        return 1
    fi
    
    log_info "ヘルスチェック完了"
}

# メイン処理
main() {
    local target="${1:-all}"
    local env_file="${2:-.env.deploy}"
    
    log_info "R.W.S Blog デプロイスクリプトを開始"
    
    # 環境変数ファイルの読み込み
    load_env_file "$env_file"
    
    # 環境変数の確認
    check_env_vars
    
    case $target in
        "frontend")
            deploy_frontend
            ;;
        "backend")
            deploy_backend
            setup_security
            ;;
        "all")
            deploy_backend
            setup_security
            deploy_frontend
            ;;
        *)
            log_error "無効なターゲット: $target"
            log_info "使用方法: $0 [frontend|backend|all] [env-file]"
            log_info "例:"
            log_info "  $0 all                    # .env.deployを使用"
            log_info "  $0 backend .env.prod      # .env.prodを使用"
            log_info "  $0 frontend              # フロントエンドのみ"
            exit 1
            ;;
    esac
    
    # ヘルスチェック
    if [ "$target" != "frontend" ]; then
        sleep 10  # デプロイ完了を待つ
        health_check
    fi
    
    log_info "デプロイ完了！"
}

# スクリプトの実行
main "$@" 