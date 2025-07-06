// Supabase Edge Functions Main Handler
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Import modular components
import { createCorsMiddleware, handlePreflightRequest } from './middleware/cors.ts'
import { createAuthMiddleware } from './middleware/auth.ts'
import { createRateLimitMiddleware } from './middleware/rateLimit.ts'
import { AuthRoutes } from './routes/auth.ts'
import { PostRoutes } from './routes/posts.ts'
import { AdminRoutes } from './routes/admin.ts'
import { 
  corsHeaders, 
  supabase, 
  createErrorResponse, 
  createSuccessResponse,
  createDebugInfo,
  parsePath,
  createCorsHeaders,
  validateAuthToken
} from './utils.ts'

// Initialize middleware and routes
const corsMiddleware = createCorsMiddleware({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
})

const authMiddleware = createAuthMiddleware(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

const rateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // 100 requests per window
})

// Initialize route handlers
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const authRoutes = new AuthRoutes(supabaseUrl, supabaseServiceKey)
const postRoutes = new PostRoutes(supabaseUrl, supabaseServiceKey)
const adminRoutes = new AdminRoutes(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req) => {
  // CORS処理
  const corsHeaders = corsMiddleware(req)
  
  if (req.method === 'OPTIONS') {
    return handlePreflightRequest(corsHeaders)
  }

  // Rate limiting
  const rateLimitResult = rateLimitMiddleware(req)
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({ message: rateLimitResult.error }),
      { 
        status: 429,
        headers: { 
          ...Object.fromEntries(corsHeaders.entries()),
          ...Object.fromEntries(rateLimitResult.headers.entries()),
          'Content-Type': 'application/json'
        }
      }
    )
  }

  try {
    const url = new URL(req.url)
    const { cleanPath: path, postId } = parsePath(url)
    
    // Health check endpoint  
    if (path.includes('/health')) {
      return createSuccessResponse({
        status: 'ok', 
        message: 'Supabase Functions API is running',
        timestamp: new Date().toISOString()
      })
    }

    // Debug posts endpoint
    if (path.includes('/debug-posts')) {
      try {
        const { data: posts, error } = await supabase
          .from('posts')
          .select('*')
          .order('id', { ascending: true })

        if (error) {
          return createErrorResponse('Database error', 500)
        }

        return createSuccessResponse({ 
          posts: posts || [],
          count: posts?.length || 0
        })
      } catch (error) {
        return createErrorResponse('Debug endpoint error', 500)
      }
    }

    // Fix database status fields endpoint (admin only)
    if (path.includes('/fix-status-fields') && req.method === 'POST') {
      const authValidation = await validateAuthToken(req.headers.get('authorization'))
      if (!authValidation.isValid) {
        return createErrorResponse('Unauthorized', 401, undefined, undefined, requestOrigin)
      }

      try {
        // Update all posts to have correct is_published and is_draft based on status
        const { data: updatePublished, error: errorPublished } = await supabase
          .from('posts')
          .update({ 
            is_published: true, 
            is_draft: false 
          })
          .eq('status', 'published')
          .select('id')

        const { data: updateDraft, error: errorDraft } = await supabase
          .from('posts')
          .update({ 
            is_published: false, 
            is_draft: true 
          })
          .eq('status', 'draft')
          .select('id')

        if (errorPublished || errorDraft) {
          return createErrorResponse('Database update error', 500, undefined, undefined, requestOrigin)
        }

        return createSuccessResponse({
          message: 'Status fields fixed successfully',
          publishedUpdated: updatePublished?.length || 0,
          draftUpdated: updateDraft?.length || 0
        }, undefined, 200, requestOrigin)
      } catch (error) {
        console.error('Fix status fields error:', error)
        return createErrorResponse('Internal server error', 500, undefined, undefined, requestOrigin)
      }
    }

    // Authentication endpoints
    if (path.includes('/login') && req.method === 'POST') {
      const response = await authRoutes.login(req)
      const responseHeaders = new Headers(response.headers)
      corsHeaders.forEach((value, key) => responseHeaders.set(key, value))
      rateLimitResult.headers.forEach((value, key) => responseHeaders.set(key, value))
      return new Response(response.body, { 
        status: response.status, 
        headers: responseHeaders 
      })
    }
    
    if (path.includes('/logout') && req.method === 'POST') {
      const authContext = await authMiddleware(req, false)
      const response = await authRoutes.logout(req, authContext)
      const responseHeaders = new Headers(response.headers)
      corsHeaders.forEach((value, key) => responseHeaders.set(key, value))
      return new Response(response.body, { 
        status: response.status, 
        headers: responseHeaders 
      })
    }
    
    if (path.includes('/user') && req.method === 'GET') {
      const authContext = await authMiddleware(req, true)
      const response = await authRoutes.getUser(req, authContext)
      const responseHeaders = new Headers(response.headers)
      corsHeaders.forEach((value, key) => responseHeaders.set(key, value))
      return new Response(response.body, { 
        status: response.status, 
        headers: responseHeaders 
      })
    }

    // Post endpoints - Admin (require authentication)
    if (path.match(/\/admin\/posts\/\d+$/) && req.method === 'GET' && postId) {
      return await handleAdminPost(req, postId)
    }

    if (path.includes('/admin/posts') && !path.match(/\/admin\/posts\/\d+$/) && req.method === 'GET') {
      return await handleAdminPosts(req, url)
    }

    if (path.includes('/admin/posts') && req.method === 'POST') {
      return await handleCreatePost(req)
    }

    if (path.match(/\/admin\/posts\/\d+$/) && req.method === 'PUT' && postId) {
      return await handleUpdatePost(req, postId)
    }

    if (path.match(/\/admin\/posts\/\d+$/) && req.method === 'DELETE' && postId) {
      return await handleDeletePost(req, postId)
    }

    // Post endpoints - Public (no authentication required)
    if (path.match(/\/posts\/\d+$/) && req.method === 'GET' && postId) {
      return await handlePublicPost(postId)
    }

    if (path.includes('/posts') && req.method === 'GET' && !path.includes('/admin') && !path.match(/\/posts\/\d+$/)) {
      return await handlePublicPosts(url, requestOrigin)
    }

    // Default response for unhandled routes
    return createErrorResponse(
      'Endpoint not found',
      404,
      undefined,
      createDebugInfo(req, path)
    )

  } catch (error) {
    console.error('Unhandled error:', error)
    return createErrorResponse(
      'Internal server error',
      500
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/api' \
    --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
