import type { Metadata } from 'next';
import PostDetailPage from './PostDetailPage';
import { api } from '@/lib/api';
import { generatePostMetadata } from '@/lib/metadata';

interface PostPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  try {
    const response = await api.get(`/posts/${params.id}`);
    const post = response.data.data;
    
    return generatePostMetadata({
      post,
      url: `/info/${params.id}`,
    });
  } catch (error) {
    return {
      title: '記事が見つかりません | R.W.Sドリブル塾',
      description: 'お探しの記事が見つかりませんでした。',
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default function Page({ params }: PostPageProps) {
  return <PostDetailPage params={params} />;
}