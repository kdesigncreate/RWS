import type { Metadata } from "next";
import AdminLoginPage from "./AdminLoginPage";
import { generateMetadata as generateSEOMetadata } from "@/lib/metadata";

export const metadata: Metadata = generateSEOMetadata({
  title: "管理者ログイン",
  description:
    "R.W.Sドリブル塾の管理画面にアクセスするためのログインページです。",
  noindex: true, // 管理画面は検索エンジンにインデックスさせない
});

export default function Page() {
  return <AdminLoginPage />;
}
