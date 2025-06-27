'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Settings, User, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface HeaderProps {
  navigationItems?: Array<{ href: string; label: string }>;
}

export function Header({ navigationItems = [] }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const defaultNavigationItems = [
    { href: '/', label: 'Top' },
    { href: '/#posts', label: 'Posts' },
    { href: '/#about', label: 'About' },
    { href: '/#staff', label: 'Staff' },
    { href: '/#price', label: 'Price' },
    { href: '/#schoolList', label: 'School List' },
  ];

  const items = navigationItems.length > 0 ? navigationItems : defaultNavigationItems;

  const Navigation = ({ mobile = false }: { mobile?: boolean }) => (
    <ul className={`${mobile ? 'flex flex-col space-y-8' : 'hidden lg:flex space-x-8 xl:space-x-12'}`}>
      {items.map((item) => (
        <li key={item.label}>
          <button
            onClick={() => {
              if (mobile) setIsOpen(false);
              if (item.href.startsWith('/#')) {
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
    <nav className="bg-black text-white py-3 sm:py-4 fixed top-0 left-0 right-0 z-50 border-b border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1>
            <Link href="/" className="text-lg sm:text-xl lg:text-2xl font-bold tracking-wider">
              <Image 
                src="/images/logo_black_removebg.png" 
                alt="R.W.S ドリブル塾" 
                width={192}
                height={48}
                className="h-8 sm:h-10 lg:h-12 w-auto"
                priority
              />
            </Link>
          </h1>
          
          {/* デスクトップナビゲーション */}
          <div className="hidden lg:flex items-center space-x-8">
            <Navigation />
            <Button className="bg-white text-black hover:bg-gray-100 border-0 px-6 lg:px-8 py-2 font-medium transition-all duration-300">
              Contact
            </Button>
          </div>

          {/* モバイルメニューボタン */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="icon" className="bg-transparent border-white text-white hover:bg-white/10">
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-black text-white border-gray-800 w-72 sm:w-80">
              <div className="mt-12">
                <Navigation mobile />
                <div className="mt-12">
                  <Button className="w-full bg-white text-black hover:bg-gray-100 font-medium">
                    Contact
                  </Button>
                </div>
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