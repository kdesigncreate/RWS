// Supabase Edge Function for R.W.S Blog API
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const url = new URL(req.url)
    const path = url.pathname.replace('/functions/v1/laravel-api', '')
    const method = req.method

    // Route handling based on Laravel API structure
    switch (true) {
      // Health check
      case path === '/api/health':
        return new Response(
          JSON.stringify({ 
            status: 'ok', 
            message: 'R.W.S Blog API is running',
            timestamp: new Date().toISOString()
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )

      // Posts routes
      case path === '/api/posts' && method === 'GET':
        return await handleGetPosts(supabaseClient, url.searchParams)

      case path.startsWith('/api/posts/') && method === 'GET':
        const postId = path.split('/')[3]
        return await handleGetPost(supabaseClient, postId)

      // Auth routes
      case path === '/api/login' && method === 'POST':
        const loginData = await req.json()
        return await handleLogin(supabaseClient, loginData)

      case path === '/api/logout' && method === 'POST':
        return await handleLogout(supabaseClient)

      case path === '/api/user' && method === 'GET':
        return await handleGetUser(supabaseClient)

      // Admin routes (protected)
      case path === '/api/admin/posts' && method === 'GET':
        return await handleGetAdminPosts(supabaseClient, url.searchParams)

      case path === '/api/admin/posts' && method === 'POST':
        const createData = await req.json()
        return await handleCreatePost(supabaseClient, createData)

      case path.startsWith('/api/admin/posts/') && method === 'PUT':
        const updatePostId = path.split('/')[4]
        const updateData = await req.json()
        return await handleUpdatePost(supabaseClient, updatePostId, updateData)

      case path.startsWith('/api/admin/posts/') && method === 'DELETE':
        const deletePostId = path.split('/')[4]
        return await handleDeletePost(supabaseClient, deletePostId)

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
    return new Response(
      JSON.stringify({ error: error.message }),
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
  
  // Simple password verification (in production, use proper hashing)
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid credentials' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401 
      }
    )
  }

  // In production, verify password hash properly
  if (email === 'admin@example.com' && password === 'password123') {
    return new Response(
      JSON.stringify({ 
        user: { id: user.id, name: user.name, email: user.email },
        token: 'mock-token' // In production, generate real JWT
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Invalid credentials' }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401 
    }
  )
}

async function handleLogout(supabase: any) {
  return new Response(
    JSON.stringify({ message: 'Logged out successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleGetUser(supabase: any) {
  // Mock user response - in production, verify JWT token
  return new Response(
    JSON.stringify({ 
      user: { id: 1, name: 'Administrator', email: 'admin@example.com' }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
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