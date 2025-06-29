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
        <meta httpEquiv="Content-Security-Policy" content="
          default-src 'self';
          script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live;
          style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
          font-src 'self' https://fonts.gstatic.com;
          img-src 'self' data: blob: https:;
          connect-src 'self' https://*.vercel.app https://rws-ruddy.vercel.app https://vercel.live https://ws-ap1.pusher-channels.com wss://ws-ap1.pusher-channels.com https://vitals.vercel-analytics.com;
          object-src 'none';
          base-uri 'self';
          form-action 'self';
          block-all-mixed-content;
          upgrade-insecure-requests;
        " />
        <script dangerouslySetInnerHTML={{
          __html: `
            // 強制的にSupabaseアクセスをブロック
            (function() {
              const originalFetch = window.fetch;
              const originalXHR = window.XMLHttpRequest;
              
              // Fetch API完全ブロック
              window.fetch = function(input, init) {
                const url = typeof input === 'string' ? input : 
                           input instanceof URL ? input.href : 
                           input instanceof Request ? input.url : String(input);
                
                if (url.includes('supabase.co') || url.includes('ixrwzaasrxoshjnpxnme')) {
                  console.error('BLOCKED: Supabase direct access prevented:', url);
                  return Promise.reject(new Error('Supabase access blocked by CSP'));
                }
                
                return originalFetch.apply(this, arguments);
              };
              
              // XMLHttpRequest完全ブロック
              window.XMLHttpRequest = function() {
                const xhr = new originalXHR();
                const originalOpen = xhr.open;
                
                xhr.open = function(method, url, ...args) {
                  if (typeof url === 'string' && (url.includes('supabase.co') || url.includes('ixrwzaasrxoshjnpxnme'))) {
                    console.error('BLOCKED: Supabase XHR access prevented:', url);
                    throw new Error('Supabase access blocked by CSP');
                  }
                  return originalOpen.apply(this, [method, url, ...args]);
                };
                
                return xhr;
              };
              
              console.log('Supabase access blocker initialized');
            })();
          `
        }} />
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