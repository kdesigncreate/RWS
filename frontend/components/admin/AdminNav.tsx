"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Plus,
  Search,
  // Settings, // 将来の拡張用にコメントアウト
  // BarChart3, // 将来の拡張用にコメントアウト
  // Users, // 将来の拡張用にコメントアウト
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  external?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface AdminNavProps {
  onItemClick?: () => void;
  className?: string;
}

export function AdminNav({ onItemClick, className }: AdminNavProps) {
  const pathname = usePathname();

  const navigationSections: NavSection[] = [
    {
      title: "メイン",
      items: [
        {
          href: "/admin/dashboard",
          label: "ダッシュボード",
          icon: LayoutDashboard,
        },
        {
          href: "/",
          label: "サイトを表示",
          icon: Home,
          external: true,
        },
      ],
    },
    {
      title: "記事管理",
      items: [
        {
          href: "/admin/dashboard",
          label: "記事一覧",
          icon: FileText,
        },
        {
          href: "/admin/dashboard/info/new",
          label: "新規作成",
          icon: Plus,
        },
      ],
    },
    {
      title: "ツール",
      items: [
        {
          href: "/admin/dashboard?tab=search",
          label: "記事検索",
          icon: Search,
        },
      ],
    },
  ];

  const isActiveLink = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin/dashboard";
    }
    return pathname.startsWith(href);
  };

  const handleItemClick = () => {
    onItemClick?.();
  };

  return (
    <nav className={cn("p-4 space-y-6", className)}>
      {navigationSections.map((section, sectionIndex) => (
        <div key={sectionIndex}>
          {section.title && (
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {section.title}
            </h3>
          )}

          <div className="space-y-1">
            {section.items.map((item) => {
              const isActive = isActiveLink(item.href);
              const IconComponent = item.icon;

              const linkContent = (
                <div
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                    isActive
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                  )}
                >
                  <IconComponent
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0",
                      isActive ? "text-blue-500" : "text-gray-400",
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className="ml-2 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
              );

              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleItemClick}
                    className="block"
                  >
                    {linkContent}
                  </a>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleItemClick}
                  className="block"
                >
                  {linkContent}
                </Link>
              );
            })}
          </div>

          {sectionIndex < navigationSections.length - 1 && (
            <Separator className="mt-4" />
          )}
        </div>
      ))}

      {/* フッター情報 */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <div className="px-3 text-xs text-gray-500">
          <p className="mb-2">RWS Blog 管理画面</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </nav>
  );
}

/**
 * コンパクトなナビゲーション（モバイル用）
 */
interface CompactAdminNavProps {
  onItemClick?: () => void;
  className?: string;
}

export function CompactAdminNav({
  onItemClick,
  className,
}: CompactAdminNavProps) {
  const pathname = usePathname();

  const quickActions = [
    {
      href: "/admin/dashboard",
      label: "ダッシュボード",
      icon: LayoutDashboard,
    },
    {
      href: "/admin/dashboard/info/new",
      label: "新規作成",
      icon: Plus,
    },
    {
      href: "/",
      label: "サイト表示",
      icon: Home,
      external: true,
    },
  ];

  const isActiveLink = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === "/admin/dashboard";
    }
    return pathname.startsWith(href);
  };

  const handleItemClick = () => {
    onItemClick?.();
  };

  return (
    <nav className={cn("p-4", className)}>
      <div className="grid grid-cols-1 gap-2">
        {quickActions.map((item) => {
          const isActive = isActiveLink(item.href);
          const IconComponent = item.icon;

          const buttonContent = (
            <Button
              variant={isActive ? "default" : "ghost"}
              className="w-full justify-start"
              size="sm"
            >
              <IconComponent className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          );

          if (item.external) {
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleItemClick}
              >
                {buttonContent}
              </a>
            );
          }

          return (
            <Link key={item.href} href={item.href} onClick={handleItemClick}>
              {buttonContent}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * ブレッドクラム付きナビゲーション
 */
interface BreadcrumbItem {
  href?: string;
  label: string;
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function AdminBreadcrumb({ items, className }: AdminBreadcrumbProps) {
  return (
    <nav
      className={cn(
        "flex items-center space-x-2 text-sm text-gray-500",
        className,
      )}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-gray-700 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
          {index < items.length - 1 && <span className="text-gray-300">/</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}
