// Simple public test function without auth
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '3600',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('Public Edge Function called:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  const url = new URL(req.url)
  const path = url.pathname.replace('/functions/v1/laravel-api-public', '')

  // Health check
  if (path === '/api/health') {
    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        message: 'R.W.S Blog API (Public) is running',
        timestamp: new Date().toISOString(),
        path: path,
        method: req.method,
        note: 'This is a public test endpoint without authentication'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  }

  // Default response
  return new Response(
    JSON.stringify({ 
      error: 'Route not found',
      available_routes: ['/api/health']
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404 
    }
  )
})