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

# 環境変数の確認
check_env_vars() {
    log_info "環境変数の確認中..."
    
    # Supabase環境変数
    if [ -z "$SUPABASE_URL" ]; then
        log_error "SUPABASE_URLが設定されていません"
        exit 1
    fi
    
    if [ -z "$SUPABASE_ANON_KEY" ]; then
        log_error "SUPABASE_ANON_KEYが設定されていません"
        exit 1
    fi
    
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        log_error "SUPABASE_SERVICE_ROLE_KEYが設定されていません"
        exit 1
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        log_error "JWT_SECRETが設定されていません"
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
    npx supabase functions deploy laravel-api
    
    # 環境変数の設定
    log_info "環境変数を設定中..."
    npx supabase secrets set SUPABASE_URL="$SUPABASE_URL"
    npx supabase secrets set SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
    npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
    npx supabase secrets set JWT_SECRET="$JWT_SECRET"
    npx supabase secrets set ALLOWED_ORIGINS="https://rws-3ygr4esxd-kentas-projects-9fa01438.vercel.app,http://localhost:3000"
    
    cd ..
    log_info "バックエンドのデプロイ完了"
}

# セキュリティ設定
setup_security() {
    log_info "セキュリティ設定を実行中..."
    
    # セキュリティ設定エンドポイントを呼び出し
    curl -X POST "$SUPABASE_URL/functions/v1/laravel-api/api/setup-security" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{}' || log_warn "セキュリティ設定の実行に失敗しました"
    
    log_info "セキュリティ設定完了"
}

# ヘルスチェック
health_check() {
    log_info "ヘルスチェックを実行中..."
    
    # APIのヘルスチェック
    if curl -f "$SUPABASE_URL/functions/v1/laravel-api/api/health" > /dev/null 2>&1; then
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
    
    log_info "R.W.S Blog デプロイスクリプトを開始"
    
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
            log_info "使用方法: $0 [frontend|backend|all]"
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