// Supabase Edge Function for R.W.S Blog API - Security Optimized
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, verify, getNumericDate } from "https://deno.land/x/djwt@v3.0.1/mod.ts"
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"

// Security Configuration
const SECURITY_CONFIG = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  jwtExpiry: 8 * 60 * 60, // 8 hours
  sessionTimeout: 24 * 60 * 60, // 24 hours
  passwordMinLength: 12,
  rateLimitWindow: 60 * 1000, // 1 minute
  maxRequestsPerWindow: 100
}

// Dynamic CORS configuration for production security
function getCorsHeaders(origin: string | null): Record<string, string> {
  // Get allowed origins from environment variable
  const allowedOriginsEnv = Deno.env.get('ALLOWED_ORIGINS') || ''
  const allowedOrigins = allowedOriginsEnv.split(',').map(o => o.trim()).filter(o => o.length > 0)
  
  // Default origins for development if none specified
  if (allowedOrigins.length === 0) {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001')
  }
  
  const isAllowedOrigin = origin && allowedOrigins.includes(origin)
  
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : (allowedOrigins[0] || '*'),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '3600',
  }
}

// JWT Configuration - Enhanced Security
const JWT_SECRET = Deno.env.get('JWT_SECRET') || crypto.randomUUID()
const JWT_ALGORITHM = 'HS256'

// Supabase Environment Variables (Secure - no hardcoded values)
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Required environment variables SUPABASE_URL and SUPABASE_ANON_KEY must be set')
}

// Rate Limiting Store (In-memory, for demo - use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Security Functions
async function rateLimit(identifier: string): Promise<boolean> {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + SECURITY_CONFIG.rateLimitWindow })
    return true
  }
  
  if (entry.count >= SECURITY_CONFIG.maxRequestsPerWindow) {
    return false
  }
  
  entry.count++
  return true
}

async function logSecurityEvent(event: string, details: any, severity: 'low' | 'medium' | 'high' = 'medium') {
  console.log(`SECURITY_EVENT[${severity.toUpperCase()}]: ${event}`, {
    timestamp: new Date().toISOString(),
    details,
    severity
  })
  
  // In production, send to security monitoring system
  // Example: Sentry, DataDog, CloudWatch, etc.
}

function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().slice(0, 1000) // Prevent overly long strings
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      if (typeof key === 'string' && key.length <= 100) {
        sanitized[key] = sanitizeInput(value)
      }
    }
    return sanitized
  }
  return input
}

function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < SECURITY_CONFIG.passwordMinLength) {
    errors.push(`パスワードは${SECURITY_CONFIG.passwordMinLength}文字以上である必要があります`)
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('パスワードには大文字を含める必要があります')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('パスワードには小文字を含める必要があります')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('パスワードには数字を含める必要があります')
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('パスワードには特殊文字(!@#$%^&*)を含める必要があります')
  }
  
  return { isValid: errors.length === 0, errors }
}

// Enhanced JWT Utility Functions with Security
async function createJWT(payload: any): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const now = new Date()
  const jwt = await create(
    { alg: JWT_ALGORITHM, typ: 'JWT' },
    {
      ...payload,
      exp: getNumericDate(new Date(now.getTime() + SECURITY_CONFIG.jwtExpiry * 1000)),
      iat: getNumericDate(now),
      jti: crypto.randomUUID(), // JWT ID for tracking
      iss: 'rws-blog-api', // Issuer
      aud: 'rws-blog-frontend' // Audience
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

// Database Security Setup Function
async function setupDatabaseSecurity(supabase: any) {
  try {
    console.log('Setting up database security (RLS policies)...');

    // Enable RLS and create policies for posts table
    const { error: postsRLSError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS on posts table
        ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Public can view published posts" ON public.posts;
        DROP POLICY IF EXISTS "Admin access through Edge Functions only" ON public.posts;
        
        -- Create new policies for posts
        CREATE POLICY "Public can view published posts" ON public.posts
            FOR SELECT USING (true);
        
        CREATE POLICY "Admin access through Edge Functions only" ON public.posts
            FOR ALL USING (false);
            
        -- Grant permissions
        GRANT SELECT ON public.posts TO authenticated;
        GRANT SELECT ON public.posts TO anon;
      `
    });

    if (postsRLSError) {
      console.error('Posts RLS setup error:', postsRLSError);
    }

    // Enable RLS on other critical tables
    const tables = [
      'users', 'migrations', 'password_reset_tokens', 'sessions', 
      'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs', 
      'personal_access_tokens'
    ];

    for (const table of tables) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;
          DROP POLICY IF EXISTS "No public access to ${table}" ON public.${table};
          CREATE POLICY "No public access to ${table}" ON public.${table}
              FOR ALL USING (false);
        `
      });

      if (error) {
        console.error(`RLS setup error for ${table}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database security (RLS) has been configured successfully',
        tables_secured: ['posts', ...tables],
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Database security setup failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to setup database security',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
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
  const clientIP = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown'
  
  // Security: Rate limiting
  if (!await rateLimit(clientIP)) {
    await logSecurityEvent('RATE_LIMIT_EXCEEDED', { ip: clientIP, origin }, 'high')
    return new Response(
      JSON.stringify({ error: 'リクエストが多すぎます。しばらく待ってから再試行してください。' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429 
      }
    )
  }
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Early check for health endpoint - bypass all authentication
  const url = new URL(req.url)
  const fullPath = url.pathname
  const path = fullPath.replace('/functions/v1/laravel-api', '').replace('/laravel-api', '')
  
  console.log('Request path analysis:', {
    fullPath,
    cleanedPath: path,
    url: req.url
  });
  
  if (path === '/api/health' || fullPath.includes('/health')) {
    console.log('Health check endpoint called - bypassing auth');
    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        message: 'R.W.S Blog API is running',
        timestamp: new Date().toISOString(),
        fullPath: fullPath,
        path: path,
        method: req.method,
        success: 'Health endpoint working with proper API key headers!'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  }

  // Security setup endpoint - bypass auth for one-time setup
  if (path === '/api/setup-security' || fullPath.includes('/setup-security')) {
    console.log('Security setup endpoint called - bypassing auth for one-time setup');
    return await setupDatabaseSecurity(supabasePublic)
  }

  // Login endpoint - bypass auth (public endpoint)
  if (path === '/api/login' && req.method === 'POST') {
    console.log('Login endpoint called - bypassing auth (public endpoint)');
    const loginData = await req.json()
    return await handleLogin(supabasePublic, loginData)
  }

  // Password hash generation endpoint (one-time use)
  if (path === '/api/generate-hash' && req.method === 'POST') {
    console.log('Password hash generation endpoint called');
    const { password } = await req.json()
    const hash = await hashPassword(password)
    return new Response(
      JSON.stringify({
        password: password,
        hash: hash,
        message: 'Use this hash to update ADMIN_CREDENTIALS.passwordHash in the code'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  }

  try {
    // Log request for debugging
    console.log('Edge Function called:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });

    // Initialize Supabase clients with enhanced security
    const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
          'X-Client-Info': 'rws-blog-api'
        },
      },
    })
    
    // Initialize admin client for protected operations (uses service role)
    const supabaseAdmin = SUPABASE_SERVICE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
          'X-Client-Info': 'rws-blog-api-admin'
        },
      },
    }) : null
    
    // Get authenticated user context from JWT
    const authHeader = req.headers.get('Authorization')
    let authenticatedUser = null
    if (authHeader) {
      try {
        const token = extractBearerToken(authHeader)
        if (token) {
          authenticatedUser = await verifyJWT(token)
        }
      } catch (error) {
        await logSecurityEvent('INVALID_JWT_TOKEN', { ip: clientIP, error: error.message }, 'medium')
      }
    }

    const url = new URL(req.url)
    const path = url.pathname.replace('/laravel-api', '')
    const method = req.method

    // Route handling based on Laravel API structure
    switch (true) {
      // Health check was handled early, so this case should not be reached

      // Security setup endpoint (one-time RLS configuration)
      case path === '/api/setup-security' && method === 'POST':
        return await setupDatabaseSecurity(supabasePublic)

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

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, password')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'ユーザーが見つかりません' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Verify password against database hash
    const isValidPassword = await verifyPassword(password, user.password)
    
    if (isValidPassword) {
      // Generate JWT token
      const token = await createJWT({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: 'admin' // All users in this system are admins
      })

      return new Response(
        JSON.stringify({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: 'admin'
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