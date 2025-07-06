import { NextRequest } from 'next/server'
import sitemap from '../sitemap'

// ISR（Incremental Static Regeneration）の設定
export const revalidate = 3600 // 1時間ごとに再生成

export async function GET(request: NextRequest) {
  try {
    const sitemapData = await sitemap()
    
    // XML形式でサイトマップを生成
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapData
  .map(
    (item) => `  <url>
    <loc>${item.url}</loc>
    <lastmod>${item.lastModified?.toISOString() || new Date().toISOString()}</lastmod>
    <changefreq>${item.changeFrequency || 'weekly'}</changefreq>
    <priority>${item.priority || 0.5}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1時間キャッシュ
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    
    // エラー時は最小限のサイトマップを返す
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${process.env.NEXT_PUBLIC_SITE_URL || 'https://rws-ruddy.vercel.app'}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`

    return new Response(fallbackXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=300, s-maxage=300', // エラー時は5分キャッシュ
      },
      status: 200, // エラーでも200を返して検索エンジンにはサイトマップを提供
    })
  }
}