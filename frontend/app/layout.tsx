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
        {/* Google Analytics gtag.js */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7LBT7MWKRX"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7LBT7MWKRX');
          `}
        </Script>
      </head>
      <body
        className={`${inter.className} ${notoSansJP.className} font-sans antialiased`}
      >
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
