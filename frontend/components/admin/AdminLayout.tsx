"use client";

import React from "react";
import { AdminHeader } from "@/components/common/Header";
import { SimpleFooter } from "@/components/common/Footer";
import { AdminNav } from "@/components/admin/AdminNav";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { withAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  sidebar?: boolean;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

function AdminLayoutComponent({
  children,
  title = "管理画面",
  sidebar = true,
  loading = false,
  error = null,
  className,
}: AdminLayoutProps) {
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader title={title} />
        <LoadingSpinner fullScreen text="読み込み中..." className="pt-16" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader title={title} />
        <div className="pt-16">
          <ErrorDisplay
            title="エラーが発生しました"
            message={error}
            variant="page"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <AdminHeader title={title} />

      {/* メインコンテンツ */}
      <div className="flex">
        {/* サイドバー */}
        {sidebar && (
          <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-screen">
            <div className="sticky top-16">
              <AdminNav />
            </div>
          </aside>
        )}

        {/* コンテンツエリア */}
        <main className={cn("flex-1 p-6", sidebar ? "lg:ml-0" : "", className)}>
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* フッター */}
      <SimpleFooter />
    </div>
  );
}

// withAuth HOCでラップしてエクスポート
export const AdminLayout = withAuth(AdminLayoutComponent);

/**
 * モバイル対応のサイドバー付きレイアウト
 */
interface AdminLayoutWithMobileSidebarProps extends AdminLayoutProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

function AdminLayoutWithMobileSidebarComponent({
  children,
  title = "管理画面",
  sidebarOpen,
  setSidebarOpen,
  loading = false,
  error = null,
  className,
}: AdminLayoutWithMobileSidebarProps) {
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader title={title} />
        <LoadingSpinner fullScreen text="読み込み中..." className="pt-16" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader title={title} />
        <div className="pt-16">
          <ErrorDisplay
            title="エラーが発生しました"
            message={error}
            variant="page"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <AdminHeader title={title} />

      {/* モバイルサイドバーオーバーレイ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75" />
        </div>
      )}

      {/* サイドバー */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="sticky top-16 pt-16 lg:pt-0">
          <AdminNav onItemClick={() => setSidebarOpen(false)} />
        </div>
      </aside>

      {/* メインコンテンツ */}
      <div className="lg:pl-64">
        <main className={cn("p-6", className)}>
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* フッター */}
      <div className="lg:pl-64">
        <SimpleFooter />
      </div>
    </div>
  );
}

export const AdminLayoutWithMobileSidebar = withAuth(
  AdminLayoutWithMobileSidebarComponent,
);

/**
 * シンプルなページレイアウト（サイドバーなし）
 */
interface SimpleAdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  centered?: boolean;
  className?: string;
}

function SimpleAdminLayoutComponent({
  children,
  title = "管理画面",
  maxWidth = "lg",
  centered = false,
  className,
}: SimpleAdminLayoutProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader title={title} />

      <main
        className={cn(
          "py-12 px-4 sm:px-6 lg:px-8",
          centered && "flex items-center justify-center min-h-screen pt-0",
        )}
      >
        <div className={cn("mx-auto", maxWidthClasses[maxWidth], className)}>
          {children}
        </div>
      </main>

      <SimpleFooter />
    </div>
  );
}

export const SimpleAdminLayout = withAuth(SimpleAdminLayoutComponent);

/**
 * カード型のレイアウト
 */
interface AdminCardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

export function AdminCardLayout({
  children,
  title,
  description,
  maxWidth = "lg",
  className,
}: AdminCardLayoutProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <div className={cn("mx-auto", maxWidthClasses[maxWidth], className)}>
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        {(title || description) && (
          <div className="px-6 py-4 border-b border-gray-200">
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            )}
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
