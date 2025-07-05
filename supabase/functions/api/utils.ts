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
  debug?: Record<string, unknown>,
  requestOrigin?: string
): Response {
  const headers = requestOrigin ? createCorsHeaders(requestOrigin) : corsHeaders
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
        ...headers,
        'Content-Type': 'application/json' 
      } 
    }
  )
}

// 成功レスポンス生成ヘルパー
export function createSuccessResponse<T>(
  data?: T, 
  message?: string, 
  status: number = 200,
  requestOrigin?: string
): Response {
  const headers = requestOrigin ? createCorsHeaders(requestOrigin) : corsHeaders
  return new Response(
    JSON.stringify({ 
      ...(data && { data }),
      ...(message && { message }),
      timestamp: new Date().toISOString()
    }),
    { 
      status,
      headers: { 
        ...headers,
        'Content-Type': 'application/json' 
      } 
    }
  )
}

// ユーザー情報取得ヘルパー（Supabase Auth直接利用）
export async function getUserInfo(userId: number | string): Promise<DatabaseUser> {
  // users テーブルを使わず、固定のユーザー情報を返す
  // 実際のプロジェクトではSupabase Authのユーザー情報を使用
  return {
    id: typeof userId === 'number' ? userId : parseInt(userId) || 1,
    name: 'Admin User',
    email: 'admin@example.com'
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