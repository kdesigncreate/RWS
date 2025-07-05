// Supabase Functions Utilities
import { createClient } from 'jsr:@supabase/supabase-js@2'
import type { 
  DatabaseUser, 
  CorsHeaders,
  ValidationResult,
  CreatePostRequest,
  UpdatePostRequest
} from './types.ts'

// CORS ヘッダー定義（動的Origin対応）
const allowedOrigins = Deno.env.get('ALLOWED_ORIGINS')?.split(',') || [
  'https://rws-ruddy.vercel.app',
  'https://rws-kentas-projects-9fa01438.vercel.app',
  'http://localhost:3000',
  'https://localhost:3000'
]

// 動的CORSヘッダー生成関数
export function createCorsHeaders(requestOrigin?: string): Record<string, string> {
  let origin = '*'
  
  if (requestOrigin && allowedOrigins.some(allowed => 
    allowed === requestOrigin || 
    (allowed.includes('vercel.app') && requestOrigin.includes('vercel.app'))
  )) {
    origin = requestOrigin
  }
  
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  }
}

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

// Supabase クライアント初期化
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

// エラーレスポンス生成ヘルパー
export function createErrorResponse(
  message: string, 
  status: number = 500, 
  errors?: Record<string, string[]>,
  debug?: Record<string, unknown>
): Response {
  return new Response(
    JSON.stringify({ 
      message,
      ...(errors && { errors }),
      ...(debug && { debug }),
      timestamp: new Date().toISOString()
    }),
    { 
      status,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      } 
    }
  )
}

// 成功レスポンス生成ヘルパー
export function createSuccessResponse<T>(
  data?: T, 
  message?: string, 
  status: number = 200
): Response {
  return new Response(
    JSON.stringify({ 
      ...(data && { data }),
      ...(message && { message }),
      timestamp: new Date().toISOString()
    }),
    { 
      status,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      } 
    }
  )
}

// ユーザー情報取得ヘルパー
export async function getUserInfo(userId: number): Promise<DatabaseUser> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .maybeSingle()
    
    if (error || !user) {
      console.warn(`User not found for ID ${userId}:`, error?.message)
      return {
        id: userId,
        name: 'Unknown User',
        email: 'unknown@example.com'
      }
    }
    
    return user
  } catch (error) {
    console.error('Error fetching user info:', error)
    return {
      id: userId,
      name: 'Unknown User',
      email: 'unknown@example.com'
    }
  }
}

// バリデーション関数
export function validatePostData(data: CreatePostRequest | UpdatePostRequest): ValidationResult {
  const errors: Record<string, string[]> = {}
  
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.title = ['Title is required']
  } else if (data.title.length > 255) {
    errors.title = ['Title must be less than 255 characters']
  }
  
  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.content = ['Content is required']
  }
  
  if (data.status && !['published', 'draft'].includes(data.status)) {
    errors.status = ['Status must be either "published" or "draft"']
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// 認証ヘルパー
export async function validateAuthToken(authHeader: string | null) {
  if (!authHeader || !authHeader.includes('Bearer')) {
    return { isValid: false, user: null, error: 'Unauthorized' }
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !userData.user) {
      return { isValid: false, user: null, error: 'Invalid token' }
    }

    return { isValid: true, user: userData.user, error: null }
  } catch (error) {
    console.error('Token validation error:', error)
    return { isValid: false, user: null, error: 'Token validation failed' }
  }
}

// パス解析ヘルパー
export function parsePath(url: URL): { 
  cleanPath: string; 
  segments: string[]; 
  postId?: number 
} {
  let path = url.pathname
  
  // Remove /api prefix if present (from Vercel proxy)
  if (path.startsWith('/api')) {
    path = path.substring(4)
  }
  
  const segments = path.split('/').filter(Boolean)
  
  // Extract post ID if present
  let postId: number | undefined
  const lastSegment = segments[segments.length - 1]
  if (lastSegment && /^\d+$/.test(lastSegment)) {
    postId = parseInt(lastSegment)
  }
  
  return { cleanPath: path, segments, postId }
}

// デバッグ情報生成
export function createDebugInfo(request: Request, path: string) {
  return {
    path,
    method: request.method,
    url: request.url,
    pathInfo: {
      includesAdminPosts: path.includes('/admin/posts'),
      matchesAdminSinglePost: !!path.match(/\/admin\/posts\/\d+$/),
      isGet: request.method === 'GET'
    }
  }
}