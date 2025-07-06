// Authentication Handlers
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

    // Simplified authentication for Edge Functions
    try {
      // For now, use hardcoded admin credentials since this is a single-user admin system
      if (email === 'admin@rws.com' && password === 'password123!!') {
        console.log('Login successful for admin user')
        
        // Generate a simple token (in production, use proper JWT)
        const token = `admin-token-${Date.now()}`
        
        return createSuccessResponse({
          user: { 
            id: 'admin-user-id', 
            email: 'admin@rws.com', 
            name: 'Kamura'
          },
          access_token: token
        })
      } else {
        console.log('Invalid credentials provided')
        return createErrorResponse(
          'Invalid credentials',
          401
        )
      }
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