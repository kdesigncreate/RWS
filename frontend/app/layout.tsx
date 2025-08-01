import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | R.W.Sドリブル塾",
    default: "R.W.Sドリブル塾 - サッカードリブル技術向上",
  },
  description:
    "R.W.Sドリブル塾は、全国でサッカーのドリブル技術向上を目的としたスクールを開催しています。",
  keywords: [
    "サッカー",
    "ドリブル",
    "スクール",
    "RWS",
    "サッカー教室",
    "ドリブル塾",
  ],
  authors: [{ name: "R.W.Sドリブル塾" }],
  creator: "R.W.Sドリブル塾",
  publisher: "R.W.Sドリブル塾",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
  ),
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/",
    title: "R.W.Sドリブル塾",
    description: "サッカードリブル技術向上を目的としたスクール",
    siteName: "R.W.Sドリブル塾",
  },
  twitter: {
    card: "summary_large_image",
    title: "R.W.Sドリブル塾",
    description: "サッカードリブル技術向上を目的としたスクール",
    creator: "@rwsdribble",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { SkipToMainContent } from "@/components/common/SkipLink";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <meta name="google-site-verification" content="LcTeuVl0cCqj2qwo-wlonGROzN9gmMf81eNuL70_KGs" />
        {/* Google Tag Manager */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
              `
            }}
          />
        )}
      </head>
      <body
        className={`${inter.className} ${notoSansJP.className} font-sans antialiased`}
      >
        {/* Google Tag Manager (noscript) */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <SkipToMainContent />
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <div id="root" role="application" aria-label="R.W.Sドリブル塾">
                {children}
              </div>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
