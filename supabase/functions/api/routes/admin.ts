/**
 * 管理者関連のルート
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AuthContext } from '../middleware/auth.ts';

export class AdminRoutes {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  // 管理者投稿一覧の取得
  async getAdminPosts(request: Request, authContext: AuthContext): Promise<Response> {
    try {
      if (!authContext.isAuthenticated) {
        return new Response(
          JSON.stringify({ message: '認証が必要です' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const search = url.searchParams.get('search') || '';
      const status = url.searchParams.get('status') || '';
      
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) {
        query = query.or(`title.ilike.%${search}%, content.ilike.%${search}%`);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: posts, error, count } = await query;

      if (error) {
        return new Response(
          JSON.stringify({ 
            message: '投稿の取得に失敗しました',
            error: error.message 
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({
          posts,
          pagination: {
            page,
            limit,
            total: count || 0,
            pages: Math.ceil((count || 0) / limit)
          }
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          message: 'サーバーエラーが発生しました',
          error: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // 管理者投稿詳細の取得
  async getAdminPost(request: Request, authContext: AuthContext, id: string): Promise<Response> {
    try {
      if (!authContext.isAuthenticated) {
        return new Response(
          JSON.stringify({ message: '認証が必要です' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const { data: post, error } = await this.supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !post) {
        return new Response(
          JSON.stringify({ message: '投稿が見つかりませんでした' }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ post }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          message: 'サーバーエラーが発生しました',
          error: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // 投稿の作成
  async createPost(request: Request, authContext: AuthContext): Promise<Response> {
    try {
      if (!authContext.isAuthenticated) {
        return new Response(
          JSON.stringify({ message: '認証が必要です' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const { title, content, status = 'draft' } = await request.json();

      if (!title || !content) {
        return new Response(
          JSON.stringify({ 
            message: 'タイトルと内容が必要です',
            errors: {
              title: !title ? ['タイトルが必要です'] : [],
              content: !content ? ['内容が必要です'] : []
            }
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const { data: post, error } = await this.supabase
        .from('posts')
        .insert({
          title,
          content,
          status,
          author_id: authContext.userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ 
            message: '投稿の作成に失敗しました',
            error: error.message 
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          message: '投稿が作成されました',
          post 
        }),
        { 
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          message: 'サーバーエラーが発生しました',
          error: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // 投稿の更新
  async updatePost(request: Request, authContext: AuthContext, id: string): Promise<Response> {
    try {
      if (!authContext.isAuthenticated) {
        return new Response(
          JSON.stringify({ message: '認証が必要です' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const { title, content, status } = await request.json();

      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (status !== undefined) updateData.status = status;

      const { data: post, error } = await this.supabase
        .from('posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ 
            message: '投稿の更新に失敗しました',
            error: error.message 
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      if (!post) {
        return new Response(
          JSON.stringify({ message: '投稿が見つかりませんでした' }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          message: '投稿が更新されました',
          post 
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          message: 'サーバーエラーが発生しました',
          error: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  // 投稿の削除
  async deletePost(request: Request, authContext: AuthContext, id: string): Promise<Response> {
    try {
      if (!authContext.isAuthenticated) {
        return new Response(
          JSON.stringify({ message: '認証が必要です' }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const { error } = await this.supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) {
        return new Response(
          JSON.stringify({ 
            message: '投稿の削除に失敗しました',
            error: error.message 
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({ message: '投稿が削除されました' }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          message: 'サーバーエラーが発生しました',
          error: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}