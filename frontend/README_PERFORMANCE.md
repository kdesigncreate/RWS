# パフォーマンス最適化ガイド

R.W.Sドリブル塾フロントエンドアプリケーションのパフォーマンス最適化について説明します。

## 🚀 実装済み最適化

### 1. コード分割と遅延読み込み

#### 主要コンポーネントの遅延読み込み
```typescript
import { LazyAdminLayout, LazyPostTable } from '@/components/lazy';

// 管理画面コンポーネント（重い）は遅延読み込み
const AdminPage = () => (
  <LazyAdminLayout>
    <LazyPostTable posts={posts} />
  </LazyAdminLayout>
);
```

#### 自動コード分割
- Next.js App Routerによる自動ルートベース分割
- 管理画面と公開サイトの完全分離
- 動的インポートによるオンデマンド読み込み

### 2. 画像最適化

#### Next.js Image最適化
```typescript
import { OptimizedImage, HeroImage, ThumbnailImage } from '@/components/common/OptimizedImage';

// 自動WebP変換、レスポンシブ対応
<HeroImage 
  src="/images/hero.jpg" 
  alt="メインビジュアル"
  variant="wide"
  priority={true}
/>
```

#### 特徴
- 自動WebP/AVIF変換
- レスポンシブ画像生成
- 遅延読み込み対応
- ブラウザキャッシュ最適化（1年間）

### 3. キャッシュ戦略

#### 多層キャッシュシステム
```typescript
import { apiCache, cachedApiCall } from '@/lib/cache';

// APIレスポンスの自動キャッシュ
const posts = await cachedApiCall(
  'posts-list',
  () => api.get('/posts'),
  5 * 60 * 1000, // 5分間キャッシュ
  ['posts'] // タグベース無効化
);
```

#### キャッシュ種類
- **メモリキャッシュ**: 短期データ（5分）
- **セッションストレージ**: APIレスポンス
- **ローカルストレージ**: ユーザー設定、画像メタデータ
- **Service Worker**: 静的アセット（将来対応）

### 4. バンドル最適化

#### Webpack設定（next.config.js）
```javascript
module.exports = {
  // Tree shaking最適化
  webpack: (config) => {
    config.optimization.usedExports = true;
    config.optimization.sideEffects = false;
    return config;
  },
  
  // 圧縮設定
  compress: true,
  swcMinify: true,
  
  // 実験的最適化
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};
```

#### バンドル分析
```bash
# バンドルサイズ分析
npm run analyze

# 詳細レポート生成
npm run bundle-analyzer
```

### 5. パフォーマンス監視

#### Web Vitals追跡
```typescript
import { usePerformanceMonitoring } from '@/lib/performance';

const Component = () => {
  const { measureApiCall, measureRender } = usePerformanceMonitoring();
  
  // API呼び出し時間測定
  const data = await measureApiCall('posts', () => fetchPosts());
  
  return <div>...</div>;
};
```

#### 監視メトリクス
- **LCP**: Largest Contentful Paint (< 2.5s)
- **FID**: First Input Delay (< 100ms)
- **CLS**: Cumulative Layout Shift (< 0.1)
- **FCP**: First Contentful Paint (< 1.8s)
- **TTFB**: Time to First Byte (< 800ms)

### 6. 仮想スクロール

#### 大量データの効率表示
```typescript
import { VirtualScrollList } from '@/components/common/VirtualScrollList';

<VirtualScrollList
  items={largePosts}
  config={{
    itemHeight: 100,
    containerHeight: 600,
    overscan: 5,
  }}
  renderItem={({ data, style }) => (
    <PostItem post={data} style={style} />
  )}
  onLoadMore={loadMorePosts}
  hasMore={hasMore}
/>
```

## 🎯 パフォーマンス目標

### Core Web Vitals目標値
- **LCP**: < 2.5秒（目標: 2.0秒以下）
- **FID**: < 100ms（目標: 50ms以下）
- **CLS**: < 0.1（目標: 0.05以下）

### 追加指標目標値
- **FCP**: < 1.8秒
- **Speed Index**: < 3.0秒
- **Bundle Size**: < 250KB（gzip済み）
- **API Response**: < 500ms（平均）

## 🔧 最適化技術詳細

### 1. レンダリング最適化

#### React.memo活用
```typescript
const PostCard = React.memo(({ post }) => {
  return <div>{post.title}</div>;
}, (prevProps, nextProps) => {
  return prevProps.post.id === nextProps.post.id;
});
```

#### useMemo/useCallback適用
```typescript
const ExpensiveComponent = ({ items }) => {
  const processedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      processed: heavyCalculation(item)
    }));
  }, [items]);

  const handleClick = useCallback((id) => {
    onItemClick(id);
  }, [onItemClick]);

  return <div>...</div>;
};
```

### 2. ネットワーク最適化

#### HTTP/2 Push対応
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [{
      source: '/',
      headers: [{
        key: 'Link',
        value: '</critical.css>; rel=preload; as=style'
      }]
    }];
  }
};
```

#### リソースヒント
```html
<link rel="preconnect" href="https://api.rws-dribble.com">
<link rel="dns-prefetch" href="https://images.unsplash.com">
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
```

### 3. Critical CSS

#### Above-the-fold最適化
```css
/* Critical CSS (インライン) */
.hero { /* 最初に見える部分 */ }
.navigation { /* ナビゲーション */ }

/* Non-critical CSS (遅延読み込み) */
.modal { /* モーダルウィンドウ */ }
.admin-panel { /* 管理画面 */ }
```

## 📊 パフォーマンス測定

### 開発時の測定
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Web Vitals測定
npm run dev
# DevToolsのLighthouseタブで測定
```

### 本番環境監視
```javascript
// Google Analytics 4連携
gtag('config', 'GA_MEASUREMENT_ID', {
  custom_map: {
    'custom_parameter_1': 'web_vitals_metric'
  }
});

// カスタム分析サービス
await fetch('/api/analytics', {
  method: 'POST',
  body: JSON.stringify({
    type: 'performance',
    metrics: performanceMonitor.getMetrics()
  })
});
```

## 🚨 パフォーマンス警告

### バンドルサイズ警告
```bash
# 250KB超過時に警告
next build
# Warning: Bundle size exceeded 250KB
```

### リアルタイム監視
```typescript
// 開発環境でのパフォーマンス警告
if (process.env.NODE_ENV === 'development') {
  performanceBudget.setBudget('LCP', 2500);
  
  // 予算超過時の警告
  performanceMonitor.recordWebVital = (metric) => {
    if (!performanceBudget.checkBudget(metric)) {
      console.warn(`Performance budget exceeded: ${metric.name}`);
    }
  };
}
```

## 🎛️ 設定とチューニング

### next.config.js 最適化設定
```javascript
module.exports = {
  // 画像最適化
  images: {
    quality: 80,
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1年
  },
  
  // 実験的機能
  experimental: {
    appDir: true,
    optimizePackageImports: ['lucide-react'],
  },
  
  // 圧縮とminify
  compress: true,
  swcMinify: true,
  
  // 本番最適化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

### Tailwind CSS最適化
```javascript
// tailwind.config.js
module.exports = {
  // 未使用スタイルの除去
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  
  // JITモード（高速ビルド）
  mode: 'jit',
  
  // CSS最適化
  corePlugins: {
    preflight: true,
  },
};
```

## 📈 継続的改善

### 月次パフォーマンス監査
1. **Core Web Vitals確認**
2. **バンドルサイズ分析**
3. **ユーザー体験測定**
4. **競合比較**

### 自動最適化プロセス
1. **CI/CDでのLighthouse実行**
2. **パフォーマンス回帰の検出**
3. **自動アラート設定**
4. **週次レポート生成**

## 🔍 デバッグとトラブルシューティング

### パフォーマンス問題の特定
```typescript
// レンダリング時間測定
const withPerformanceMonitoring = (Component) => {
  return (props) => {
    const startTime = performance.now();
    
    useEffect(() => {
      const endTime = performance.now();
      console.log(`${Component.name} render time: ${endTime - startTime}ms`);
    });
    
    return <Component {...props} />;
  };
};
```

### メモリリーク検出
```typescript
// メモリ使用量監視
setInterval(() => {
  if (performance.memory) {
    const memory = performance.memory;
    console.log(`Memory: ${memory.usedJSHeapSize / 1024 / 1024}MB`);
  }
}, 10000);
```

このパフォーマンス最適化により、ユーザー体験の大幅な向上とSEO効果の改善が期待できます。