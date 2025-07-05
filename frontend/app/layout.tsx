import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body
        className={`${inter.className} ${notoSansJP.className} font-sans antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
