/**
 * 認証関連のルート
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AuthContext } from '../middleware/auth.ts';

export class AuthRoutes {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async login(request: Request): Promise<Response> {
    try {
      const { email, password } = await request.json();

      if (!email || !password) {
        return new Response(
          JSON.stringify({ 
            message: 'メールアドレスとパスワードが必要です',
            errors: {
              email: !email ? ['メールアドレスが必要です'] : [],
              password: !password ? ['パスワードが必要です'] : []
            }
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return new Response(
          JSON.stringify({ 
            message: 'ログインに失敗しました',
            error: error.message 
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({
          message: 'ログインに成功しました',
          user: data.user,
          token: data.session?.access_token,
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

  async logout(request: Request, authContext: AuthContext): Promise<Response> {
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

      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.substring(7);

      if (token) {
        await this.supabase.auth.signOut(token);
      }

      return new Response(
        JSON.stringify({ message: 'ログアウトに成功しました' }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          message: 'ログアウト中にエラーが発生しました',
          error: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  async getUser(request: Request, authContext: AuthContext): Promise<Response> {
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

      return new Response(
        JSON.stringify({
          user: authContext.user,
          isAuthenticated: true
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          message: 'ユーザー情報の取得中にエラーが発生しました',
          error: error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  async checkAuth(request: Request, authContext: AuthContext): Promise<Response> {
    return new Response(
      JSON.stringify({
        isAuthenticated: authContext.isAuthenticated,
        user: authContext.user
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}