"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Settings, User, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

interface HeaderProps {
  navigationItems?: Array<{ href: string; label: string }>;
}

export function Header({ navigationItems = [] }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const defaultNavigationItems = [
    { href: "/", label: "Top" },
    { href: "/#posts", label: "News" },
    { href: "/#about", label: "About" },
    { href: "/#staff", label: "Staff" },
    { href: "/#price", label: "Price" },
    { href: "/#schoolList", label: "School List" },
    { href: "/#videos", label: "Videos" },
  ];

  const items =
    navigationItems.length > 0 ? navigationItems : defaultNavigationItems;

  const Navigation = ({ mobile = false }: { mobile?: boolean }) => (
    <ul
      className={`${mobile ? "flex flex-col space-y-8" : "hidden lg:flex space-x-8 xl:space-x-12"}`}
    >
      {items.map((item) => (
        <li key={item.label}>
          <button
            onClick={() => {
              if (mobile) setIsOpen(false);
              if (item.href.startsWith("/#")) {
                router.push(item.href);
              } else {
                router.push(item.href);
              }
            }}
            className="text-white hover:text-gray-300 transition-all duration-300 text-base lg:text-lg font-medium bg-transparent border-none cursor-pointer"
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <nav className="bg-black text-white py-3 sm:py-4 fixed top-0 left-0 right-0 z-50 border-b border-gray-800 h-16 sm:h-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="flex items-center">
            <Link
              href="/"
              className="text-lg sm:text-xl lg:text-2xl font-bold tracking-wider flex items-center"
            >
              <Image
                src="/images/logo_black_removebg.png"
                alt="R.W.S ドリブル塾"
                width={192}
                height={48}
                className="h-10 sm:h-12 w-auto object-contain"
                priority
              />
            </Link>
          </h1>

          {/* デスクトップナビゲーション */}
          <div className="hidden lg:flex items-center space-x-8">
            <Navigation />
            <div className="flex items-center space-x-4">
              <a
                href="https://lin.ee/x1gvg8e"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LINE"
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="48" height="48" rx="12" fill="#06C755" />
                  <path
                    d="M24 10C15.16 10 8 15.82 8 22.5c0 4.1 2.98 7.7 7.5 9.7-.32 1.1-1.1 3.7-1.24 4.26-.2.8.3.8.62.58.25-.17 3.98-2.62 5.6-3.7.84.12 1.7.18 2.52.18 8.84 0 16-5.82 16-12.5S32.84 10 24 10z"
                    fill="#fff"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* モバイルメニューボタン */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden flex items-center">
              <Button
                variant="ghost"
                className="bg-transparent text-white hover:bg-white/10 h-12 sm:h-14 w-20 p-0 flex items-center justify-center"
                aria-label="メニューを開く"
              >
                <div className="hamburger-menu">
                  <span className="hamburger-line"></span>
                  <span className="hamburger-line"></span>
                  <span className="hamburger-line"></span>
                </div>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-white text-black w-80 flex flex-col px-0 py-0"
            >
              {/* 上部：ロゴ＋カスタムバツ */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <Image
                  src="/images/logo_white_removebg.png"
                  alt="RWS"
                  width={100}
                  height={32}
                />
                <SheetClose asChild>
                  <button
                    aria-label="メニューを閉じる"
                    className="ml-4 text-3xl font-bold text-black hover:text-blue-600 focus:outline-none"
                  >
                    ×
                  </button>
                </SheetClose>
              </div>
              {/* メニュー：左寄せ・太字・ホバーで青下線 */}
              <nav className="flex-1 flex flex-col gap-2 px-6 py-8">
                {items.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setIsOpen(false);
                      if (item.href.startsWith("/#")) {
                        router.push(item.href);
                      } else {
                        router.push(item.href);
                      }
                    }}
                    className="text-lg font-bold py-2 px-2 rounded hover:bg-blue-50 hover:text-blue-700 transition-colors text-left bg-transparent border-none cursor-pointer w-full"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
              {/* SNSアイコン：下部・横並び・大きめ */}
              <div className="flex flex-col items-center justify-center gap-4 border-t py-4">
                <a
                  href="https://lin.ee/x1gvg8e"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LINE"
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="48" height="48" rx="12" fill="#06C755" />
                    <path
                      d="M24 10C15.16 10 8 15.82 8 22.5c0 4.1 2.98 7.7 7.5 9.7-.32 1.1-1.1 3.7-1.24 4.26-.2.8.3.8.62.58.25-.17 3.98-2.62 5.6-3.7.84.12 1.7.18 2.52.18 8.84 0 16-5.82 16-12.5S32.84 10 24 10z"
                      fill="#fff"
                    />
                  </svg>
                </a>
                <p className="text-sm text-gray-600 font-medium">
                  お問い合わせはこちらから
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

/**
 * 管理画面用のヘッダー
 */
interface AdminHeaderProps {
  title?: string;
  className?: string;
  onMenuClick?: () => void;
}

export function AdminHeader({
  title = "管理画面",
  className,
  onMenuClick,
}: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.push("/");
    }
  };

  return (
    <header className={`border-b bg-white shadow-sm ${className || ""}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* タイトルとパンくずリスト */}
          <div className="flex items-center space-x-4">
            {/* モバイルメニューボタン */}
            {onMenuClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMenuClick}
                className="lg:hidden"
                aria-label="メニューを開く"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              サイトトップ
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          </div>

          {/* ユーザー情報とログアウト */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-sm text-gray-600">
              こんにちは、{user?.name}さん
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">メニュー</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm text-gray-500 sm:hidden">
                  {user?.name}
                </div>
                <div className="px-2 py-1.5 text-xs text-gray-400">
                  {user?.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/dashboard">
                    <Settings className="h-4 w-4 mr-2" />
                    ダッシュボード
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
