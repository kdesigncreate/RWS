// Laravel API Proxy for Supabase Edge Functions
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper function to format post data
function formatPost(post: any) {
  const now = new Date()
  const createdAt = new Date(post.created_at)
  const updatedAt = new Date(post.updated_at)
  
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt || post.content.substring(0, 100) + '...',
    status: post.status,
    status_label: post.status === 'published' ? '公開済み' : '下書き',
    published_at: post.published_at,
    published_at_formatted: post.published_at ? new Date(post.published_at).toLocaleDateString('ja-JP') : null,
    is_published: post.status === 'published',
    is_draft: post.status === 'draft',
    created_at: post.created_at,
    updated_at: post.updated_at,
    created_at_formatted: createdAt.toLocaleDateString('ja-JP'),
    updated_at_formatted: updatedAt.toLocaleDateString('ja-JP'),
    user_id: post.user_id || 1,
    author: { id: 1, name: 'Admin User', email: 'admin@example.com' },
    meta: {
      title_length: post.title?.length || 0,
      content_length: post.content?.length || 0,
      excerpt_length: (post.excerpt || post.content.substring(0, 100))?.length || 0,
      reading_time_minutes: Math.max(1, Math.ceil((post.content?.split(' ').length || 0) / 200))
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    let path = url.pathname
    
    // Remove /api prefix if present (from Vercel proxy)
    if (path.startsWith('/api')) {
      path = path.substring(4)
    }
    
    
    // Health check endpoint  
    if (path.includes('/health')) {
      return new Response(
        JSON.stringify({ 
          status: 'ok', 
          message: 'Laravel API is running',
          timestamp: new Date().toISOString()
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }


    // Debug posts endpoint
    if (path.includes('/debug-posts')) {
      try {
        const { data: posts, error } = await supabase
          .from('posts')
          .select('*')
          .order('id', { ascending: true })

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        return new Response(
          JSON.stringify({ 
            posts: posts || [],
            count: posts?.length || 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Admin single post (MOVED TO TOP FOR PRIORITY)
    if (path.match(/\/admin\/posts\/\d+$/) && req.method === 'GET') {
      const authHeader = req.headers.get('authorization')
      if (!authHeader || !authHeader.includes('Bearer')) {
        return new Response(
          JSON.stringify({ message: 'Unauthorized' }),
          { 
            status: 401,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      const postId = parseInt(path.split('/').pop() || '0')
      
      // Get post from database
      const { data: post, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .maybeSingle()
      
      if (error) {
        return new Response(
          JSON.stringify({ message: 'Database error', error: error.message }),
          { 
            status: 500,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }
      
      if (!post) {
        return new Response(
          JSON.stringify({ message: 'Post not found' }),
          { 
            status: 404,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      const formattedPost = formatPost(post)

      return new Response(
        JSON.stringify({ data: formattedPost }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Login endpoint
    if (path.includes('/login') && req.method === 'POST') {
      try {
        const body = await req.json()
        const { email, password } = body

        console.log('Login attempt:', { email, password: password ? '***' : 'missing', path })

        // Basic validation
        if (!email || !password) {
          console.log('Login validation failed:', { email: !!email, password: !!password })
          return new Response(
            JSON.stringify({ message: 'Email and password are required' }),
            { 
              status: 400,
              headers: { 
                ...corsHeaders,
                'Content-Type': 'application/json' 
              } 
            }
          )
        }

        // Use Supabase Auth for authentication
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
          })

          if (authError || !authData.user) {
            console.log('Supabase auth failed:', authError?.message)
            return new Response(
              JSON.stringify({ 
                message: 'Invalid credentials'
              }),
              { 
                status: 401,
                headers: { 
                  ...corsHeaders,
                  'Content-Type': 'application/json' 
                } 
              }
            )
          }

          console.log('Login successful for:', email)
          
          // Return user data and session token
          return new Response(
            JSON.stringify({ 
              message: 'Login successful',
              user: { 
                id: authData.user.id, 
                email: authData.user.email, 
                name: authData.user.user_metadata?.name || 'Admin User' 
              },
              token: authData.session?.access_token || 'no-token'
            }),
            { 
              headers: { 
                ...corsHeaders,
                'Content-Type': 'application/json' 
              } 
            }
          )
        } catch (authException) {
          console.error('Authentication exception:', authException)
          return new Response(
            JSON.stringify({ 
              message: 'Authentication system error',
              error: authException.message
            }),
            { 
              status: 500,
              headers: { 
                ...corsHeaders,
                'Content-Type': 'application/json' 
              } 
            }
          )
        }
      } catch (error) {
        console.error('Login endpoint error:', error)
        return new Response(
          JSON.stringify({ 
            message: 'Login processing error',
            error: error.message 
          }),
          { 
            status: 500,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }
    }

    // User info endpoint
    if (path.includes('/user') && req.method === 'GET') {
      const authHeader = req.headers.get('authorization')
      if (!authHeader || !authHeader.includes('Bearer')) {
        return new Response(
          JSON.stringify({ message: 'Unauthorized' }),
          { 
            status: 401,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      try {
        const token = authHeader.replace('Bearer ', '')
        
        // Get user from Supabase using the token
        const { data: userData, error: userError } = await supabase.auth.getUser(token)
        
        if (userError || !userData.user) {
          console.log('Token validation failed:', userError?.message)
          return new Response(
            JSON.stringify({ message: 'Invalid token' }),
            { 
              status: 401,
              headers: { 
                ...corsHeaders,
                'Content-Type': 'application/json' 
              } 
            }
          )
        }

        return new Response(
          JSON.stringify({ 
            data: { 
              id: userData.user.id, 
              email: userData.user.email, 
              name: userData.user.user_metadata?.name || 'Admin User' 
            }
          }),
          { 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      } catch (error) {
        console.error('User endpoint error:', error)
        return new Response(
          JSON.stringify({ 
            message: 'User authentication error',
            error: error.message 
          }),
          { 
            status: 500,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }
    }

    // Single post for public viewing (must come before posts list)
    if (path.match(/\/posts\/\d+$/) && req.method === 'GET') {
      const postId = parseInt(path.split('/').pop() || '0')
      
      // Get published post from database
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .eq('status', 'published')
        .limit(1)
      
      if (error) {
        return new Response(
          JSON.stringify({ message: 'Database error', error: error.message }),
          { 
            status: 500,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      const post = posts && posts.length > 0 ? posts[0] : null
      
      if (!post) {
        return new Response(
          JSON.stringify({ message: 'Post not found' }),
          { 
            status: 404,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      const formattedPost = formatPost(post)

      return new Response(
        JSON.stringify({ data: formattedPost }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Public posts list
    if (path.includes('/posts') && req.method === 'GET' && !path.includes('/admin') && !path.match(/\/posts\/\d+$/)) {
      const url = new URL(req.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)
      const search = url.searchParams.get('search') || ''

      // Get published posts from database
      let query = supabase
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
      
      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
      }

      const { data: posts, error, count } = await query
        .range((page - 1) * limit, page * limit - 1)
        .returns<any[]>()

      if (error) {
        return new Response(
          JSON.stringify({ message: 'Database error', error: error.message }),
          { 
            status: 500,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      const formattedPosts = (posts || []).map(formatPost)
      const total = count || 0
      const from = total > 0 ? (page - 1) * limit + 1 : null
      const to = total > 0 ? Math.min(page * limit, total) : null
      const lastPage = Math.ceil(total / limit)

      return new Response(
        JSON.stringify({
          data: formattedPosts,
          meta: {
            current_page: page,
            last_page: lastPage,
            per_page: limit,
            total: total,
            from: from,
            to: to
          },
          links: {
            first: page > 1 ? `/api/posts?page=1` : null,
            last: page < lastPage ? `/api/posts?page=${lastPage}` : null,
            prev: page > 1 ? `/api/posts?page=${page - 1}` : null,
            next: page < lastPage ? `/api/posts?page=${page + 1}` : null
          }
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Admin posts list (exclude individual posts)
    if (path.includes('/admin/posts') && !path.match(/\/admin\/posts\/\d+$/) && req.method === 'GET') {
      const authHeader = req.headers.get('authorization')
      if (!authHeader || !authHeader.includes('Bearer')) {
        return new Response(
          JSON.stringify({ message: 'Unauthorized' }),
          { 
            status: 401,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      const url = new URL(req.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)
      
      // Get all posts from database for admin
      const { data: posts, error, count } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (error) {
        return new Response(
          JSON.stringify({ message: 'Database error', error: error.message }),
          { 
            status: 500,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      const formattedPosts = (posts || []).map(formatPost)
      const total = count || 0
      const from = total > 0 ? (page - 1) * limit + 1 : null
      const to = total > 0 ? Math.min(page * limit, total) : null
      const lastPage = Math.ceil(total / limit)

      return new Response(
        JSON.stringify({
          data: formattedPosts,
          meta: {
            current_page: page,
            last_page: lastPage,
            per_page: limit,
            total: total,
            from: from,
            to: to
          },
          links: {
            first: page > 1 ? `/api/admin/posts?page=1` : null,
            last: page < lastPage ? `/api/admin/posts?page=${lastPage}` : null,
            prev: page > 1 ? `/api/admin/posts?page=${page - 1}` : null,
            next: page < lastPage ? `/api/admin/posts?page=${page + 1}` : null
          }
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Create new post
    if (path.includes('/admin/posts') && req.method === 'POST') {
      const authHeader = req.headers.get('authorization')
      if (!authHeader || !authHeader.includes('Bearer')) {
        return new Response(
          JSON.stringify({ message: 'Unauthorized' }),
          { 
            status: 401,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      const body = await req.json()
      const { title, content, excerpt, status, user_id } = body

      // Basic validation
      if (!title || !content) {
        return new Response(
          JSON.stringify({ 
            message: 'Title and content are required',
            errors: {
              title: !title ? ['Title is required'] : [],
              content: !content ? ['Content is required'] : []
            }
          }),
          { 
            status: 422,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      // Create new post in database
      const now = new Date().toISOString()
      const postData = {
        title,
        content,
        excerpt: excerpt || content.substring(0, 100) + '...',
        status: status || 'draft',
        published_at: status === 'published' ? now : null,
        user_id: user_id || 1,
        created_at: now,
        updated_at: now
      }

      const { data: newPost, error } = await supabase
        .from('posts')
        .insert([postData])
        .select('*')
        .maybeSingle()

      if (error) {
        return new Response(
          JSON.stringify({ message: 'Database error', error: error.message }),
          { 
            status: 500,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      const formattedPost = formatPost(newPost)

      return new Response(
        JSON.stringify({
          data: formattedPost,
          message: 'Post created successfully'
        }),
        { 
          status: 201,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Update existing post
    if (path.match(/\/admin\/posts\/\d+$/) && req.method === 'PUT') {
      const authHeader = req.headers.get('authorization')
      if (!authHeader || !authHeader.includes('Bearer')) {
        return new Response(
          JSON.stringify({ message: 'Unauthorized' }),
          { 
            status: 401,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      const postId = parseInt(path.split('/').pop() || '0')
      const body = await req.json()
      const { title, content, excerpt, status, user_id } = body

      // Basic validation
      if (!title || !content) {
        return new Response(
          JSON.stringify({ 
            message: 'Title and content are required',
            errors: {
              title: !title ? ['Title is required'] : [],
              content: !content ? ['Content is required'] : []
            }
          }),
          { 
            status: 422,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      // Get current post to preserve published_at if already published
      const { data: currentPost } = await supabase
        .from('posts')
        .select('published_at, status')
        .eq('id', postId)
        .single()

      const now = new Date().toISOString()
      let published_at = null
      
      if (status === 'published') {
        // If already published, keep the original published_at; if newly published, set current time
        published_at = currentPost?.published_at || now
      }

      const updateData = {
        title,
        content,
        excerpt: excerpt || content.substring(0, 100) + '...',
        status: status || 'draft',
        published_at,
        updated_at: now,
        ...(user_id ? { user_id } : {})
      }

      const { data: updatedPost, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId)
        .select('*')
        .maybeSingle()

      if (error) {
        return new Response(
          JSON.stringify({ message: 'Database error', error: error.message }),
          { 
            status: 500,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      if (!updatedPost) {
        return new Response(
          JSON.stringify({ message: 'Post not found' }),
          { 
            status: 404,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      const formattedPost = formatPost(updatedPost)

      return new Response(
        JSON.stringify({
          data: formattedPost,
          message: 'Post updated successfully'
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Delete post
    if (path.match(/\/admin\/posts\/\d+$/) && req.method === 'DELETE') {
      const authHeader = req.headers.get('authorization')
      if (!authHeader || !authHeader.includes('Bearer')) {
        return new Response(
          JSON.stringify({ message: 'Unauthorized' }),
          { 
            status: 401,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      const postId = parseInt(path.split('/').pop() || '0')

      // Delete post from database
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) {
        return new Response(
          JSON.stringify({ message: 'Database error', error: error.message }),
          { 
            status: 500,
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        )
      }

      return new Response(
        JSON.stringify({
          message: `Post ${postId} deleted successfully`
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    // Default response for unhandled routes
    return new Response(
      JSON.stringify({ 
        message: 'Endpoint not found',
        debug: {
          path,
          method: req.method,
          url: req.url,
          pathInfo: {
            includesAdminPosts: path.includes('/admin/posts'),
            matchesAdminSinglePost: !!path.match(/\/admin\/posts\/\d+$/),
            isGet: req.method === 'GET'
          }
        }
      }),
      { 
        status: 404,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        message: 'Internal server error',
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/laravel-api' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
