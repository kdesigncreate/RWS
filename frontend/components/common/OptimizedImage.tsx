"use client";

import React, { useState } from "react";
import Image from "next/image";
import { LazyImage } from "@/components/common/LazyLoadWrapper";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  // カスタムプロパティ
  lazy?: boolean;
  responsive?: boolean;
  aspectRatio?: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  placeholder = "empty",
  blurDataURL,
  sizes,
  quality = 80,
  fill = false,
  style,
  onLoad,
  onError,
  lazy = true,
  responsive = true,
  aspectRatio,
  objectFit = "cover",
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  // WebP自動変換と最適化
  const getOptimizedSrc = (originalSrc: string): string => {
    if (imageError) return "/images/placeholder.jpg";
    
    // Supabase Storageの画像の場合は自動最適化
    if (originalSrc.includes('supabase')) {
      const url = new URL(originalSrc);
      url.searchParams.set('format', 'webp');
      url.searchParams.set('quality', quality.toString());
      if (width) url.searchParams.set('width', width.toString());
      if (height) url.searchParams.set('height', height.toString());
      return url.toString();
    }
    
    return originalSrc;
  };

  const optimizedSrc = getOptimizedSrc(src);

  // 低品質プレースホルダーの生成
  const generateBlurDataURL = (): string => {
    if (blurDataURL) return blurDataURL;
    
    // 10x10のシンプルなSVGプレースホルダー
    const svg = `
      <svg width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  // レスポンシブ対応のsizes設定
  const responsiveSizes =
    responsive && !sizes
      ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      : sizes;

  // アスペクト比の計算
  const aspectRatioStyle = aspectRatio
    ? { aspectRatio }
    : width && height
      ? { aspectRatio: `${width}/${height}` }
      : {};

  const imageStyle: React.CSSProperties = {
    objectFit,
    ...aspectRatioStyle,
    ...style,
  };

  // Next.js Imageコンポーネント使用（最適化）
  if (!lazy && !imageError) {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={aspectRatioStyle}
      >
        <Image
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          priority={priority}
          placeholder={placeholder === "blur" ? "blur" : "empty"}
          blurDataURL={placeholder === "blur" ? generateBlurDataURL() : undefined}
          sizes={responsiveSizes}
          quality={quality}
          fill={fill}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
        />

        {/* ローディング状態 */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="text-gray-400 text-sm">読み込み中...</div>
          </div>
        )}
      </div>
    );
  }

  // 遅延読み込みまたはエラー時はカスタムLazyImageを使用
  return (
    <LazyImage
      src={optimizedSrc}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      style={imageStyle}
    />
  );
}

