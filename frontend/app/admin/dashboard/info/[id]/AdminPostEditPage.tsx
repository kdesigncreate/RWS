'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PostForm } from '@/components/admin/PostForm';
// import { LoadingSpinner } from '@/components/common/LoadingSpinner'; // 将来の拡張用にコメントアウト
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { usePosts } from '@/hooks/usePosts';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Trash2, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';
import type { CreatePostData, UpdatePostData } from '@/types/post';
import Link from 'next/link';

interface AdminPostEditPageProps {
  params: { id: string };
}

export default function AdminPostEditPage({ params }: AdminPostEditPageProps) {
  const router = useRouter();
  const {
    currentPost,
    loading,
    error,
    fetchAdminPost,
    createPost,
    updatePost,
    deletePost,
  } = usePosts();

  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const postId = params.id === 'new' ? null : Number(params.id);
  const isCreating = postId === null;
  const isEditing = !isCreating;

  // 記事データの取得（編集時のみ）
  useEffect(() => {
    if (isEditing && postId && !isNaN(postId)) {
      fetchAdminPost(postId);
    }
  }, [isEditing, postId, fetchAdminPost]);

  // 無効なIDの場合は404
  if (isEditing && (isNaN(postId!) || postId! <= 0)) {
    notFound();
  }

  // 記事の保存（作成・更新）
  const handleSubmit = async (data: CreatePostData | UpdatePostData) => {
    setSaveStatus({ type: null, message: '' });

    try {
      let result;
      
      if (isCreating) {
        result = await createPost(data as CreatePostData);
        if (result.success && result.post) {
          setSaveStatus({ 
            type: 'success', 
            message: '記事が正常に作成されました' 
          });
          // 作成後は編集ページにリダイレクト
          router.push(`/admin/dashboard/info/${result.post.id}`);
          return result;
        }
      } else {
        result = await updatePost(postId!, data as UpdatePostData);
        if (result.success) {
          setSaveStatus({ 
            type: 'success', 
            message: '記事が正常に更新されました' 
          });
        }
      }

      if (!result.success) {
        setSaveStatus({ 
          type: 'error', 
          message: result.error || '保存に失敗しました' 
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
      setSaveStatus({ 
        type: 'error', 
        message: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  };

  // 自動保存用（編集時のみ）
  const handleAutoSave = async (data: CreatePostData | UpdatePostData) => {
    if (!isEditing) return { success: false, error: '新規作成時は自動保存できません' };
    
    try {
      const result = await updatePost(postId!, data as UpdatePostData);
      return { success: result.success, error: result.error };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '自動保存に失敗しました' 
      };
    }
  };

  // 記事の削除
  const handleDelete = async () => {
    if (!isEditing || !currentPost) return;

    const confirmMessage = `記事「${currentPost.title}」を削除しますか？\n\nこの操作は取り消せません。`;
    
    if (confirm(confirmMessage)) {
      const result = await deletePost(postId!);
      if (result.success) {
        router.push('/admin/dashboard');
      } else {
        setSaveStatus({ 
          type: 'error', 
          message: result.error || '削除に失敗しました' 
        });
      }
    }
  };

  // プレビュー表示
  const handlePreview = () => {
    if (isEditing && currentPost) {
      window.open(`/info/${currentPost.id}`, '_blank');
    }
  };

  return (
    <AdminLayout 
      title={isCreating ? '新しい記事' : '記事編集'}
      loading={loading && isEditing}
      error={error}
    >
      <div className="space-y-6">
        {/* ページヘッダー */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                ダッシュボードに戻る
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isCreating ? '新しい記事を作成' : '記事を編集'}
              </h1>
              {isEditing && currentPost && (
                <p className="text-gray-600 text-sm mt-1">
                  作成日: {new Date(currentPost.created_at).toLocaleDateString('ja-JP')}
                  {currentPost.updated_at !== currentPost.created_at && (
                    <span className="ml-4">
                      最終更新: {new Date(currentPost.updated_at).toLocaleDateString('ja-JP')}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex items-center space-x-2">
            {isEditing && currentPost && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  プレビュー
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  削除
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 保存ステータス表示 */}
        {saveStatus.type && (
          <Alert 
            variant={saveStatus.type === 'error' ? 'destructive' : 'default'}
            className={saveStatus.type === 'success' ? 'border-green-200 bg-green-50' : ''}
          >
            {saveStatus.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription className={saveStatus.type === 'success' ? 'text-green-800' : ''}>
              {saveStatus.message}
            </AlertDescription>
          </Alert>
        )}

        {/* エラー表示 */}
        {error && (
          <ErrorDisplay 
            message={error} 
            onRetry={() => isEditing && postId && fetchAdminPost(postId)}
          />
        )}

        {/* フォーム表示 */}
        {(!loading || isCreating) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Save className="h-5 w-5 mr-2" />
                {isCreating ? '記事作成フォーム' : '記事編集フォーム'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PostForm
                post={isEditing ? currentPost : null}
                onSubmit={handleSubmit}
                onSave={isEditing ? handleAutoSave : undefined}
                loading={loading}
              />
            </CardContent>
          </Card>
        )}

        {/* 記事が見つからない場合 */}
        {isEditing && !loading && !error && !currentPost && (
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                記事が見つかりません
              </h3>
              <p className="text-gray-600 mb-6">
                指定された記事は存在しないか、削除された可能性があります。
              </p>
              <Button asChild>
                <Link href="/admin/dashboard">
                  ダッシュボードに戻る
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 開発用情報（開発モードでのみ表示） */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="border-dashed border-gray-300">
            <CardHeader>
              <CardTitle className="text-sm text-gray-500">開発用情報</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-500 space-y-1">
              <p>Mode: {isCreating ? 'Create' : 'Edit'}</p>
              <p>Post ID: {postId || 'N/A'}</p>
              <p>Loading: {loading ? 'Yes' : 'No'}</p>
              <p>Has Post: {currentPost ? 'Yes' : 'No'}</p>
              <p>Error: {error || 'None'}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}