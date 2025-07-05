// Post Management Handlers
import type { 
  DatabasePost, 
  FormattedPost, 
  CreatePostRequest, 
  UpdatePostRequest,
  PaginatedResponse
} from './types.ts'
import { 
  supabase, 
  getUserInfo, 
  createErrorResponse, 
  createSuccessResponse,
  validatePostData,
  validateAuthToken
} from './utils.ts'

// ポストフォーマット関数
export async function formatPost(post: DatabasePost): Promise<FormattedPost> {
  const now = new Date()
  const createdAt = new Date(post.created_at)
  const updatedAt = new Date(post.updated_at)
  
  // Get author information from users table
  const author = await getUserInfo(post.user_id || 1)
  
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt || post.content.substring(0, 100) + '...',
    status: post.status,
    status_label: post.status === 'published' ? '公開済み' : '下書き',
    published_at: post.published_at,
    published_at_formatted: post.published_at ? new Date(post.published_at).toLocaleDateString('ja-JP') : null,
    is_published: post.status === 'published',
    is_draft: post.status === 'draft',
    created_at: post.created_at,
    updated_at: post.updated_at,
    created_at_formatted: createdAt.toLocaleDateString('ja-JP'),
    updated_at_formatted: updatedAt.toLocaleDateString('ja-JP'),
    user_id: post.user_id || 1,
    author: author,
    meta: {
      title_length: post.title?.length || 0,
      content_length: post.content?.length || 0,
      excerpt_length: (post.excerpt || post.content.substring(0, 100))?.length || 0,
      reading_time_minutes: Math.max(1, Math.ceil((post.content?.split(' ').length || 0) / 200))
    }
  }
}

// 複数ポストフォーマット関数
export async function formatPosts(posts: DatabasePost[]): Promise<FormattedPost[]> {
  const formattedPosts = []
  for (const post of posts) {
    const formattedPost = await formatPost(post)
    formattedPosts.push(formattedPost)
  }
  return formattedPosts
}

// 公開ポスト一覧取得
export async function handlePublicPosts(url: URL): Promise<Response> {
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)
  const search = url.searchParams.get('search') || ''

  // Get published posts from database with count
  let query = supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  
  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
  }

  const { data: posts, error, count } = await query
    .range((page - 1) * limit, page * limit - 1)
    .returns<DatabasePost[]>()

  if (error) {
    return createErrorResponse('Database error', 500)
  }

  const formattedPosts = await formatPosts(posts || [])
  const total = count || 0
  const from = total > 0 ? (page - 1) * limit + 1 : null
  const to = total > 0 ? Math.min(page * limit, total) : null
  const lastPage = Math.ceil(total / limit)

  const response: PaginatedResponse<FormattedPost> = {
    data: formattedPosts,
    meta: {
      current_page: page,
      last_page: lastPage,
      per_page: limit,
      total: total,
      from: from,
      to: to
    },
    links: {
      first: page > 1 ? `/api/posts?page=1` : null,
      last: page < lastPage ? `/api/posts?page=${lastPage}` : null,
      prev: page > 1 ? `/api/posts?page=${page - 1}` : null,
      next: page < lastPage ? `/api/posts?page=${page + 1}` : null
    }
  }

  return createSuccessResponse(response)
}

// 単一公開ポスト取得
export async function handlePublicPost(postId: number): Promise<Response> {
  // Get published post from database
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .eq('status', 'published')
    .limit(1)
  
  if (error) {
    return createErrorResponse('Database error', 500)
  }

  const post = posts && posts.length > 0 ? posts[0] : null
  
  if (!post) {
    return createErrorResponse('Post not found', 404)
  }

  const formattedPost = await formatPost(post)
  return createSuccessResponse({ data: formattedPost })
}

// 管理者ポスト一覧取得
export async function handleAdminPosts(request: Request, url: URL): Promise<Response> {
  const authValidation = await validateAuthToken(request.headers.get('authorization'))
  if (!authValidation.isValid) {
    return createErrorResponse(authValidation.error || 'Unauthorized', 401)
  }

  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)
  
  // Get all posts from database for admin with count
  const { data: posts, error, count } = await supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) {
    return createErrorResponse('Database error', 500)
  }

  const formattedPosts = await formatPosts(posts || [])
  const total = count || 0
  const from = total > 0 ? (page - 1) * limit + 1 : null
  const to = total > 0 ? Math.min(page * limit, total) : null
  const lastPage = Math.ceil(total / limit)

  const response: PaginatedResponse<FormattedPost> = {
    data: formattedPosts,
    meta: {
      current_page: page,
      last_page: lastPage,
      per_page: limit,
      total: total,
      from: from,
      to: to
    },
    links: {
      first: page > 1 ? `/api/admin/posts?page=1` : null,
      last: page < lastPage ? `/api/admin/posts?page=${lastPage}` : null,
      prev: page > 1 ? `/api/admin/posts?page=${page - 1}` : null,
      next: page < lastPage ? `/api/admin/posts?page=${page + 1}` : null
    }
  }

  return createSuccessResponse(response)
}

// 管理者単一ポスト取得
export async function handleAdminPost(request: Request, postId: number): Promise<Response> {
  const authValidation = await validateAuthToken(request.headers.get('authorization'))
  if (!authValidation.isValid) {
    return createErrorResponse(authValidation.error || 'Unauthorized', 401)
  }

  // Get post from database
  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .maybeSingle()
  
  if (error) {
    return createErrorResponse('Database error', 500)
  }
  
  if (!post) {
    return createErrorResponse('Post not found', 404)
  }

  const formattedPost = await formatPost(post)
  return createSuccessResponse({ data: formattedPost })
}

// ポスト作成
export async function handleCreatePost(request: Request): Promise<Response> {
  const authValidation = await validateAuthToken(request.headers.get('authorization'))
  if (!authValidation.isValid) {
    return createErrorResponse(authValidation.error || 'Unauthorized', 401)
  }

  try {
    console.log('Starting post creation for user:', authValidation.user!.email)
    
    // Get user ID from users table, create if not exists
    let { data: user, error: userLookupError } = await supabase
      .from('users')
      .select('id')
      .eq('email', authValidation.user!.email)
      .maybeSingle()
    
    console.log('User lookup result:', { user, userLookupError })
    
    if (userLookupError) {
      console.error('Database error while looking up user:', userLookupError)
      return createErrorResponse('Database error', 500)
    }
    
    if (!user) {
      console.log('User not found, creating new user for:', authValidation.user!.email)
      // Create new user in users table
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          email: authValidation.user?.email || '',
          name: authValidation.user?.email?.split('@')[0] || 'defaultName', // Use email prefix as default name
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()
      
      console.log('User creation result:', { newUser, createUserError })
      
      if (createUserError || !newUser) {
        console.error('Failed to create user:', createUserError)
        return createErrorResponse(`Failed to create user: ${createUserError?.message || 'Unknown error'}`, 500)
      }
      
      user = newUser
      console.log('Created new user with ID:', user.id)
    }

    const body: CreatePostRequest = await request.json()
    const { title, content, excerpt, status } = body

    // バリデーション
    const validation = validatePostData(body)
    if (!validation.isValid) {
      return createErrorResponse('Validation failed', 422, validation.errors)
    }

    // Create new post in database
    const now = new Date().toISOString()
    const postData = {
      title,
      content,
      excerpt: excerpt || content.substring(0, 100) + '...',
      status: status || 'draft',
      published_at: status === 'published' ? now : null,
      user_id: user.id,
      created_at: now,
      updated_at: now
    }

    const { data: newPost, error } = await supabase
      .from('posts')
      .insert([postData])
      .select('*')
      .maybeSingle()

    if (error) {
      return createErrorResponse('Database error', 500)
    }

    const formattedPost = await formatPost(newPost!)
    return createSuccessResponse({
      data: formattedPost,
      message: 'Post created successfully'
    }, undefined, 201)
  } catch (error) {
    console.error('Create post error:', error)
    return createErrorResponse('Create post processing error', 500)
  }
}

// ポスト更新
export async function handleUpdatePost(request: Request, postId: number): Promise<Response> {
  const authValidation = await validateAuthToken(request.headers.get('authorization'))
  if (!authValidation.isValid) {
    return createErrorResponse(authValidation.error || 'Unauthorized', 401)
  }

  try {
    const body: UpdatePostRequest = await request.json()
    const { title, content, excerpt, status } = body

    // バリデーション
    const validation = validatePostData(body)
    if (!validation.isValid) {
      return createErrorResponse('Validation failed', 422, validation.errors)
    }

    // Get current post to preserve published_at if already published
    const { data: currentPost } = await supabase
      .from('posts')
      .select('published_at, status')
      .eq('id', postId)
      .single()

    const now = new Date().toISOString()
    let published_at = null
    
    if (status === 'published') {
      // If already published, keep the original published_at; if newly published, set current time
      published_at = currentPost?.published_at || now
    }

    const updateData = {
      title,
      content,
      excerpt: excerpt || content.substring(0, 100) + '...',
      status: status || 'draft',
      published_at,
      updated_at: now
    }

    const { data: updatedPost, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select('*')
      .maybeSingle()

    if (error) {
      return createErrorResponse('Database error', 500)
    }

    if (!updatedPost) {
      return createErrorResponse('Post not found', 404)
    }

    const formattedPost = await formatPost(updatedPost)
    return createSuccessResponse({
      data: formattedPost,
      message: 'Post updated successfully'
    })
  } catch (error) {
    console.error('Update post error:', error)
    return createErrorResponse('Update post processing error', 500)
  }
}

// ポスト削除
export async function handleDeletePost(request: Request, postId: number): Promise<Response> {
  const authValidation = await validateAuthToken(request.headers.get('authorization'))
  if (!authValidation.isValid) {
    return createErrorResponse(authValidation.error || 'Unauthorized', 401)
  }

  // Delete post from database
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (error) {
    return createErrorResponse('Database error', 500)
  }

  return createSuccessResponse({
    message: `Post ${postId} deleted successfully`
  })
}