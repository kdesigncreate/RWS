"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

// HTTP Error response type for better type safety
interface HTTPError {
  response?: {
    status?: number;
  };
}

// Type guard to check if error has response property
function isHTTPError(error: unknown): error is HTTPError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'response' in error &&
    typeof (error as HTTPError).response === 'object'
  );
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
            retry: (failureCount, error: unknown) => {
              // 401, 403, 404の場合はリトライしない
              if (isHTTPError(error)) {
                const status = error.response?.status;
                if (status === 401 || status === 403 || status === 404) {
                  return false;
                }
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
            retry: (failureCount, error: unknown) => {
              // 400番台のエラーはリトライしない
              if (isHTTPError(error)) {
                const status = error.response?.status;
                if (status && status >= 400 && status < 500) {
                  return false;
                }
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