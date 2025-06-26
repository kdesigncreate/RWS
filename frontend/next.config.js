/** @type {import('next').NextConfig} */
const nextConfig = {
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
    
    // 画像キャッシュの最小保持時間（秒）- 1年間
    minimumCacheTTL: 31536000,
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

  // セキュリティヘッダーの設定
  async headers() {
    return [
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