import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rws-ruddy.vercel.app'
  
  // 基本的な静的ページのサイトマップ
  // 動的コンテンツは後でGoogle Search Consoleで追加するか、
  // ランタイムでのサイトマップ更新を実装する
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // 投稿記事は動的に生成されるため、ここでは含めない
    // 代わりにGoogle Search Consoleでインデックス登録を行う
  ]
}