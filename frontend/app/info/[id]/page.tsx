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
    console.log(`[generateMetadata] Fetching post ${resolvedParams.id}`);
    
    // サーバーサイドでは完全なURLを使用
    const apiUrl = process.env.NEXT_PUBLIC_FRONTEND_URL 
      ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/posts/${resolvedParams.id}`
      : `https://rws-ruddy.vercel.app/api/posts/${resolvedParams.id}`;
    
    console.log(`[generateMetadata] Using API URL: ${apiUrl}`);
    
    // fetch を使用してサーバーサイドでAPIアクセス
    const fetchResponse = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NextJS-SSR'
      },
      cache: 'no-store'
    });
    
    if (!fetchResponse.ok) {
      throw new Error(`API request failed: ${fetchResponse.status} ${fetchResponse.statusText}`);
    }
    
    const responseData = await fetchResponse.json();
    const post = responseData.data || responseData;
    
    console.log(`[generateMetadata] Post fetched successfully:`, post.title);

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
    const resolvedParams = await params;
    console.error(`[generateMetadata] Error fetching post ${resolvedParams.id}:`, error);
    
    // エラーの詳細を確認
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`[generateMetadata] Error details:`, errorMessage);
    
    // 記事が見つからない場合でも、サイト名は表示する
    return {
      title: "R.W.Sドリブル塾",
      description: "サッカーのドリブル技術向上を目指すサッカー塾の記事です。",
      robots: {
        index: true,
        follow: true,
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
