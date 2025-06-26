import type { Metadata } from 'next';
import { Inter, Noto_Sans_JP } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({ 
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | R.W.Sドリブル塾',
    default: 'R.W.Sドリブル塾 - サッカードリブル技術向上',
  },
  description: 'R.W.Sドリブル塾は、全国でサッカーのドリブル技術向上を目的としたスクールを開催しています。',
  keywords: ['サッカー', 'ドリブル', 'スクール', 'RWS', 'サッカー教室', 'ドリブル塾'],
  authors: [{ name: 'R.W.Sドリブル塾' }],
  creator: 'R.W.Sドリブル塾',
  publisher: 'R.W.Sドリブル塾',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: '/',
    title: 'R.W.Sドリブル塾',
    description: 'サッカードリブル技術向上を目的としたスクール',
    siteName: 'R.W.Sドリブル塾',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'R.W.Sドリブル塾',
    description: 'サッカードリブル技術向上を目的としたスクール',
    creator: '@rwsdribble',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script 
          dangerouslySetInnerHTML={{
            __html: `
              // 緊急対応: ブラウザキャッシュ完全クリアとSupabase直接アクセス完全ブロック
              (function() {
                // ブラウザキャッシュの強制クリア
                try {
                  // Service Worker の削除
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for(let registration of registrations) {
                        registration.unregister();
                      }
                    });
                  }
                  
                  // すべてのキャッシュをクリア
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      for (let name of names) {
                        caches.delete(name);
                      }
                    });
                  }
                  
                  // LocalStorage の完全クリア
                  try {
                    localStorage.clear();
                    sessionStorage.clear();
                  } catch (e) {
                    console.warn('Could not clear storage:', e);
                  }
                  
                  console.log('Browser cache completely cleared');
                } catch (e) {
                  console.warn('Cache clearing failed:', e);
                }
                
                const originalFetch = window.fetch;
                const originalXHR = window.XMLHttpRequest;
                
                // Fetch API の完全インターセプト
                window.fetch = function(input, init) {
                  let url = '';
                  if (typeof input === 'string') {
                    url = input;
                  } else if (input instanceof URL) {
                    url = input.href;
                  } else if (input instanceof Request) {
                    url = input.url;
                  }
                  
                  // Supabase の完全ブロック
                  if (url.includes('supabase.co') || url.includes('ixrwzaasrxoshjnpxnme')) {
                    console.error('HARD BLOCKED: All Supabase access is forbidden:', url);
                    // ログイン試行の場合は /api/login にリダイレクト
                    if (url.includes('login') || url.includes('auth')) {
                      console.log('Redirecting to /api/login');
                      input = '/api/login';
                      if (init && init.method === 'POST') {
                        return originalFetch.apply(this, [input, init]);
                      }
                    }
                    return Promise.reject(new Error('Supabase access completely blocked. Use /api/* endpoints only.'));
                  }
                  
                  return originalFetch.apply(this, arguments);
                };
                
                // XMLHttpRequest の完全インターセプト
                const OriginalXHR = window.XMLHttpRequest;
                window.XMLHttpRequest = function() {
                  const xhr = new OriginalXHR();
                  const originalOpen = xhr.open;
                  
                  xhr.open = function(method, url, ...args) {
                    if (typeof url === 'string' && (url.includes('supabase.co') || url.includes('ixrwzaasrxoshjnpxnme'))) {
                      console.error('HARD BLOCKED: All Supabase XHR access is forbidden:', url);
                      throw new Error('Supabase access completely blocked. Use /api/* endpoints only.');
                    }
                    return originalOpen.apply(this, [method, url, ...args]);
                  };
                  
                  return xhr;
                };
                
                console.log('Complete Supabase blocker and cache cleaner initialized');
                
                // 強制リロード（一度だけ）
                if (!sessionStorage.getItem('force_reloaded')) {
                  sessionStorage.setItem('force_reloaded', 'true');
                  console.log('Forcing hard reload to clear old bundles...');
                  setTimeout(function() {
                    window.location.reload(true);
                  }, 1000);
                }
              })();
            `
          }} 
        />
      </head>
      <body className={`${inter.className} ${notoSansJP.className} font-sans antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}