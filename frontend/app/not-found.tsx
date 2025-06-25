import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Home, 
  ArrowLeft, 
  Search,
  FileX
} from 'lucide-react';
import Link from 'next/link';
import { generateMetadata as generateSEOMetadata } from '@/lib/metadata';

export const metadata: Metadata = generateSEOMetadata({
  title: 'ページが見つかりません',
  description: 'お探しのページは見つかりませんでした。URLをご確認いただくか、ホームページからお探しください。',
  noindex: true,
});

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <FileX className="h-10 w-10 text-gray-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            404 - ページが見つかりません
          </CardTitle>
          <p className="text-gray-600">
            お探しのページは存在しないか、移動または削除された可能性があります。
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 考えられる原因 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">考えられる原因:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• URLのタイプミス</li>
              <li>• ページの移動または削除</li>
              <li>• 古いリンクからのアクセス</li>
              <li>• 一時的なサーバーの問題</li>
            </ul>
          </div>

          {/* アクションボタン */}
          <div className="space-y-3">
            <Button asChild className="w-full bg-black text-white hover:bg-gray-800">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                ホームページに戻る
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="javascript:history.back()">
                <ArrowLeft className="h-4 w-4 mr-2" />
                前のページに戻る
              </Link>
            </Button>
          </div>

          {/* 人気のページ */}
          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-900 mb-3">よくご覧いただくページ:</h3>
            <div className="space-y-2">
              <Link 
                href="/"
                className="block p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">トップページ</div>
                <div className="text-sm text-gray-600">R.W.Sドリブル塾について</div>
              </Link>
              
              <Link 
                href="/#about"
                className="block p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">スクールについて</div>
                <div className="text-sm text-gray-600">独自の練習メニューと実績</div>
              </Link>
              
              <Link 
                href="/#staff"
                className="block p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">指導スタッフ</div>
                <div className="text-sm text-gray-600">経験豊富なコーチ陣</div>
              </Link>
              
              <Link 
                href="/#price"
                className="block p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">料金体系</div>
                <div className="text-sm text-gray-600">入会金・月会費について</div>
              </Link>
              
              <Link 
                href="/#schoolList"
                className="block p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-gray-900">スクール一覧</div>
                <div className="text-sm text-gray-600">全国のスクール開催地</div>
              </Link>
            </div>
          </div>

          {/* お問い合わせ */}
          <div className="text-center text-sm text-gray-500 border-t pt-4">
            <p>お探しのページが見つからない場合は、</p>
            <p>R.W.Sドリブル塾までお気軽にお問い合わせください。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}