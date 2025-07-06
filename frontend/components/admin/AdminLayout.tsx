"use client";

import React, { useState } from "react";
import { AdminHeader } from "@/components/common/Header";
import { SimpleFooter } from "@/components/common/Footer";
import { AdminNav } from "@/components/admin/AdminNav";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorDisplay } from "@/components/common/ErrorDisplay";
import { withAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader title={title} onMenuClick={() => setSidebarOpen(true)} />
        <LoadingSpinner fullScreen text="読み込み中..." className="pt-16" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader title={title} onMenuClick={() => setSidebarOpen(true)} />
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
      <AdminHeader title={title} onMenuClick={() => setSidebarOpen(true)} />

      {/* メインコンテンツ */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        {/* サイドバー */}
        {sidebar && (
          <>
            {/* デスクトップサイドバー */}
            <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-full">
              <div className="sticky top-16">
                <AdminNav />
              </div>
            </aside>

            {/* モバイルサイドバー */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetContent side="left" className="w-64 p-0">
                <div className="pt-6">
                  <AdminNav />
                </div>
              </SheetContent>
            </Sheet>
          </>
        )}

        {/* コンテンツエリア */}
        <main className={cn("flex-1 p-4", sidebar ? "lg:ml-0" : "", className)}>
          <div className="w-full">{children}</div>
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
        <AdminHeader title={title} onMenuClick={() => setSidebarOpen(true)} />
        <LoadingSpinner fullScreen text="読み込み中..." className="pt-16" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader title={title} onMenuClick={() => setSidebarOpen(true)} />
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
      <AdminHeader title={title} onMenuClick={() => setSidebarOpen(true)} />

      {/* モバイルサイドバーオーバーレイ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75" />
        </div>
      )}

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        {/* サイドバー */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:static lg:inset-0 lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            "hidden lg:block"
          )}
        >
          <div className="sticky top-16 pt-16 lg:pt-0">
            <AdminNav onItemClick={() => setSidebarOpen(false)} />
          </div>
        </aside>

        {/* メインコンテンツ */}
        <main className={cn("flex-1 p-6 w-full", className)}>
          <div className="w-full">{children}</div>
        </main>
      </div>

      {/* フッター */}
      <SimpleFooter />
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
