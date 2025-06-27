/** @type {import('next').NextConfig} */
const nextConfig = {
  // 強制キャッシュバスティング
  generateBuildId: async () => {
    return `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },

  // 画像最適化設定
  images: {
    // サポートする画像フォーマット（WebP、AVIF）
    formats: ['image/webp', 'image/avif'],
    
    // 外部画像ドメインの許可設定
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      }
    ],
    
    // レスポンシブ画像のデバイスサイズ設定
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    
    // 画像アイコンサイズ設定
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // 画像キャッシュの最小保持時間（秒）- 1日に短縮
    minimumCacheTTL: 86400,
  },

  // Next.js実験的機能
  experimental: {
    // パッケージインポートの最適化
    optimizePackageImports: ['lucide-react'],
  },

  // SWCコンパイラの最適化設定
  compiler: {
    // 本番環境でconsole.logを自動削除
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // gzip圧縮の有効化
  compress: true,

  // Webpack設定のカスタマイズ（パス解決を強化）
  webpack: (config, { isServer }) => {
    // 出力ファイル名を強制変更してキャッシュバスティング
    if (!isServer) {
      config.output.filename = `static/chunks/[name]-${Date.now()}-[contenthash].js`
      config.output.chunkFilename = `static/chunks/[name]-${Date.now()}-[contenthash].js`
    }
    
    // エイリアス設定を強化
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
    };
    return config;
  },

  // セキュリティヘッダーの設定 + キャッシュ無効化
  async headers() {
    return [
      {
        // 静的アセットのキャッシュを無効化
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
        ],
      },
      {
        // すべてのページに適用
        source: '/(.*)',
        headers: [
          {
            // クリックジャッキング攻撃を防止
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // MIMEタイプスニッフィングを防止
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // リファラー情報の送信制御
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // ページキャッシュも無効化
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            // Content Security Policy でSupabaseドメインをブロック
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://vercel.live wss://ws-*.pusher-channels.vercel.app https://vitals.vercel-analytics.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "block-all-mixed-content",
              "upgrade-insecure-requests"
            ].join('; ')
          },
        ],
      },
    ];
  },

  // Docker等のコンテナ環境に最適化した出力設定
  output: 'standalone',

  // URLの末尾スラッシュの処理設定
  trailingSlash: false,

  // React厳密モードの有効化（開発時のエラー検出強化）
  reactStrictMode: true,

  // 処理対象となるページファイルの拡張子
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // TypeScriptの設定
  typescript: {
    // ビルド時のTypeScriptエラーを無視しない
    ignoreBuildErrors: false,
  },

  // ESLintの設定
  eslint: {
    // ビルド時のESLintエラーを無視しない
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;