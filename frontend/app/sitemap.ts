import { MetadataRoute } from 'next'

// サイト内の投稿を取得するためのAPI呼び出し
async function fetchPosts() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl) {
      console.warn('NEXT_PUBLIC_SUPABASE_URL not configured, returning empty posts array')
      return []
    }
    
    const authToken = serviceKey || anonKey
    if (!authToken) {
      console.warn('No Supabase auth token available, returning empty posts array')
      return []
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/api/posts?limit=1000&status=published`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000),
    })
    
    if (!response.ok) {
      console.error('Failed to fetch posts for sitemap:', response.status, response.statusText)
      return []
    }
    
    const data = await response.json()
    const posts = data.data || []
    console.log(`Sitemap: Fetched ${posts.length} published posts`)
    return posts
  } catch (error) {
    console.error('Error fetching posts for sitemap:', error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rws-ruddy.vercel.app'
  
  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
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
  ]

  // 動的ページ（投稿記事）
  const posts = await fetchPosts()
  const postPages: MetadataRoute.Sitemap = posts
    .filter((post: any) => post.status === 'published') // 公開済みの記事のみ
    .map((post: any) => ({
      url: `${baseUrl}/info/${post.id}`,
      lastModified: new Date(post.updated_at || post.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  return [...staticPages, ...postPages]
}