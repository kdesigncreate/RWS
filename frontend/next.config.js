/** @type {import('next').NextConfig} */
const nextConfig = {
  // 適切なビルドID生成（環境に応じて最適化）
  generateBuildId: async () => {
    // 本番環境では Git commit hash を使用
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
      return process.env.VERCEL_GIT_COMMIT_SHA;
    }

    // CI環境では短いハッシュを使用
    if (process.env.CI) {
      return `ci-${Date.now().toString(36)}`;
    }

    // 開発環境では固定値でキャッシュを活用
    if (process.env.NODE_ENV === "development") {
      return "dev-build";
    }

    // その他の場合はタイムスタンプベース
    return `build-${Date.now().toString(36)}`;
  },

  // 画像最適化設定
  images: {
    // サポートする画像フォーマット（WebP、AVIF）
    formats: ["image/webp", "image/avif"],

    // 外部画像ドメインの許可設定
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        port: "",
        pathname: "/vi/**",
      },
    ],

    // レスポンシブ画像のデバイスサイズ設定（3840を削除）
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],

    // 画像アイコンサイズ設定
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // 画像キャッシュの最小保持時間（秒）- 1日に短縮
    minimumCacheTTL: 86400,

    // 画像の最適化を無効にする場合の設定（デバッグ用）
    unoptimized: false,
  },

  // Next.js実験的機能
  experimental: {
    // パッケージインポートの最適化
    optimizePackageImports: ["lucide-react"],
  },

  // SWCコンパイラの最適化設定
  compiler: {
    // 本番環境でconsole.logを自動削除
    removeConsole: process.env.NODE_ENV === "production",
  },

  // セキュリティヘッダーの設定
  async headers() {
    return [
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/js/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // gzip圧縮の有効化
  compress: true,

  // Webpack設定のカスタマイズ（最適化されたキャッシュ戦略）
  webpack: (config, { isServer, dev }) => {
    // エイリアス設定を強化
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": require("path").resolve(__dirname),
    };

    // 本番環境でのみ最適化を適用
    if (!dev && !isServer) {
      // contenthashを使用した効率的なキャッシュ戦略
      // Next.jsのデフォルトのハッシュ戦略を使用（カスタマイズ不要）

      // バンドルサイズ最適化
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // 大きなライブラリを別チャンクに分離
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              minSize: 20000,
            },
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },
};

module.exports = nextConfig;
