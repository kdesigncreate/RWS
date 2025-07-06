/**
 * 認証ミドルウェア
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthContext {
  user: any;
  isAuthenticated: boolean;
  userId?: string;
}

export const createAuthMiddleware = (
  supabaseUrl: string,
  supabaseServiceKey: string
) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  return async (
    request: Request,
    requireAuth: boolean = true
  ): Promise<AuthContext> => {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (requireAuth) {
        throw new Error('認証が必要です');
      }
      return { user: null, isAuthenticated: false };
    }

    const token = authHeader.substring(7);

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        if (requireAuth) {
          throw new Error('無効な認証トークンです');
        }
        return { user: null, isAuthenticated: false };
      }

      return {
        user,
        isAuthenticated: true,
        userId: user.id
      };
    } catch (error) {
      if (requireAuth) {
        throw new Error('認証エラーが発生しました');
      }
      return { user: null, isAuthenticated: false };
    }
  };
};