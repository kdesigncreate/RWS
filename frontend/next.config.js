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
};

module.exports = nextConfig;