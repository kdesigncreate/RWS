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
  parsePath,
  createCorsHeaders,
  validateAuthToken
} from './utils.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests with dynamic origin
  const requestOrigin = req.headers.get('origin') ?? undefined
  const dynamicCorsHeaders = requestOrigin ? createCorsHeaders(requestOrigin) : corsHeaders
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: dynamicCorsHeaders })
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
      return await handleLogin(req)
    }
    
    if (path.includes('/login') && req.method === 'GET') {
      return createErrorResponse(
        'Login endpoint requires POST method',
        405,
        undefined,
        createDebugInfo(req, path)
      )
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
