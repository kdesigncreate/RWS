import type { Metadata } from 'next';
import AdminPostEditPage from './AdminPostEditPage';
import { generateMetadata as generateSEOMetadata } from '@/lib/metadata';

interface PostEditPageProps {
  params: { id: string };
}

export const metadata: Metadata = generateSEOMetadata({
  title: '記事編集',
  description: 'R.W.Sドリブル塾の記事編集画面です。',
  noindex: true, // 管理画面は検索エンジンにインデックスさせない
});

export default function Page({ params }: PostEditPageProps) {
  return <AdminPostEditPage params={params} />;
}
