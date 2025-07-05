"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // データを5分間キャッシュ
            staleTime: 5 * 60 * 1000,
            // バックグラウンドで1分間キャッシュ
            gcTime: 10 * 60 * 1000,
            // ネットワークエラー時のリトライ設定
            retry: (failureCount, error: any) => {
              // 401, 403, 404の場合はリトライしない
              if (error?.response?.status === 401 || 
                  error?.response?.status === 403 || 
                  error?.response?.status === 404) {
                return false;
              }
              // その他のエラーは最大2回リトライ
              return failureCount < 2;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // 窓がフォーカスされた時の自動refetch
            refetchOnWindowFocus: false,
            // ネットワーク再接続時の自動refetch
            refetchOnReconnect: true,
          },
          mutations: {
            // ミューテーションのリトライ設定
            retry: (failureCount, error: any) => {
              // 400番台のエラーはリトライしない
              if (error?.response?.status >= 400 && error?.response?.status < 500) {
                return false;
              }
              return failureCount < 1;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools 
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  );
}