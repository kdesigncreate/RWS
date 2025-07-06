"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from '@/components/ui/badge'; // 将来の拡張用にコメントアウト
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { generateStructuredData } from "@/lib/metadata";
import type { Post } from "@/types/post";

interface PostDetailPageProps {
  params: { id: string };
}

interface ApiResponse {
  data: Post;
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const postId = params.id;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<ApiResponse>(`/posts/${postId}`);
        setPost(response.data.data || response.data);
      } catch (err: unknown) {
        console.error("記事の取得に失敗しました:", err);
        const errorMessage =
          err instanceof Error && "response" in err
            ? (err as { response?: { data?: { message?: string } } }).response
                ?.data?.message
            : "記事の取得に失敗しました";
        setError(errorMessage || "記事の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  // 構造化データの生成
  const structuredData: Record<string, unknown> | null = post
    ? generateStructuredData({
        type: "Article",
        data: {
          title: post.title,
          description:
            post.excerpt || (post.content && typeof post.content === 'string' ? post.content.replace(/<[^>]*>/g, "").slice(0, 160) : ""),
          author: post.author?.name,
          publishedTime: post.published_at,
          modifiedTime: post.updated_at,
          url: `/info/${post.id}`,
          image: "/images/og-image.jpg",
        },
      })
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-16 sm:pt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="pt-16 sm:pt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <ErrorDisplay
              message={error || "記事が見つかりませんでした"}
              onRetry={() => window.location.reload()}
            />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      {/* 構造化データ */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}

      <div className="min-h-screen bg-white">
        <Header />

        <main className="pt-16 sm:pt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            {/* 戻るボタン */}
            <div className="mb-6 sm:mb-8">
              <a
                href="/#news"
                className="flex items-center text-gray-600 hover:text-gray-900 text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                戻る
              </a>
            </div>

            {/* 記事詳細 */}
            <div className="max-w-4xl mx-auto">
              <Card className="shadow-lg">
                <CardContent className="p-6 sm:p-8 lg:p-12">
                  {/* 記事ヘッダー */}
                  <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                      {post.title}
                    </h1>

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      {post.author && (
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {post.author.name}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate.toJapanese(
                          post.published_at || post.created_at,
                        )}
                      </span>
                    </div>
                  </div>

                  {/* 記事要約 */}
                  {post.excerpt && (
                    <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        {post.excerpt}
                      </p>
                    </div>
                  )}

                  {/* 記事本文 */}
                  <div className="prose prose-gray max-w-none">
                    <div
                      className="text-gray-800 leading-relaxed text-sm sm:text-base"
                      dangerouslySetInnerHTML={{ __html: post.content || "" }}
                    />
                  </div>

                  {/* 記事フッター */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    {/* 編集UIは公開側では不要なので削除 */}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
