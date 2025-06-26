// Supabase Edge Function for R.W.S Blog API
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts"
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

// Dynamic CORS configuration for production security
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    'https://rws-41fcc1u8v-kentas-projects-9fa01438.vercel.app', // Current deployment
    'https://rws-4db9yf7fb-kentas-projects-9fa01438.vercel.app', // Previous deployment
    'https://rws-kdesigncreate.vercel.app', // Custom domain if configured
    'http://localhost:3000', // Development
    'http://localhost:3001', // Alternative dev port
  ]
  
  const isAllowedOrigin = origin && allowedOrigins.includes(origin)
  
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '3600',
  }
}

// JWT Configuration
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'RWS_BLOG_SECRET_KEY_2024'
const JWT_ALGORITHM = 'HS256'

// Admin Credentials (in production, store these in database with proper hashing)
const ADMIN_CREDENTIALS = {
  email: 'admin@rws-dribble.com',
  // Password: 'RWS2024!AdminPass'
  passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewU.dJgABhVl.nCq', // Pre-hashed
  id: 1,
  name: 'R.W.S管理者',
  role: 'admin'
}

// JWT Utility Functions
async function createJWT(payload: any): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const jwt = await create(
    { alg: JWT_ALGORITHM, typ: 'JWT' },
    {
      ...payload,
      exp: getNumericDate(60 * 60 * 24), // 24 hours
      iat: getNumericDate(new Date()),
      iss: 'rws-blog'
    },
    key
  )
  
  return jwt
}

async function verifyJWT(token: string): Promise<any> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    
    const payload = await verify(token, key)
    return payload
  } catch (error) {
    throw new Error('Invalid token')
  }
}

// Authentication Helper Functions
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    return false
  }
}

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log request for debugging
    console.log('Edge Function called:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });

    // Initialize Supabase client for public access (no auth required)
    const supabasePublic = createClient(
      'https://ixrwzaasrxoshjnpxnme.supabase.co', // Direct URL
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cnd6YWFzcnhvc2hqbnB4bm1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkyMjEwNDAsImV4cCI6MjAzNDc5NzA0MH0.vb_J30kJnB40CYZ9q3lPqDK9-9qFUYEOtmCK0xFDJ2Q' // Direct key
    )
    
    // Initialize Supabase client with auth for protected routes
    const authHeader = req.headers.get('Authorization')
    const supabaseAuth = authHeader ? createClient(
      'https://ixrwzaasrxoshjnpxnme.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cnd6YWFzcnhvc2hqbnB4bm1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkyMjEwNDAsImV4cCI6MjAzNDc5NzA0MH0.vb_J30kJnB40CYZ9q3lPqDK9-9qFUYEOtmCK0xFDJ2Q',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    ) : null

    const url = new URL(req.url)
    const path = url.pathname.replace('/functions/v1/laravel-api', '')
    const method = req.method

    // Route handling based on Laravel API structure
    switch (true) {
      // Health check (no authentication required)
      case path === '/api/health':
        console.log('Health check endpoint called');
        return new Response(
          JSON.stringify({ 
            status: 'ok', 
            message: 'R.W.S Blog API is running',
            timestamp: new Date().toISOString(),
            path: path,
            method: method,
            env: {
              hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
              hasSupabaseKey: !!Deno.env.get('SUPABASE_ANON_KEY')
            }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      // Posts routes (public)
      case path === '/api/posts' && method === 'GET':
        return await handleGetPosts(supabasePublic, url.searchParams)

      case path.startsWith('/api/posts/') && method === 'GET':
        const postId = path.split('/')[3]
        return await handleGetPost(supabasePublic, postId)

      // Auth routes
      case path === '/api/login' && method === 'POST':
        const loginData = await req.json()
        return await handleLogin(supabasePublic, loginData)

      case path === '/api/logout' && method === 'POST':
        return await handleLogout(supabaseAuth)

      case path === '/api/user' && method === 'GET':
        return await handleGetUser(supabaseAuth, authHeader)

      // Admin routes (protected)
      case path === '/api/admin/posts' && method === 'GET':
        if (!supabaseAuth) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 401 
            }
          )
        }
        return await handleGetAdminPosts(supabaseAuth, url.searchParams)

      case path === '/api/admin/posts' && method === 'POST':
        if (!supabaseAuth) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 401 
            }
          )
        }
        const createData = await req.json()
        return await handleCreatePost(supabaseAuth, createData)

      case path.startsWith('/api/admin/posts/') && method === 'PUT':
        if (!supabaseAuth) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 401 
            }
          )
        }
        const updatePostId = path.split('/')[4]
        const updateData = await req.json()
        return await handleUpdatePost(supabaseAuth, updatePostId, updateData)

      case path.startsWith('/api/admin/posts/') && method === 'DELETE':
        if (!supabaseAuth) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 401 
            }
          )
        }
        const deletePostId = path.split('/')[4]
        return await handleDeletePost(supabaseAuth, deletePostId)

      default:
        return new Response(
          JSON.stringify({ error: 'Route not found' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404 
          }
        )
    }
  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// Handler functions
async function handleGetPosts(supabase: any, searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const search = searchParams.get('search') || ''
  
  let query = supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
  }

  const { data, error } = await query
    .range((page - 1) * limit, page * limit - 1)

  if (error) throw error

  return new Response(
    JSON.stringify({ data, pagination: { page, limit } }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleGetPost(supabase: any, id: string) {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify({ data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleLogin(supabase: any, loginData: any) {
  const { email, password } = loginData
  
  try {
    // Validate input
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'メールアドレスとパスワードは必須です' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Check admin credentials
    if (email === ADMIN_CREDENTIALS.email) {
      const isValidPassword = await verifyPassword(password, ADMIN_CREDENTIALS.passwordHash)
      
      if (isValidPassword) {
        // Generate JWT token
        const token = await createJWT({
          sub: ADMIN_CREDENTIALS.id,
          email: ADMIN_CREDENTIALS.email,
          name: ADMIN_CREDENTIALS.name,
          role: ADMIN_CREDENTIALS.role
        })

        return new Response(
          JSON.stringify({
            user: {
              id: ADMIN_CREDENTIALS.id,
              name: ADMIN_CREDENTIALS.name,
              email: ADMIN_CREDENTIALS.email,
              role: ADMIN_CREDENTIALS.role
            },
            token: token,
            message: 'ログインに成功しました'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }
    }

    // If not admin or invalid credentials, check database (future implementation)
    // For now, return invalid credentials
    return new Response(
      JSON.stringify({ error: 'メールアドレスまたはパスワードが正しくありません' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401 
      }
    )
  } catch (error) {
    console.error('Login error:', error)
    return new Response(
      JSON.stringify({ error: '認証処理中にエラーが発生しました' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}

async function handleLogout(supabase: any) {
  return new Response(
    JSON.stringify({ message: 'Logged out successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleGetUser(supabase: any, authHeader: string | null) {
  try {
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '認証が必要です' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    const token = extractBearerToken(authHeader)
    if (!token) {
      return new Response(
        JSON.stringify({ error: '無効な認証ヘッダーです' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Verify JWT token
    const payload = await verifyJWT(token)
    
    return new Response(
      JSON.stringify({ 
        user: {
          id: payload.sub,
          name: payload.name,
          email: payload.email,
          role: payload.role
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: '認証トークンが無効です' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401 
      }
    )
  }
}

async function handleGetAdminPosts(supabase: any, searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const status = searchParams.get('status')
  const search = searchParams.get('search') || ''
  
  let query = supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
  }

  const { data, error } = await query
    .range((page - 1) * limit, page * limit - 1)

  if (error) throw error

  return new Response(
    JSON.stringify({ data, pagination: { page, limit } }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleCreatePost(supabase: any, postData: any) {
  const { title, content, status } = postData
  
  const newPost = {
    title,
    content,
    status: status || 'draft',
    is_published: status === 'published',
    is_draft: status === 'draft',
    published_at: status === 'published' ? new Date().toISOString() : null,
    user_id: 1, // Mock user ID
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('posts')
    .insert(newPost)
    .select()
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify({ data }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201 
    }
  )
}

async function handleUpdatePost(supabase: any, id: string, postData: any) {
  const { title, content, status } = postData
  
  const updateData = {
    title,
    content,
    status,
    is_published: status === 'published',
    is_draft: status === 'draft',
    published_at: status === 'published' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('posts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify({ data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleDeletePost(supabase: any, id: string) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)

  if (error) throw error

  return new Response(
    JSON.stringify({ message: 'Post deleted successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}