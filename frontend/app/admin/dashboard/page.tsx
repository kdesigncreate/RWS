import type { Metadata } from "next";
import AdminDashboardPage from "./AdminDashboardPage";
import { generateMetadata as generateSEOMetadata } from "@/lib/metadata";

export const metadata: Metadata = generateSEOMetadata({
  title: "管理者ダッシュボード",
  description: "R.W.Sドリブル塾の記事管理画面です。",
  noindex: true, // 管理画面は検索エンジンにインデックスさせない
});

export default function Page() {
  return <AdminDashboardPage />;
}
