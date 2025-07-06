"use client";

import React, { useState, useCallback } from "react";
import { Search, X, Filter, SortAsc, SortDesc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useSearchDebounce } from "@/hooks/useDebounce";
import type { PostSearchParams } from "@/types/post";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (params: PostSearchParams) => Promise<void>;
  placeholder?: string;
  showStatusFilter?: boolean;
  showSortOptions?: boolean;
  defaultParams?: Partial<PostSearchParams>;
  className?: string;
}

export function SearchBar({
  onSearch,
  placeholder = "記事を検索...",
  showStatusFilter = false,
  showSortOptions = true,
  defaultParams = {},
  className,
}: SearchBarProps) {
  const [searchParams, setSearchParams] = useState<PostSearchParams>({
    search: "",
    status: "all",
    sort: "created_at",
    order: "desc",
    page: 1,
    limit: 10,
    ...defaultParams,
  });

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // デバウンス付き検索
  const { query, isSearching, error, setQuery, clearSearch } =
    useSearchDebounce(
      useCallback(
        async (searchQuery: string) => {
          const newParams = { ...searchParams, search: searchQuery, page: 1 };
          setSearchParams(newParams);
          await onSearch(newParams);
        },
        [searchParams, onSearch],
      ),
      300,
    );

  // パラメータ更新
  const updateSearchParams = useCallback(
    async (updates: Partial<PostSearchParams>) => {
      const newParams = { ...searchParams, ...updates, page: 1 };
      setSearchParams(newParams);
      await onSearch(newParams);
    },
    [searchParams, onSearch],
  );

  // 検索クリア
  const handleClearSearch = useCallback(() => {
    const clearedParams = {
      search: "",
      status: "all" as const,
      sort: "created_at" as const,
      order: "desc" as const,
      page: 1,
      limit: 10,
    };
    setSearchParams(clearedParams);
    setQuery("");
    clearSearch();
    onSearch(clearedParams);
  }, [setQuery, clearSearch, onSearch]);

  // アクティブフィルターの数を計算
  const activeFiltersCount = [
    query && query.trim() !== "",
    showStatusFilter && searchParams.status !== "all",
    searchParams.sort !== "created_at" || searchParams.order !== "desc",
  ].filter(Boolean).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* メイン検索バー */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 検索入力 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuery("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {isSearching && (
            <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
            </div>
          )}
        </div>

        {/* フィルターボタン */}
        <div className="flex items-center space-x-2">
          {/* 詳細フィルター */}
          <DropdownMenu open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                フィルター
                {activeFiltersCount > 0 && (
                  <Badge
                    variant="default"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>フィルターオプション</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* ステータスフィルター */}
              {showStatusFilter && (
                <div className="p-2">
                  <label htmlFor="status-filter" className="text-sm font-medium mb-2 block">
                    ステータス
                  </label>
                  <Select
                    value={searchParams.status}
                    onValueChange={(value) =>
                      updateSearchParams({
                        status: value as "published" | "draft" | "all",
                      })
                    }
                  >
                    <SelectTrigger id="status-filter" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="published">公開済み</SelectItem>
                      <SelectItem value="draft">下書き</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* ソートオプション */}
              {showSortOptions && (
                <>
                  <div className="p-2">
                    <label htmlFor="sort-filter" className="text-sm font-medium mb-2 block">
                      並び順
                    </label>
                    <Select
                      value={searchParams.sort}
                      onValueChange={(value) =>
                        updateSearchParams({
                          sort: value as
                            | "created_at"
                            | "published_at"
                            | "title",
                        })
                      }
                    >
                      <SelectTrigger id="sort-filter" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at">作成日</SelectItem>
                        <SelectItem value="published_at">公開日</SelectItem>
                        <SelectItem value="title">タイトル</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-2">
                    <label htmlFor="order-filter" className="text-sm font-medium mb-2 block">
                      順序
                    </label>
                    <div className="flex space-x-1">
                      <Button
                        variant={
                          searchParams.order === "desc" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => updateSearchParams({ order: "desc" })}
                        className="flex-1"
                      >
                        <SortDesc className="h-3 w-3 mr-1" />
                        降順
                      </Button>
                      <Button
                        variant={
                          searchParams.order === "asc" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => updateSearchParams({ order: "asc" })}
                        className="flex-1"
                      >
                        <SortAsc className="h-3 w-3 mr-1" />
                        昇順
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleClearSearch}>
                <X className="h-4 w-4 mr-2" />
                すべてクリア
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* クリアボタン */}
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearSearch}>
              <X className="h-4 w-4 mr-1" />
              クリア
            </Button>
          )}
        </div>
      </div>

      {/* アクティブフィルター表示 */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {query && query.trim() !== "" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              検索: &quot;{query}&quot;
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuery("")}
                className="h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {showStatusFilter && searchParams.status !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              ステータス:{" "}
              {searchParams.status === "published" ? "公開済み" : "下書き"}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateSearchParams({ status: "all" })}
                className="h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          {(searchParams.sort !== "created_at" ||
            searchParams.order !== "desc") && (
            <Badge variant="secondary" className="flex items-center gap-1">
              並び順: {getSortLabel(searchParams.sort!, searchParams.order!)}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  updateSearchParams({ sort: "created_at", order: "desc" })
                }
                className="h-3 w-3 p-0 hover:bg-transparent"
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* エラー表示 */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          検索中にエラーが発生しました: {error}
        </div>
      )}
    </div>
  );
}

/**
 * シンプルな検索バー（最小機能版）
 */
interface SimpleSearchBarProps {
  onSearch: (query: string) => Promise<void>;
  placeholder?: string;
  className?: string;
}

export function SimpleSearchBar({
  onSearch,
  placeholder = "記事を検索...",
  className,
}: SimpleSearchBarProps) {
  const { query, isSearching, error, setQuery, clearSearch } =
    useSearchDebounce(onSearch, 300);

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
      />
      {query && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSearch}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      {isSearching && (
        <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      )}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-1 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * 検索結果サマリー表示
 */
interface SearchResultsSummaryProps {
  totalResults: number;
  currentQuery?: string;
  isLoading?: boolean;
  className?: string;
}

export function SearchResultsSummary({
  totalResults,
  currentQuery,
  isLoading = false,
  className,
}: SearchResultsSummaryProps) {
  if (isLoading) {
    return (
      <div className={cn("text-sm text-gray-500 animate-pulse", className)}>
        検索中...
      </div>
    );
  }

  return (
    <div className={cn("text-sm text-gray-600", className)}>
      {currentQuery ? (
        <span>
          「<strong>{currentQuery}</strong>」の検索結果:{" "}
          <strong>{totalResults}</strong>件
        </span>
      ) : (
        <span>
          <strong>{totalResults}</strong>件の記事
        </span>
      )}
    </div>
  );
}

// ヘルパー関数
function getSortLabel(sort: string, order: string): string {
  const sortLabels = {
    created_at: "作成日",
    published_at: "公開日",
    title: "タイトル",
  };

  const orderLabel = order === "desc" ? "降順" : "昇順";
  return `${sortLabels[sort as keyof typeof sortLabels]}${orderLabel}`;
}
