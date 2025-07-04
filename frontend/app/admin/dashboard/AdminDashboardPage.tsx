"use client";

import React, { useState, useEffect } from "react";
// import { useRouter } from 'next/navigation'; // 将来の拡張用にコメントアウト
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PostTable } from "@/components/admin/PostTable";
// import { SearchBar } from '@/components/posts/SearchBar'; // 未使用のため一時的にコメントアウト
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { usePosts } from "@/hooks/usePosts";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Plus,
  Search,
  // Filter,
  // BarChart3,
  FileText,
  Eye,
  Edit,
  TrendingUp,
  // Users,
  // Calendar
} from "lucide-react";
import type { PostSearchParams } from "@/types/post";
import Link from "next/link";

export default function AdminDashboardPage() {
  // const router = useRouter(); // 将来の拡張用にコメントアウト
  const {
    posts,
    loading,
    error,
    pagination,
    fetchAdminPosts,
    // deletePost, // 将来の拡張用にコメントアウト
  } = usePosts();

  // 検索パラメータの状態
  const [searchParams, setSearchParams] = useState<PostSearchParams>({
    search: "",
    status: undefined,
    page: 1,
    limit: 10,
    sort: "created_at",
    order: "desc",
  });

  // 選択された記事のID管理
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);

  // 検索デバウンス
  const debouncedSearch = useDebounce(searchParams.search, 500);

  // 初期読み込みと検索パラメータ変更時のデータ取得
  useEffect(() => {
    const params = {
      ...searchParams,
      search: debouncedSearch,
    };
    fetchAdminPosts(params);
  }, [debouncedSearch, searchParams, fetchAdminPosts]);

  // 検索パラメータの更新
  const updateSearchParams = (updates: Partial<PostSearchParams>) => {
    setSearchParams((prev) => ({
      ...prev,
      ...updates,
      page: updates.page || 1, // ページはリセット（pageの直接指定時は除く）
    }));
  };

  // 記事の編集（将来の拡張用）
  // const handleEdit = (postId: number) => {
  //   router.push(`/admin/dashboard/info/${postId}`);
  // };

  // 記事の削除（将来の拡張用）
  // const handleDelete = async (postId: number) => {
  //   if (confirm('この記事を削除しますか？')) {
  //     const result = await deletePost(postId);
  //     if (result.success) {
  //       // 選択からも除外
  //       setSelectedPosts(prev => prev.filter(id => id !== postId));
  //     }
  //   }
  // };

  // 選択状態の管理
  const handleSelectionChange = (postIds: number[]) => {
    setSelectedPosts(postIds);
  };

  // 一括操作（将来の拡張用）
  // const handleBulkAction = async (action: string) => {
  //   // TODO: 一括操作の実装
  //   console.log('Bulk action:', action, 'on posts:', selectedPosts);
  // };

  // 統計データ（モック）
  const stats = {
    totalPosts: pagination.total,
    publishedPosts: posts.filter((p) => p.is_published).length,
    draftPosts: posts.filter((p) => p.is_draft).length,
    thisMonth: posts.filter((p) => {
      const postDate = new Date(p.created_at);
      const now = new Date();
      return (
        postDate.getMonth() === now.getMonth() &&
        postDate.getFullYear() === now.getFullYear()
      );
    }).length,
  };

  return (
    <AdminLayout title="ダッシュボード">
      <div className="space-y-6">
        {/* ページヘッダー */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
            <p className="text-gray-600">記事の管理と統計情報</p>
          </div>
          <Button asChild className="bg-black text-white hover:bg-gray-800">
            <Link href="/admin/dashboard/info/new">
              <Plus className="h-4 w-4 mr-2" />
              新しい記事
            </Link>
          </Button>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">総記事数</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalPosts}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">公開中</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.publishedPosts}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">下書き</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.draftPosts}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Edit className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    今月の投稿
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.thisMonth}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 検索・フィルター */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold">
              <Search className="h-5 w-5 mr-2" />
              記事検索・フィルター
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* キーワード検索 */}
              <div className="space-y-2">
                <Label htmlFor="search">キーワード</Label>
                <Input
                  id="search"
                  placeholder="タイトルや本文で検索..."
                  value={searchParams.search}
                  onChange={(e) =>
                    updateSearchParams({ search: e.target.value })
                  }
                />
              </div>

              {/* ステータスフィルター */}
              <div className="space-y-2">
                <Label htmlFor="status">ステータス</Label>
                <Select
                  value={searchParams.status || "all"}
                  onValueChange={(value) =>
                    updateSearchParams({
                      status:
                        value === "all"
                          ? undefined
                          : (value as "published" | "draft"),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべて</SelectItem>
                    <SelectItem value="published">公開中</SelectItem>
                    <SelectItem value="draft">下書き</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 表示件数 */}
              <div className="space-y-2">
                <Label htmlFor="limit">表示件数</Label>
                <Select
                  value={String(searchParams.limit)}
                  onValueChange={(value) =>
                    updateSearchParams({ limit: Number(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5件</SelectItem>
                    <SelectItem value="10">10件</SelectItem>
                    <SelectItem value="20">20件</SelectItem>
                    <SelectItem value="50">50件</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 選択中のアイテム数表示 */}
            {selectedPosts.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm text-blue-700">
                  {selectedPosts.length}件の記事が選択されています
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPosts([])}
                  >
                    選択をクリア
                  </Button>
                  {/* 一括操作ボタン（将来の拡張用） */}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 記事一覧テーブル */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">記事一覧</CardTitle>
            <Badge variant="outline">
              {pagination.total}件中{" "}
              {(pagination.currentPage - 1) * pagination.perPage + 1}-
              {Math.min(
                pagination.currentPage * pagination.perPage,
                pagination.total,
              )}
              件を表示
            </Badge>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <ErrorDisplay
                message={error}
                onRetry={() => fetchAdminPosts(searchParams)}
              />
            ) : (
              <PostTable
                posts={posts}
                selectedPosts={selectedPosts}
                onSelectionChange={handleSelectionChange}
                onSort={(field, order) =>
                  updateSearchParams({
                    sort: field as "created_at" | "published_at" | "title",
                    order,
                  })
                }
                sortField={searchParams.sort || "created_at"}
                sortDirection={searchParams.order || "desc"}
              />
            )}

            {/* ページネーション */}
            {pagination.lastPage > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  ページ {pagination.currentPage} / {pagination.lastPage}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage <= 1}
                    onClick={() =>
                      updateSearchParams({
                        page: pagination.currentPage - 1,
                      })
                    }
                  >
                    前へ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage >= pagination.lastPage}
                    onClick={() =>
                      updateSearchParams({
                        page: pagination.currentPage + 1,
                      })
                    }
                  >
                    次へ
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
