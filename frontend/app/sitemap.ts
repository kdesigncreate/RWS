import { MetadataRoute } from 'next'

interface Post {
  id: number
  status: string
  updated_at?: string
  created_at: string
}

interface ApiResponse {
  data?: Post[]
}

// 投稿記事を取得する関数（エラーハンドリング強化版）
async function fetchPublishedPosts(): Promise<Post[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // 環境変数チェック
    if (!supabaseUrl) {
      console.warn('NEXT_PUBLIC_SUPABASE_URL not found, using static sitemap only')
      return []
    }
    
    const authToken = serviceKey || anonKey
    if (!authToken) {
      console.warn('No Supabase auth token found, using static sitemap only')
      return []
    }

    console.log('Fetching posts for sitemap generation...')
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8秒タイムアウト

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/api/posts?limit=500&status=published`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        cache: 'no-store', // サイトマップ生成時はキャッシュしない
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.warn(`API request failed with status ${response.status}, using static sitemap only`)
        return []
      }

      const data = await response.json() as ApiResponse

      // レスポンス構造の検証
      if (!data || typeof data !== 'object') {
        console.warn('Invalid API response format, using static sitemap only')
        return []
      }

      if (!data.data) {
        console.warn('No data field in API response, using static sitemap only')
        return []
      }

      if (!Array.isArray(data.data)) {
        console.warn('data.data is not an array, using static sitemap only')
        return []
      }

      const posts = data.data.filter((post): post is Post => {
        return post && 
               typeof post === 'object' && 
               typeof post.id === 'number' && 
               post.status === 'published'
      })

      console.log(`Successfully fetched ${posts.length} published posts for sitemap`)
      return posts

    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('API request timed out, using static sitemap only')
    } else {
      console.warn('Error fetching posts for sitemap:', error instanceof Error ? error.message : 'Unknown error')
    }
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

  // 動的ページ（投稿記事）を安全に取得
  const posts = await fetchPublishedPosts()
  
  if (posts.length === 0) {
    console.log('No published posts found or API unavailable, returning static sitemap only')
    return staticPages
  }

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/info/${post.id}`,
    lastModified: new Date(post.updated_at || post.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  console.log(`Generated sitemap with ${staticPages.length} static pages and ${postPages.length} post pages`)
  return [...staticPages, ...postPages]
}