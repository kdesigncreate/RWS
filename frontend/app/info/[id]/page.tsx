import type { Metadata } from "next";
import PostDetailPage from "./PostDetailPage";
import { api } from "@/lib/api";
import { generatePostMetadata } from "@/lib/metadata";
import type { Post } from "@/types/post";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

interface ApiResponse {
  data: Post;
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const response = await api.get<ApiResponse>(`/posts/${resolvedParams.id}`);
    const post = response.data.data || response.data;

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

export default async function Page({ params }: PostPageProps) {
  const resolvedParams = await params;
  return <PostDetailPage params={resolvedParams} />;
}
