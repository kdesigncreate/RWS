// 記事詳細ページ（公開側）のルーティングとメタデータ生成
import type { Metadata } from "next";
import PostDetailPage from "./PostDetailPage";
import { api } from "@/lib/api";
import { generatePostMetadata } from "@/lib/metadata";
import type { Post } from "@/types/post";

// ルートコンポーネントのprops型
interface PostPageProps {
  params: Promise<{ id: string }>;
}

// APIレスポンス型
interface ApiResponse {
  data: Post;
}

// 動的メタデータ生成（SEOやOGP用）
export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  try {
    // URLパラメータから記事IDを取得
    const resolvedParams = await params;
    // APIから記事データを取得
    const response = await api.get<ApiResponse>(`/posts/${resolvedParams.id}`);
    const post = response.data.data || response.data;

    // 記事データを元にメタデータを生成
    return generatePostMetadata({
      post: {
        ...post,
        content: post.content || "",
        excerpt: post.excerpt || undefined,
        published_at: post.published_at || undefined,
        updated_at: post.updated_at || undefined,
      },
      url: `/info/${resolvedParams.id}`,
    });
  } catch (error) {
    // 記事が見つからない場合のメタデータ
    return {
      title: "記事が見つかりません | R.W.Sドリブル塾",
      description: "お探しの記事が見つかりませんでした。",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

// ページ本体：記事詳細ページを表示
export default async function Page({ params }: PostPageProps) {
  // URLパラメータから記事IDを取得し、詳細ページコンポーネントに渡す
  const resolvedParams = await params;
  return <PostDetailPage params={resolvedParams} />;
}
