'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Settings, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

/**
 * シンプルなフッターコンポーネント
 */
export function SimpleFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center text-sm text-gray-500">
          <p>&copy; 2024 RWS Blog. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.push('/');
    }
  };

  return (
    <header className={`border-b bg-white shadow-sm ${className || ''}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* ロゴ・サイトタイトル */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
            >
              RWS Blog
            </Link>
          </div>

          {/* ナビゲーション */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-gray-700 hover:text-gray-900 transition-colors"
            >
              ホーム
            </Link>
            {/* 将来的にカテゴリやその他のナビゲーションを追加予定 */}
          </nav>

          {/* 認証関連メニュー */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {/* 管理画面へのリンク */}
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hidden sm:inline-flex"
                >
                  <Link href="/admin/dashboard">
                    <Settings className="h-4 w-4 mr-1" />
                    管理画面
                  </Link>
                </Button>

                {/* ユーザーメニュー */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <User className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">{user?.name || 'ユーザー'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      {user?.email}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="sm:hidden">
                      <Link href="/admin/dashboard">
                        <Settings className="h-4 w-4 mr-2" />
                        管理画面
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      ログアウト
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link href="/admin">
                  <User className="h-4 w-4 mr-1" />
                  ログイン
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * 管理画面用のヘッダー
 */
interface AdminHeaderProps {
  title?: string;
  className?: string;
}

export function AdminHeader({ title = '管理画面', className }: AdminHeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.push('/');
    }
  };

  return (
    <header className={`border-b bg-white shadow-sm ${className || ''}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* タイトルとパンくずリスト */}
          <div className="flex items-center space-x-4">
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
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
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

interface FooterProps {
  navigationItems?: Array<{ href: string; label: string }>;
}

export function Footer({ navigationItems = [] }: FooterProps) {
  const defaultNavigationItems = [
    { href: '#', label: 'Top' },
    { href: '#posts', label: 'Posts' },
    { href: '#about', label: 'About' },
    { href: '#staff', label: 'Staff' },
    { href: '#price', label: 'Price' },
    { href: '#schoolList', label: 'School List' },
  ];

  const items = navigationItems.length > 0 ? navigationItems : defaultNavigationItems;

  return (
    <footer className="bg-black text-white py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">R.W.S ドリブル塾</h3>
          <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">サッカーのドリブル技術向上を目的としたスクール</p>
        </div>
        <Separator className="bg-gray-800 mb-6 sm:mb-8" />
        <ul className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          {items.map((item) => (
            <li key={item.label}>
              <a 
                href={item.href} 
                className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-gray-500 text-xs sm:text-sm">
          Copyright &copy;2024 R.W.Sドリブル塾, All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}