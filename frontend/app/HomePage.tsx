"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Users, Calendar, Award, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCardList } from "@/components/posts/PostCard";
import { usePosts } from "@/hooks/usePosts";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { LazyYouTube } from "@/components/common/LazyYouTube";
import { generateStructuredData } from "@/lib/metadata";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export default function HomePage() {
  const { posts, loading, error, fetchPublicPosts } = usePosts();

  // コンポーネントマウント時に記事一覧を取得
  useEffect(() => {
    fetchPublicPosts({ limit: 5 }); // 最新5件を取得
  }, [fetchPublicPosts]);

  const staffMembers = [
    {
      name: "香村 正幸（かむらコーチ）",
      position: "神奈川支部代表",
      image: "/images/staff_kamura.jpeg",
      instagram: "https://www.instagram.com/masayuki_kamura/",
      schedule: [
        "毎週月曜日…瀬谷校メインコーチ",
        "毎週火曜日…東神奈川校メインコーチ",
        "毎週水曜日…相模原校メインコーチ",
        "毎週木曜日…瀬谷校メインコーチ",
        "毎週金曜日…元町校メインコーチ",
        "エリートクラス校↓↓",
        "毎週月曜日…瀬谷校会場　※19時から",
        "毎週金曜日…元町校会場　※19時から",
      ],
    },
    {
      name: "高橋 千春（はるコーチ）",
      position: "",
      image: "/images/staff_haru.jpeg",
      instagram:
        "https://www.instagram.com/rws.takahashi?igsh=OGQ5ZDc2ODk2ZA==",
      schedule: [
        "毎週月曜日…厚木校メインコーチ",
        "毎週火曜日…橋本校メインコーチ",
        "毎週水曜日…平塚校メインコーチ",
        "毎週木曜日…小田原校メインコーチ",
        "毎週金曜日…厚木校メインコーチ",
      ],
    },
    {
      name: "種山 健太（けんたコーチ）",
      position: "",
      image: "/images/staff_kenta.jpeg",
      instagram:
        "https://www.instagram.com/rws_kenta?igsh=MWdleWdhNW9uazRtYg%3D%3D&utm_source=qr",
      schedule: [
        "毎週月曜日…東戸塚校メインコーチ",
        "毎週火曜日…座間校メインコーチ",
        "毎週水曜日…海老名校メインコーチ",
        "毎週木曜日…富士校メインコーチ",
        "毎週金曜日…相模原校メインコーチ",
      ],
    },
    {
      name: "宗像 ひろき（ひろコーチ）",
      position: "",
      image: "/images/staff_hiro.jpeg",
      instagram:
        "https://www.instagram.com/rws.hiro?igsh=eDU5a3h4OWZtZ2Z4&utm_source=qr",
      schedule: [
        "毎週月曜日…茅ヶ崎校メインコーチ",
        "毎週火曜日…瀬谷校メインコーチ",
        "毎週水曜日…戸塚校メインコーチ",
        "毎週木曜日…平塚校メインコーチ",
      ],
    },
  ];

  // 地域ごとのスクールリスト
  const schoolAreas = [
    {
      area: "横浜市",
      schools: [
        {
          name: "瀬谷校…(月)",
          place: "TAKA FIELD YOKOHAMA",
          time: "17時〜18時30分",
          elite: "エリートクラス…19時〜20時30分",
        },
        {
          name: "瀬谷校 (火)(木)",
          place: "TAKA FIELD YOKOHAMA",
          time: "18時〜20時",
        },
        {
          name: "東神奈川校(火)",
          place: "ノア・フットサルステージ横浜",
          time: "17時30分~19時30分",
        },
        {
          name: "元町校(金)",
          place: "スポルティーヴォ横浜元町",
          time: "17時〜18時30分",
          elite: "エリートクラス…19時〜20時30分",
        },
        {
          name: "東戸塚校…(月)",
          place: "KPI PARKフットサルコート",
          time: "18時〜20時",
        },
        {
          name: "戸塚校…(水)",
          place: "スポーツフィールド戸塚",
          time: "17時〜19時",
        },
      ],
    },
    {
      area: "相模原市",
      schools: [
        {
          name: "相模原校…(水)",
          place: "WindsLife 相模原フィールド",
          time: "16時30分〜18時",
        },
        {
          name: "橋本校…(火)",
          place: "ルネサンス橋本",
          time: "18時〜20時",
        },
        {
          name: "座間校…(火)",
          place: "ティダスポーツパーク",
          time: "17時〜19時",
        },
        {
          name: "相模原校…(金)",
          place: "MSA ENERGY PARK CON REGALIA",
          time: "17時30分〜19時30分",
        },
      ],
    },
    {
      area: "平塚市",
      schools: [
        {
          name: "平塚校…(水)(木)",
          place: "コロナフットボールパーク湘南平塚",
          time: "17時〜19時",
        },
      ],
    },
    {
      area: "厚木市",
      schools: [
        {
          name: "厚木校…(月)(金)",
          place: "厚木インドアフットボールクラブ",
          time: "18時〜20時",
        },
      ],
    },
    {
      area: "海老名市",
      schools: [
        {
          name: "海老名校…(水)",
          place: "海老名フットサルアリーナ",
          time: "18時〜20時",
        },
      ],
    },
    {
      area: "茅ヶ崎市",
      schools: [
        {
          name: "茅ヶ崎校…(月)",
          place: "岡崎慎司フットサルフィールド",
          time: "17時〜19時",
        },
      ],
    },
    {
      area: "小田原市",
      schools: [
        {
          name: "小田原校…(木)",
          place: "Futsal Point小田原",
          time: "18時〜20時",
        },
      ],
    },
    {
      area: "静岡県",
      schools: [
        {
          name: "富士校…(木)",
          place: "ソレイユインドアスポーツプラザ",
          time: "18時～20時",
        },
      ],
    },
  ];

  // 構造化データの設定
  const organizationData = generateStructuredData({
    type: "Organization",
    data: {
      sameAs: [
        "https://www.youtube.com/@rwsdribble",
        "https://twitter.com/rwsdribble",
      ],
      address: {
        "@type": "PostalAddress",
        addressCountry: "JP",
        addressRegion: "全国",
      },
      areaServed: "日本",
      serviceType: "サッカースクール",
    },
  });

  const websiteData = generateStructuredData({
    type: "WebSite",
    data: {},
  });

  return (
    <>
      {/* 構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteData),
        }}
      />

      <div className="min-h-screen bg-white overflow-x-hidden">
        {/* ヘッダー */}
        <Header />

        {/* メインビジュアル */}
        <section
          className="relative pt-16 sm:pt-20"
          style={{ scrollMarginTop: "4rem" }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden">
              <div className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] xl:h-[600px] relative">
                <Image
                  src="/images/TOP.jpeg"
                  alt="R.W.S ドリブル塾のメインビジュアル - サッカードリブル技術向上スクール"
                  fill
                  className="object-cover"
                  priority
                  sizes="100vw"
                  quality={85}
                  onError={(e) => {
                    console.error("Image load error:", e);
                  }}
                />
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                    <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 tracking-tight leading-tight">
                      ドリブルの技術
                    </h1>
                    <p className="text-lg sm:text-xl md:text-2xl lg:text-2xl opacity-90 mb-4 sm:mb-6 lg:mb-8 font-medium">
                      一歩先へ進む、確かな技術
                    </p>
                    <p className="text-sm sm:text-base md:text-lg opacity-80 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
                      R.W.S独自の練習メニューで、あなたのドリブル技術を向上させます
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <main>
          {/* News セクション */}
          <section
            id="posts"
            className="py-12 sm:py-16 lg:py-20"
            style={{ scrollMarginTop: "3rem" }}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">
                  News
                </h2>
                <p className="text-gray-600 text-base sm:text-lg lg:text-xl">
                  最新の投稿
                </p>
              </div>
              <div className="max-w-6xl mx-auto">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : error ? (
                  <div className="py-12">
                    <ErrorDisplay
                      message={error}
                      onRetry={() => fetchPublicPosts({ limit: 5 })}
                    />
                  </div>
                ) : (
                  <PostCardList
                    posts={posts}
                    variant="compact"
                    showAuthor={true}
                    showStatus={false}
                    showReadingTime={false}
                    emptyMessage="まだ投稿がありません"
                  />
                )}
                <div className="text-center mt-8 sm:mt-12">
                  <Button
                    asChild
                    className="bg-black text-white hover:bg-gray-800 px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
                  >
                    <Link href="/news">News一覧</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* About セクション */}
          <section
            id="about"
            className="py-12 sm:py-16 lg:py-20 bg-gray-50"
            style={{ scrollMarginTop: "3rem" }}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">
                  About
                </h2>
                <p className="text-gray-600 text-base sm:text-lg lg:text-xl">
                  R.W.S ドリブル塾について
                </p>
              </div>
              <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                  {/* 画像 */}
                  <div className="relative">
                    <div className="rounded-2xl overflow-hidden shadow-xl">
                      <Image
                        src="/images/about.jpeg"
                        alt="R.W.S ドリブル塾について"
                        width={600}
                        height={400}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent"></div>
                    </div>
                  </div>
                  {/* テキスト */}
                  <div className="space-y-6">
                    <Card className="bg-white">
                      <CardContent className="p-6 sm:p-8">
                        <div className="text-center mb-6">
                          <h3 className="text-xl sm:text-2xl font-bold text-blue-700 mb-4">
                            私たちの理念
                          </h3>
                          <p className="text-lg text-gray-700 font-semibold leading-relaxed">
                            『練習する事・チャレンジするだけでは意味がない。
                            <br />
                            <span className="text-blue-600 font-bold">
                              練習し続ける事・チャレンジし続ける事
                            </span>
                            に意味がある。』
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-4 flex-shrink-0"></div>
                            <span className="text-gray-800 font-medium">
                              全国で2,000名以上のスクール生が在籍
                            </span>
                          </div>
                          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-4 flex-shrink-0"></div>
                            <span className="text-gray-800 font-medium">
                              Jリーグ下部組織・海外クラブ合格者多数
                            </span>
                          </div>
                          <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-4 flex-shrink-0"></div>
                            <span className="text-gray-800 font-medium">
                              人間性・学校生活でも成長を実感
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Staff セクション */}
          <section
            id="staff"
            className="py-12 sm:py-16 lg:py-20"
            style={{ scrollMarginTop: "3rem" }}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">
                  Staff
                </h2>
                <p className="text-gray-600 text-base sm:text-lg lg:text-xl">
                  指導スタッフ
                </p>
              </div>
              <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-6xl mx-auto mb-8 sm:mb-12">
                {staffMembers.map((staff, index) => (
                  <Card key={index}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="text-center mb-4 sm:mb-6">
                        <Avatar className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 ring-4 ring-blue-100">
                          <AvatarImage
                            src={staff.image}
                            alt={`${staff.name} - ${staff.position}`}
                          />
                          <AvatarFallback className="text-lg sm:text-xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {staff.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-2">
                          {staff.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className="mb-4 text-xs sm:text-sm"
                        >
                          {staff.position}
                        </Badge>
                      </div>
                      <div className="text-center font-medium text-gray-800 text-base mb-2">
                        担当校
                      </div>
                      <ul className="flex flex-col items-center space-y-1 mb-6">
                        {staff.schedule.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-center text-sm text-gray-700"
                          >
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      {/* Instagramアイコン - カードの一番下 */}
                      <div className="text-center border-t pt-4">
                        <p className="text-sm text-gray-600 mb-3">
                          Instagramはこちらから
                        </p>
                        <a
                          href={staff.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${staff.name}のInstagram`}
                          className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-110 shadow-lg hover:shadow-xl"
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-white"
                          >
                            <path
                              d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
                              fill="currentColor"
                            />
                          </svg>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Price セクション */}
          <section
            id="price"
            className="py-12 sm:py-16 lg:py-20 bg-gray-50"
            style={{ scrollMarginTop: "3rem" }}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">
                  Price
                </h2>
                <p className="text-gray-600 text-base sm:text-lg lg:text-xl">
                  料金体系
                </p>
              </div>
              <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
                {/* 入会金 */}
                <Card className="bg-white rounded-2xl shadow-xl p-0">
                  <div className="bg-gray-800 text-white rounded-t-2xl px-6 py-2 flex items-center text-lg sm:text-xl font-bold">
                    <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    入会金
                  </div>
                  <div className="px-6 pb-6 pt-4">
                    <div className="divide-y">
                      <div className="flex justify-between items-center py-3 hover:bg-gray-50 transition-colors">
                        <span className="font-medium text-sm sm:text-base">
                          入会金
                        </span>
                        <span className="text-right font-semibold text-sm sm:text-base">
                          12,980円（税別）
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 hover:bg-gray-50 transition-colors">
                        <span className="font-medium text-sm sm:text-base flex items-center">
                          年会費
                          <Badge variant="secondary" className="ml-2 text-xs">
                            ※1
                          </Badge>
                        </span>
                        <span className="text-right font-semibold text-sm sm:text-base">
                          11,000円（税別）
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 hover:bg-gray-50 transition-colors">
                        <span className="font-medium text-sm sm:text-base flex items-center">
                          スポーツ保険
                          <Badge variant="secondary" className="ml-2 text-xs">
                            ※2
                          </Badge>
                        </span>
                        <span className="text-right font-semibold text-sm sm:text-base">
                          1,000円（税別）
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 教材費 */}
                <Card className="bg-white rounded-2xl shadow-xl p-0">
                  <div className="bg-gray-800 text-white rounded-t-2xl px-6 py-2 flex items-center text-lg sm:text-xl font-bold">
                    <Award className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    教材費
                  </div>
                  <div className="px-6 pb-6 pt-4">
                    <div className="flex justify-between items-center py-3 hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-sm sm:text-base flex items-center">
                        指定ウェア
                        <Badge variant="secondary" className="ml-2 text-xs">
                          ※3
                        </Badge>
                      </span>
                      <span className="text-right font-semibold text-sm sm:text-base">
                        6,500円（税別）
                      </span>
                    </div>
                  </div>
                </Card>

                {/* 月会費 */}
                <Card className="bg-white rounded-2xl shadow-xl p-0">
                  <div className="bg-gray-800 text-white rounded-t-2xl px-6 py-2 flex items-center text-lg sm:text-xl font-bold">
                    <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    月会費
                  </div>
                  <div className="px-6 pb-6 pt-4">
                    <div className="divide-y">
                      <div className="py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm sm:text-base flex items-center">
                            90分スクール
                            <Badge variant="secondary" className="ml-2 text-xs">
                              ※4
                            </Badge>
                          </span>
                          <span className="text-right font-semibold text-sm sm:text-base">
                            8,850円（税別）
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-3 hover:bg-gray-50 transition-colors">
                        <span className="font-medium text-sm sm:text-base flex items-center">
                          120分スクール
                          <Badge variant="secondary" className="ml-2 text-xs">
                            ※5
                          </Badge>
                        </span>
                        <span className="text-right font-semibold text-sm sm:text-base">
                          9,850円（税別）
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="bg-blue-50 border-blue-200 shadow-lg">
                  <CardContent className="p-4 sm:p-6">
                    <div className="text-xs sm:text-sm text-gray-600 space-y-2">
                      <p>
                        <Badge variant="outline" className="mr-2">
                          ※1
                        </Badge>
                        入会月からの年度更新となります
                      </p>
                      <p>
                        <Badge variant="outline" className="mr-2">
                          ※2
                        </Badge>
                        毎年の4月で年度更新となります
                      </p>
                      <p>
                        <Badge variant="outline" className="mr-2">
                          ※3
                        </Badge>
                        シャツのみの値段です。シャツのみは入会して頂く際に購入して頂く形となります
                      </p>
                      <p>
                        <Badge variant="outline" className="mr-2">
                          ※4
                        </Badge>
                        ご兄弟様は2人目から兄弟割引で上記の料金から3,000円引き
                      </p>
                      <p>
                        <Badge variant="outline" className="mr-2">
                          ※5
                        </Badge>
                        ※元町校、エリートクラスは120分スクールとなります
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* School List セクション */}
          <section
            id="schoolList"
            className="py-12 sm:py-16 lg:py-20"
            style={{ scrollMarginTop: "3rem" }}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">
                  School List
                </h2>
                <p className="text-gray-600 text-base sm:text-lg lg:text-xl">
                  スクール一覧
                </p>
              </div>
              <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
                {schoolAreas.map((area, idx) => (
                  <Sheet key={idx}>
                    <SheetTrigger asChild>
                      <Card className="cursor-pointer hover:shadow-xl transition-shadow">
                        <CardContent className="p-4 sm:p-6 text-center">
                          <div className="mx-auto mb-3 sm:mb-4 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-green-100 rounded-full flex items-center justify-center">
                            <MapPin className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-green-600" />
                          </div>
                          <h3 className="text-base sm:text-lg lg:text-xl font-semibold hover:text-blue-600 transition-colors">
                            {area.area}
                          </h3>
                        </CardContent>
                      </Card>
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className="max-w-lg w-full flex flex-col"
                    >
                      <SheetHeader className="flex flex-row items-center justify-between">
                        <SheetTitle>{area.area}のスクール一覧</SheetTitle>
                        <SheetTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">閉じる</span>
                          </Button>
                        </SheetTrigger>
                      </SheetHeader>
                      <div
                        className="mt-4 space-y-4 overflow-y-auto"
                        style={{ maxHeight: "70vh" }}
                      >
                        {area.schools.map((school, sidx) => (
                          <Card key={sidx} className="border p-4">
                            <div className="font-bold text-lg mb-1">
                              {school.name}
                            </div>
                            <div className="text-sm text-gray-700 mb-1">
                              会場名：{school.place}
                            </div>
                            <div className="text-sm text-gray-700 mb-1">
                              時間：{school.time}
                            </div>
                            {school.elite && (
                              <div className="text-xs text-blue-600">
                                {school.elite}
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    </SheetContent>
                  </Sheet>
                ))}
              </div>
            </div>
          </section>

          {/* Videos セクション */}
          <section
            id="videos"
            className="py-12 sm:py-16 lg:py-20 bg-white"
            style={{ scrollMarginTop: "3rem" }}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">
                  Videos
                </h2>
                <p className="text-gray-600 text-base sm:text-lg lg:text-xl">
                  RWSドリブル塾のYouTube動画
                </p>
              </div>
              <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
                <LazyYouTube
                  videoId="DQAt2JC6UsY"
                  title="RWSドリブル塾 動画 1"
                  className="w-full"
                  width={560}
                  height={315}
                />
                <LazyYouTube
                  videoId="f1KGe6Ej5Sw"
                  title="RWSドリブル塾 動画 2"
                  className="w-full"
                  width={560}
                  height={315}
                />
                <LazyYouTube
                  videoId="_-et071EvuE"
                  title="RWSドリブル塾 動画 3"
                  className="w-full"
                  width={560}
                  height={315}
                />
              </div>
            </div>
          </section>

          {/* Present セクション */}
          <section
            id="videos"
            className="py-12 sm:py-16 lg:py-20 bg-gray-50"
            style={{ scrollMarginTop: "3rem" }}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl mx-auto">
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-xl">
                  <CardContent className="p-8 text-center space-y-6">
                    <h3 className="text-2xl font-bold mb-4 text-red-600 flex items-center justify-center">
                      ‼️全コーチプレゼント‼️
                    </h3>
                    <div className="text-xl font-semibold text-yellow-600">
                      ⭐️無料で自主練動画27個⭐️
                    </div>
                    <div className="text-gray-700 leading-relaxed text-base sm:text-lg space-y-2">
                      <p>
                        この度、YouTubeチャンネル登録、
                        <br />
                        公式LINEを追加された
                        <br />
                        お客様になんと…
                      </p>
                      <p className="font-bold text-lg text-blue-700">
                        RWS全コーチから完全無料で、
                        <br />
                        27個の自主練動画をプレゼント‼️
                      </p>
                      <p className="mt-6 font-semibold">
                        □公式LINEアカウント↓↓□
                      </p>
                      <p className="text-sm text-gray-600">
                        ID検索の場合は@マークを
                        <br />
                        忘れずにしてください！
                      </p>
                      <div className="mt-4">
                        <div className="font-bold text-base">
                          ⚫︎神奈川支部の公式LINE↓
                        </div>
                        <div className="text-sm">
                          ID→<span className="font-mono">@rws.kanagawa</span>
                        </div>
                        <div className="text-sm">
                          URL→{" "}
                          <a
                            href="https://lin.ee/x1gvg8e"
                            className="text-blue-600 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            https://lin.ee/x1gvg8e
                          </a>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* SNS セクション */}
          <section
            id="sns"
            className="py-12 sm:py-16 lg:py-20 bg-white"
            style={{ scrollMarginTop: "3rem" }}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4">
                  SNS・公式アカウント
                </h2>
                <p className="text-gray-600 text-base sm:text-lg lg:text-xl">
                  最新情報やお問合せはSNSから！
                </p>
              </div>
              <div className="flex justify-center items-center">
                <a
                  href="https://lin.ee/x1gvg8e"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center group"
                >
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mb-2 group-hover:scale-110 transition-transform"
                  >
                    <rect width="48" height="48" rx="12" fill="#06C755" />
                    <path
                      d="M24 10C15.16 10 8 15.82 8 22.5c0 4.1 2.98 7.7 7.5 9.7-.32 1.1-1.1 3.7-1.24 4.26-.2.8.3.8.62.58.25-.17 3.98-2.62 5.6-3.7.84.12 1.7.18 2.52.18 8.84 0 16-5.82 16-12.5S32.84 10 24 10z"
                      fill="#fff"
                    />
                  </svg>
                  <span className="text-lg font-semibold">LINE</span>
                </a>
              </div>
            </div>
          </section>
        </main>

        {/* フッター */}
        <Footer />
      </div>
    </>
  );
}
