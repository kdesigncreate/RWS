import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/metadata';
import HomePage from './HomePage';

export const metadata: Metadata = generateSEOMetadata({
  title: 'R.W.Sドリブル塾 - 全国のサッカードリブルスクール',
  description: 'R.W.Sドリブル塾は全国21都道府県でサッカーのドリブル技術向上を目的としたスクールを開催。独自の練習メニューで2000名以上の生徒が在籍し、Jリーグ下部組織合格者も輩出しています。',
  keywords: ['サッカー', 'ドリブル', 'スクール', 'RWS', 'サッカー教室', 'ドリブル塾', '全国', '技術向上', 'Jリーグ'],
  type: 'website',
});

export default function Page() {
  return <HomePage />;
}