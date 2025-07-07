// Authentication Handlers using Supabase Auth
import type { LoginRequest } from './types.ts'
import { supabase, createErrorResponse, createSuccessResponse, validateAuthToken } from './utils.ts'

// ログインハンドラー
export async function handleLogin(request: Request): Promise<Response> {
  try {
    console.log('Login handler called')
    console.log('Request method:', request.method)
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    
    let bodyText: string
    try {
      bodyText = await request.text()
      console.log('Request body text:', bodyText)
    } catch (textError) {
      console.error('Failed to read request body:', textError)
      return createErrorResponse('Failed to read request body', 400)
    }
    
    let body: LoginRequest
    try {
      body = JSON.parse(bodyText)
      console.log('Parsed body:', body)
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      console.error('Body text was:', bodyText)
      return createErrorResponse('Invalid JSON in request body', 400)
    }
    
    const { email, password } = body

    console.log('Login attempt:', { email, password: password ? '***' : 'missing' })

    // Basic validation
    if (!email || !password) {
      console.log('Login validation failed:', { email: !!email, password: !!password })
      return createErrorResponse(
        'Email and password are required',
        400
      )
    }

    // Temporary fallback authentication for admin user
    if (email === 'admin@rws.com' && password === 'password123!!') {
      console.log('Using fallback authentication for admin user')
      
      // Generate a temporary token (in production, use proper JWT)
      const tempToken = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      return createSuccessResponse({
        user: { 
          id: '1', 
          email: 'admin@rws.com', 
          name: 'Kamura'
        },
        access_token: tempToken,
        refresh_token: tempToken
      })
    }

    // Use Supabase Auth for authentication
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.log('Supabase Auth error:', error.message)
        return createErrorResponse(
          'ログインに失敗しました',
          401
        )
      }

      if (!data.user || !data.session) {
        console.log('No user or session returned from Supabase Auth')
        return createErrorResponse(
          'Authentication failed',
          401
        )
      }

      console.log('Login successful for user:', data.user.email)
      
      return createSuccessResponse({
        user: { 
          id: data.user.id, 
          email: data.user.email!, 
          name: data.user.user_metadata?.name || 'Admin User'
        },
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
      })
    } catch (authException) {
      console.error('Authentication exception:', authException)
      return createErrorResponse(
        'Authentication system error',
        500
      )
    }
  } catch (error) {
    console.error('Login endpoint error:', error)
    return createErrorResponse(
      'Login processing error',
      500
    )
  }
}

// ログアウトハンドラー
export async function handleLogout(request: Request): Promise<Response> {
  try {
    const authValidation = await validateAuthToken(request.headers.get('authorization'))
    if (!authValidation.isValid) {
      return createErrorResponse('Unauthorized', 401)
    }

    const token = request.headers.get('authorization')?.replace('Bearer ', '') || ''
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Logout error:', error)
      return createErrorResponse('Logout failed', 500)
    }

    return createSuccessResponse({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout handler error:', error)
    return createErrorResponse('Logout processing error', 500)
  }
}

// ユーザー情報取得ハンドラー
export async function handleUserInfo(request: Request): Promise<Response> {
  const authValidation = await validateAuthToken(request.headers.get('authorization'))
  if (!authValidation.isValid) {
    return createErrorResponse(authValidation.error || 'Unauthorized', 401)
  }

  return createSuccessResponse({
    user: authValidation.user
  })
}