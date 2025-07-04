// Supabase Edge Functions Main Handler
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Import handlers and utilities
import { handleLogin, handleUserInfo } from './auth-handlers.ts'
import { 
  handlePublicPosts, 
  handlePublicPost, 
  handleAdminPosts, 
  handleAdminPost,
  handleCreatePost,
  handleUpdatePost,
  handleDeletePost
} from './post-handlers.ts'
import { 
  corsHeaders, 
  supabase, 
  createErrorResponse, 
  createSuccessResponse,
  createDebugInfo,
  parsePath
} from './utils.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    // Authentication endpoints
    if (path.includes('/login') && req.method === 'POST') {
      return await handleLogin(req)
    }
    
    if (path.includes('/user') && req.method === 'GET') {
      return await handleUserInfo(req)
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
      return await handlePublicPosts(url)
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
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
