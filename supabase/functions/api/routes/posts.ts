/**
 * 投稿関連のルート
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AuthContext } from '../middleware/auth.ts';

export class PostRoutes {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  // 公開投稿一覧の取得
  async getPosts(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const search = url.searchParams.get('search') || '';
      
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('posts')
        .select('id, title, content, created_at, updated_at', { count: 'exact' })
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (search) {
        query = query.or(`title.ilike.%${search}%, content.ilike.%${search}%`);
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

  // 公開投稿詳細の取得
  async getPost(request: Request, id: string): Promise<Response> {
    try {
      const { data: post, error } = await this.supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
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
}