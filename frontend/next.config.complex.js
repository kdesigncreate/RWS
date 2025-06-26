/** @type {import('next').NextConfig} */
const nextConfig = {
  // 画像最適化設定
  images: {
    // 画像フォーマット設定
    formats: ['image/webp', 'image/avif'],
    
    // 外部画像ドメインの許可
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.rws-dribble.com',
        port: '',
        pathname: '/storage/**',
      },
    ],
    
    // 画像サイズ設定
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // 画像の最小キャッシュ時間（秒）
    minimumCacheTTL: 31536000, // 1年
  },

  // 実験的機能
  experimental: {
    // 画像最適化の実験的機能
    optimizePackageImports: ['lucide-react', '@headlessui/react'],
  },

  // Webpack設定のカスタマイズ
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle analyzer（開発時のみ、パッケージが利用可能な場合のみ）
    if (!dev && !isServer && process.env.ANALYZE === 'true') {
      try {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: '../bundle-analyzer-report.html',
          })
        );
      } catch (error) {
        console.warn('webpack-bundle-analyzer not available, skipping bundle analysis');
      }
    }

    // SVGファイルのインライン化（パッケージが利用可能な場合のみ）
    try {
      config.module.rules.push({
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      });
    } catch (error) {
      console.warn('@svgr/webpack not available, skipping SVG inline optimization');
    }

    return config;
  },

  // 本番ビルド最適化
  compiler: {
    // 本番環境でのconsole.log削除
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 圧縮設定
  compress: true,

  // HTTPヘッダー設定
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "media-src 'self' https:",
              "connect-src 'self' " + (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000') + " https://www.google-analytics.com",
              "object-src 'none'",
              "frame-src 'none'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
              "manifest-src 'self'",
              "worker-src 'self' blob:",
            ].join('; '),
          },
          // セキュリティヘッダー
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
      {
        // 静的アセットのキャッシュ設定
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // APIレスポンスのキャッシュ設定
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=60',
          },
        ],
      },
    ];
  },

  // リダイレクト設定
  async redirects() {
    return [
      // 旧URLから新URLへのリダイレクト
      {
        source: '/news/:path*',
        destination: '/info/:path*',
        permanent: true,
      },
    ];
  },

  // Rewrite設定（必要に応じて）
  async rewrites() {
    return [
      // API プロキシ設定（開発環境用）
      ...(process.env.NODE_ENV === 'development' ? [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/:path*`,
        },
      ] : []),
    ];
  },

  // 出力設定
  output: 'standalone', // Docker等での使用に最適化

  // トレイリングスラッシュの設定
  trailingSlash: false,

  // 厳密モード
  reactStrictMode: true,

  // SWC（Rust製コンパイラ）の設定は不要（デフォルトで有効）

  // ページ拡張子設定
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // 環境変数の公開設定
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // TypeScript設定
  typescript: {
    // 本番ビルド時にTypeScriptエラーを無視（非推奨）
    // ignoreBuildErrors: false,
  },

  // ESLint設定
  eslint: {
    // 本番ビルド時にESLintエラーを無視（非推奨）
    // ignoreDuringBuilds: false,
  },

  // PWA設定（next-pwaプラグイン使用時）
  ...(process.env.NODE_ENV === 'production' && {
    // PWA設定はここに追加
  }),
};

module.exports = nextConfig;