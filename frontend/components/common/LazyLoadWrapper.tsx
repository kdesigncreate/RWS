"use client";

import React, { Suspense } from "react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { SectionErrorBoundary } from "@/components/common/ErrorBoundary";
import Image from "next/image";

// 汎用的なLazy Loading ラッパー
interface LazyLoadWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

export function LazyLoadWrapper({
  children,
  fallback = <LoadingSpinner />,
  errorFallback: _errorFallback,
}: LazyLoadWrapperProps) {
  return (
    <SectionErrorBoundary>
      <Suspense fallback={fallback}>{children}</Suspense>
    </SectionErrorBoundary>
  );
}

// コンポーネント用のLazy Loading ヘルパー（将来の拡張用に保持）
/*
export function createLazyComponent<T extends ComponentType<Record<string, unknown>>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);
  
  const LazyWrappedComponent: React.FC<React.ComponentProps<T>> = (props) => (
    <LazyLoadWrapper fallback={fallback}>
      <LazyComponent {...(props as React.ComponentProps<T>)} />
    </LazyLoadWrapper>
  );

  const componentRef = LazyComponent as unknown as { displayName?: string; name?: string };
  LazyWrappedComponent.displayName = `LazyWrapped(${componentRef.displayName || componentRef.name || 'Component'})`;
  
  return LazyWrappedComponent;
}
*/

// セクション用のLazy Loading（視覚的に重要でない部分用）
interface LazySectionProps {
  children: React.ReactNode;
  height?: number | string;
  className?: string;
}

export function LazySection({
  children,
  height = 200,
  className = "",
}: LazySectionProps) {
  const defaultPlaceholder = (
    <div
      className={`flex items-center justify-center bg-gray-50 ${className}`}
      style={{ height }}
    >
      <LoadingSpinner />
    </div>
  );

  return (
    <LazyLoadWrapper fallback={defaultPlaceholder}>{children}</LazyLoadWrapper>
  );
}

// Intersection Observer を使った遅延読み込み
interface IntersectionLazyLoadProps {
  children: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  fallback?: React.ReactNode;
  className?: string;
}

export function IntersectionLazyLoad({
  children,
  rootMargin = "50px",
  threshold = 0.1,
  fallback = <LoadingSpinner />,
  className = "",
}: IntersectionLazyLoadProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold,
      },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : fallback}
    </div>
  );
}

// 画像用の遅延読み込み
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  placeholder: _placeholder = "/images/placeholder.jpg",
  blurDataURL,
  className = "",
  onLoad,
  onError,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const imgRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "50px" },
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // width/heightはImageに渡さない（Next.js Imageは自動でfillを使用）
  const { width, height, ...rest } = props;
  // widthとheightは除外（Next.js Imageはfillを使用）
  void width;
  void height;

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* プレースホルダー */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {blurDataURL ? (
            <Image
              src={blurDataURL}
              alt=""
              fill
              className="w-full h-full object-cover filter blur-sm scale-110"
            />
          ) : (
            <div className="text-gray-400 text-sm">読み込み中...</div>
          )}
        </div>
      )}

      {/* エラー時の表示 */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-sm text-center">
            <div>画像を読み込めませんでした</div>
          </div>
        </div>
      )}

      {/* 実際の画像 */}
      {isVisible && (
        <Image
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          fill
          className={`transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          {...rest}
        />
      )}
    </div>
  );
}

// データ用の遅延読み込み（無限スクロール等で使用）
interface LazyDataLoaderProps<T> {
  loadData: () => Promise<T>;
  render: (data: T) => React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: (error: Error) => React.ReactNode;
  dependencies?: React.DependencyList;
}

export function LazyDataLoader<T>({
  loadData,
  render,
  fallback = <LoadingSpinner />,
  errorFallback,
  dependencies = [],
}: LazyDataLoaderProps<T>) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await loadData();

        if (!isCancelled) {
          setData(result);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadData, ...dependencies]);

  if (loading) return <>{fallback}</>;
  if (error)
    return (
      <>
        {errorFallback ? errorFallback(error) : <div>エラーが発生しました</div>}
      </>
    );
  if (data === null) return <>{fallback}</>;

  return <>{render(data)}</>;
}

// モーダル用の遅延読み込み
interface LazyModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function LazyModal({
  isOpen,
  onClose,
  children,
  className = "",
}: LazyModalProps) {
  if (!isOpen) return null;

  return (
    <LazyLoadWrapper>
      <div className={`fixed inset-0 z-50 ${className}`}>
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          {children}
        </div>
      </div>
    </LazyLoadWrapper>
  );
}
