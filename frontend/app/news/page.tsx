import type { Metadata } from "next";
import { generateMetadata as generateSEOMetadata } from "@/lib/metadata";
import NewsPage from "./NewsPage";

export const metadata: Metadata = generateSEOMetadata({
  title: "News一覧 - R.W.Sドリブル塾",
  description:
    "R.W.Sドリブル塾の最新ニュースやお知らせをお届けします。スクール情報、イベント情報、コーチからのメッセージなど、最新情報をチェックしてください。",
  keywords: [
    "ニュース",
    "お知らせ",
    "RWS",
    "ドリブル塾",
    "サッカー",
    "スクール情報",
    "イベント",
  ],
  type: "website",
});

export default function Page() {
  return <NewsPage />;
}
