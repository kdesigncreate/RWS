"use client";

import React, { useEffect, useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { PostCardList } from "@/components/posts/PostCard";
import { usePosts } from "@/hooks/usePosts";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { useDebounce } from "@/hooks/useDebounce";

export default function NewsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { posts, loading, error, fetchPublicPosts, pagination } = usePosts();

  // paginationからhasMoreとtotalCountを計算
  const hasMore = pagination.currentPage < pagination.lastPage;
  const totalCount = pagination.total;

  // 検索クエリまたはページが変更されたときに記事を取得
  useEffect(() => {
    const params: {
      page: number;
      limit: number;
      search?: string;
    } = {
      page: currentPage,
      limit: 10,
    };

    if (debouncedSearchQuery.trim()) {
      params.search = debouncedSearchQuery.trim();
    }

    fetchPublicPosts(params);
  }, [debouncedSearchQuery, currentPage, fetchPublicPosts]);

  // 検索クエリが変更されたときにページをリセット
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleLoadMore = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-16 sm:pt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* ヘッダー */}
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                戻る
              </Button>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                News一覧
              </h1>
            </div>

            <p className="text-gray-600 text-base sm:text-lg">
              R.W.Sドリブル塾の最新ニュースやお知らせをお届けします
            </p>
          </div>

          {/* 検索バー */}
          <Card className="mb-8">
            <CardContent className="p-4 sm:p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="記事を検索..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 sm:py-3 text-sm sm:text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* 検索結果表示 */}
          {debouncedSearchQuery && (
            <div className="mb-6">
              <p className="text-gray-600">
                「{debouncedSearchQuery}」の検索結果: {totalCount}件
              </p>
            </div>
          )}

          {/* 記事一覧 */}
          {loading && currentPage === 1 ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <ErrorDisplay
              message={error}
              onRetry={() => {
                const params: {
                  page: number;
                  limit: number;
                  search?: string;
                } = {
                  page: currentPage,
                  limit: 10,
                };
                if (debouncedSearchQuery.trim()) {
                  params.search = debouncedSearchQuery.trim();
                }
                fetchPublicPosts(params);
              }}
            />
          ) : (
            <>
              <PostCardList
                posts={posts}
                variant="default"
                showAuthor={true}
                showStatus={false}
                showReadingTime={false}
                emptyMessage={
                  debouncedSearchQuery
                    ? `「${debouncedSearchQuery}」に一致する記事が見つかりませんでした`
                    : "まだ投稿がありません"
                }
                className="mb-8"
              />

              {/* さらに読み込むボタン */}
              {hasMore && posts.length > 0 && (
                <div className="text-center mb-8">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loading}
                    variant="outline"
                    className="px-8 py-3"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner className="mr-2" />
                        読み込み中...
                      </>
                    ) : (
                      "さらに読み込む"
                    )}
                  </Button>
                </div>
              )}

              {/* 記事が見つからない場合のメッセージ */}
              {!loading && posts.length === 0 && !debouncedSearchQuery && (
                <Card className="text-center py-12">
                  <CardContent>
                    <p className="text-gray-600 text-lg mb-4">
                      まだ記事が投稿されていません
                    </p>
                    <p className="text-gray-500">
                      新しい記事が投稿され次第、こちらに表示されます
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* トップに戻るボタン */}
          {posts.length > 0 && (
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={handleBackToTop}
                className="text-gray-600 hover:text-gray-900"
              >
                トップに戻る
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
