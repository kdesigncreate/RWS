// Supabase Edge Function for Scheduled Post Publishing
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

interface DatabasePost {
  id: number
  title: string
  status: string
  published_at: string
  created_at: string
  updated_at: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Starting scheduled post publisher...')

    // Get current time
    const now = new Date()
    const nowISO = now.toISOString()

    console.log(`Current time: ${nowISO}`)

    // Find all scheduled posts that should be published now
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from('posts')
      .select('id, title, status, published_at, created_at, updated_at')
      .eq('status', 'scheduled')
      .lte('published_at', nowISO)
      .order('published_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching scheduled posts:', fetchError)
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch scheduled posts',
          details: fetchError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      console.log('No scheduled posts found to publish')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No scheduled posts to publish',
          processed: 0,
          publishedPosts: []
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Found ${scheduledPosts.length} scheduled posts to publish`)

    const publishedPosts: Array<{ id: number; title: string; publishedAt: string }> = []
    const errors: Array<{ id: number; title: string; error: string }> = []

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
      success: true,
      message: `Processed ${scheduledPosts.length} scheduled posts`,
      processed: scheduledPosts.length,
      published: publishedPosts.length,
      failed: errors.length,
      publishedPosts,
      errors: errors.length > 0 ? errors : undefined
    }

    console.log('Scheduled post publisher completed:', response)

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error in scheduled publisher:', error)
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})