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

// Import handlers from post-handlers.ts
import {
  handleAdminPost,
  handleAdminPosts,
  handleCreatePost,
  handleUpdatePost,
  handleDeletePost,
  handlePublicPost,
  handlePublicPosts
} from './post-handlers.ts'

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
    const requestOrigin = req.headers.get('origin') || '*'
    
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
        return createErrorResponse('Unauthorized', 401)
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
          return createErrorResponse('Database update error', 500)
        }

        return createSuccessResponse({
          message: 'Status fields fixed successfully',
          publishedUpdated: updatePublished?.length || 0,
          draftUpdated: updateDraft?.length || 0
        }, undefined, 200)
      } catch (error) {
        console.error('Fix status fields error:', error)
        return createErrorResponse('Internal server error', 500)
      }
    }

    // Manual scheduled post publisher endpoint (admin only)
    if (path.includes('/publish-scheduled') && req.method === 'POST') {
      const authValidation = await validateAuthToken(req.headers.get('authorization'))
      if (!authValidation.isValid) {
        return createErrorResponse('Unauthorized', 401)
      }

      try {
        console.log('Manual publish scheduled posts triggered')
        
        // Get current time
        const now = new Date()
        const nowISO = now.toISOString()
        console.log(`Current time: ${nowISO}`)

        // Find all scheduled posts that should be published now
        const { data: scheduledPosts, error: fetchError } = await supabase
          .from('posts')
          .select('id, title, status, published_at')
          .eq('status', 'scheduled')
          .lte('published_at', nowISO)
          .order('published_at', { ascending: true })

        if (fetchError) {
          console.error('Error fetching scheduled posts:', fetchError)
          return createErrorResponse('Failed to fetch scheduled posts', 500)
        }

        if (!scheduledPosts || scheduledPosts.length === 0) {
          return createSuccessResponse({
            message: 'No scheduled posts to publish',
            processed: 0,
            published: 0,
            publishedPosts: []
          })
        }

        console.log(`Found ${scheduledPosts.length} scheduled posts to publish`)

        const publishedPosts = []
        const errors = []

        // Process each scheduled post
        for (const post of scheduledPosts) {
          try {
            console.log(`Publishing post ${post.id}: "${post.title}"`)

            // Update the post status to 'published'
            const { error: updateError } = await supabase
              .from('posts')
              .update({
                status: 'published',
                updated_at: nowISO
              })
              .eq('id', post.id)
              .eq('status', 'scheduled') // Double-check to prevent race conditions

            if (updateError) {
              console.error(`Error publishing post ${post.id}:`, updateError)
              errors.push({
                id: post.id,
                title: post.title,
                error: updateError.message
              })
              continue
            }

            publishedPosts.push({
              id: post.id,
              title: post.title,
              publishedAt: post.published_at
            })

            console.log(`Successfully published post ${post.id}: "${post.title}"`)

          } catch (error) {
            console.error(`Error processing post ${post.id}:`, error)
            errors.push({
              id: post.id,
              title: post.title,
              error: error instanceof Error ? error.message : 'Unknown error'
            })
          }
        }

        // Return results
        const response = {
          message: `Processed ${scheduledPosts.length} scheduled posts`,
          processed: scheduledPosts.length,
          published: publishedPosts.length,
          failed: errors.length,
          publishedPosts,
          errors: errors.length > 0 ? errors : undefined
        }

        console.log('Manual publish scheduled posts completed:', response)
        return createSuccessResponse(response)

      } catch (error) {
        console.error('Manual publish scheduled posts error:', error)
        return createErrorResponse('Internal server error', 500)
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
    --header 'Authorization: Bearer YOUR_JWT_TOKEN_HERE' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
