import type { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  noindex?: boolean;
}

const DEFAULT_METADATA = {
  siteName: 'R.W.Sドリブル塾',
  description: 'R.W.Sドリブル塾は、全国でサッカーのドリブル技術向上を目的としたスクールを開催しています。',
  keywords: ['サッカー', 'ドリブル', 'スクール', 'RWS', 'サッカー教室', 'ドリブル塾'],
  image: '/images/og-image.jpg',
  twitterCreator: '@rwsdribble',
};

export function generateMetadata({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  noindex = false,
}: SEOConfig): Metadata {
  const metaTitle = title.includes(DEFAULT_METADATA.siteName) 
    ? title 
    : `${title} | ${DEFAULT_METADATA.siteName}`;

  const metaDescription = description || DEFAULT_METADATA.description;
  const metaKeywords = [...DEFAULT_METADATA.keywords, ...keywords];
  const metaImage = image || DEFAULT_METADATA.image;
  const metaUrl = url || '/';

  const metadata: Metadata = {
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords,
    authors: author ? [{ name: author }] : [{ name: DEFAULT_METADATA.siteName }],
    creator: DEFAULT_METADATA.siteName,
    publisher: DEFAULT_METADATA.siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type,
      locale: 'ja_JP',
      url: metaUrl,
      title: metaTitle,
      description: metaDescription,
      siteName: DEFAULT_METADATA.siteName,
      images: [
        {
          url: metaImage,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
      ...(type === 'article' && {
        publishedTime,
        modifiedTime,
        authors: author ? [author] : [],
        section,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      creator: DEFAULT_METADATA.twitterCreator,
      images: [metaImage],
    },
    robots: noindex
      ? {
          index: false,
          follow: false,
        }
      : {
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
  };

  return metadata;
}

// 記事用のメタデータ生成
export function generatePostMetadata({
  post,
  url,
}: {
  post: {
    title: string;
    excerpt?: string;
    content: string;
    author?: { name: string };
    published_at?: string;
    updated_at?: string;
  };
  url: string;
}): Metadata {
  const description = 
    post.excerpt || 
    post.content.replace(/<[^>]*>/g, '').slice(0, 160) + '...';

  return generateMetadata({
    title: post.title,
    description,
    keywords: ['サッカー記事', 'ドリブル技術', 'サッカー情報'],
    url,
    type: 'article',
    publishedTime: post.published_at,
    modifiedTime: post.updated_at,
    author: post.author?.name,
    section: 'サッカー',
  });
}

// 構造化データの型定義
interface OrganizationData {
  sameAs?: string[];
  address?: {
    '@type': string;
    addressCountry?: string;
    addressRegion?: string;
  };
  areaServed?: string;
  serviceType?: string;
}

interface ArticleData {
  title: string;
  description: string;
  author?: string;
  publishedTime?: string | null;
  modifiedTime?: string;
  url: string;
  image?: string;
}

interface WebSiteData {
  [key: string]: unknown;
}

type StructuredDataConfig = 
  | { type: 'Organization'; data: OrganizationData }
  | { type: 'Article'; data: ArticleData }
  | { type: 'WebSite'; data: WebSiteData };

// 構造化データの生成
export function generateStructuredData(config: StructuredDataConfig) {
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  
  switch (config.type) {
    case 'Organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: DEFAULT_METADATA.siteName,
        url: baseUrl,
        logo: `${baseUrl}/images/logo.png`,
        description: DEFAULT_METADATA.description,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Service',
          availableLanguage: 'Japanese',
        },
        ...config.data,
      };
    
    case 'Article':
      return {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: config.data.title,
        author: {
          '@type': 'Person',
          name: config.data.author || DEFAULT_METADATA.siteName,
        },
        publisher: {
          '@type': 'Organization',
          name: DEFAULT_METADATA.siteName,
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/images/logo.png`,
          },
        },
        datePublished: config.data.publishedTime,
        dateModified: config.data.modifiedTime,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${baseUrl}${config.data.url}`,
        },
        image: `${baseUrl}${config.data.image || DEFAULT_METADATA.image}`,
        ...config.data,
      };
    
    case 'WebSite':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: DEFAULT_METADATA.siteName,
        url: baseUrl,
        description: DEFAULT_METADATA.description,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${baseUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
        ...config.data,
      };
    
    default:
      return null;
  }
}