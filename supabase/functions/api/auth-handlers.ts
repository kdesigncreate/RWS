// Authentication Handlers
import type { LoginRequest } from './types.ts'
import { supabase, createErrorResponse, createSuccessResponse } from './utils.ts'

// ログインハンドラー
export async function handleLogin(request: Request): Promise<Response> {
  try {
    const body: LoginRequest = await request.json()
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

    // Use Supabase Auth for authentication
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError || !authData.user) {
        console.log('Supabase auth failed:', authError?.message)
        return createErrorResponse(
          'Invalid credentials',
          401
        )
      }

      console.log('Login successful for:', email)
      
      // Get user information from users table, create if not exists
      let { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('email', email)
        .maybeSingle()
      
      if (userError) {
        console.error('Database error while looking up user:', userError)
        return createErrorResponse('Database error', 500)
      }
      
      if (!userData) {
        console.log('User not found in users table, creating for:', email)
        // Create new user in users table
        const { data: newUser, error: createUserError } = await supabase
          .from('users')
          .insert({
            email: email,
            name: authData.user.user_metadata?.name || email.split('@')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id, name, email')
          .single()
        
        if (createUserError || !newUser) {
          console.error('Failed to create user:', createUserError)
          // Return auth user data as fallback
          return createSuccessResponse({
            message: 'Login successful',
            user: { 
              id: authData.user.id, 
              email: authData.user.email, 
              name: authData.user.user_metadata?.name || 'Admin User' 
            },
            token: authData.session?.access_token || 'no-token'
          })
        }
        
        userData = newUser
        console.log('Created new user with ID:', userData.id)
      }
      
      // Return user data from users table and session token
      return createSuccessResponse({
        message: 'Login successful',
        user: userData,
        token: authData.session?.access_token || 'no-token'
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

// ユーザー情報取得ハンドラー
export async function handleUserInfo(request: Request): Promise<Response> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.includes('Bearer')) {
    return createErrorResponse('Unauthorized', 401)
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    
    // Get user from Supabase using the token
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !userData.user) {
      console.log('Token validation failed:', userError?.message)
      return createErrorResponse('Invalid token', 401)
    }

    return createSuccessResponse({
      data: { 
        id: userData.user.id, 
        email: userData.user.email, 
        name: userData.user.user_metadata?.name || 'Admin User' 
      }
    })
  } catch (error) {
    console.error('User endpoint error:', error)
    return createErrorResponse(
      'User authentication error',
      500
    )
  }
}