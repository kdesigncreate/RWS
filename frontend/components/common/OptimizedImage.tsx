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

  // エラー時のフォールバック画像
  const fallbackSrc = "/images/placeholder.jpg";

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
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
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
      src={imageError ? fallbackSrc : src}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      style={imageStyle}
    />
  );
}

// プリセット付きの最適化画像コンポーネント
interface AvatarImageProps
  extends Omit<OptimizedImageProps, "width" | "height" | "aspectRatio"> {
  size?: "sm" | "md" | "lg" | "xl";
}

export function AvatarImage({
  size = "md",
  className = "",
  ...props
}: AvatarImageProps) {
  const sizeMap = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 },
  };

  const { width, height } = sizeMap[size];

  return (
    <OptimizedImage
      {...props}
      width={width}
      height={height}
      className={`rounded-full ${className}`}
      aspectRatio="1/1"
      objectFit="cover"
    />
  );
}

interface HeroImageProps
  extends Omit<OptimizedImageProps, "aspectRatio" | "objectFit"> {
  variant?: "wide" | "standard" | "square";
}

export function HeroImage({
  variant = "wide",
  priority = true,
  ...props
}: HeroImageProps) {
  const aspectRatioMap = {
    wide: "16/9",
    standard: "4/3",
    square: "1/1",
  };

  return (
    <OptimizedImage
      {...props}
      aspectRatio={aspectRatioMap[variant]}
      objectFit="cover"
      priority={priority}
      sizes="100vw"
      quality={90}
    />
  );
}

interface ThumbnailImageProps
  extends Omit<OptimizedImageProps, "aspectRatio" | "objectFit"> {
  variant?: "square" | "landscape" | "portrait";
}

export function ThumbnailImage({
  variant = "landscape",
  ...props
}: ThumbnailImageProps) {
  const aspectRatioMap = {
    square: "1/1",
    landscape: "4/3",
    portrait: "3/4",
  };

  return (
    <OptimizedImage
      {...props}
      aspectRatio={aspectRatioMap[variant]}
      objectFit="cover"
      sizes="(max-width: 768px) 50vw, 33vw"
    />
  );
}

// WebP対応チェック付きの画像コンポーネント
interface WebPImageProps extends OptimizedImageProps {
  webpSrc?: string;
  fallbackSrc?: string;
}

export function WebPImage({
  src,
  webpSrc,
  fallbackSrc,
  alt,
  ...props
}: WebPImageProps) {
  const [supportsWebP, setSupportsWebP] = useState<boolean | null>(null);

  React.useEffect(() => {
    // WebP対応チェック
    const checkWebPSupport = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const dataURL = canvas.toDataURL("image/webp");
      setSupportsWebP(dataURL.indexOf("data:image/webp") === 0);
    };

    checkWebPSupport();
  }, []);

  if (supportsWebP === null) {
    // WebP対応チェック中
    return (
      <div className="bg-gray-200 animate-pulse flex items-center justify-center">
        <div className="text-gray-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  const imageSrc = supportsWebP && webpSrc ? webpSrc : fallbackSrc || src;

  return <OptimizedImage src={imageSrc} alt={alt} {...props} />;
}

// 画像ギャラリー用の最適化コンポーネント
interface GalleryImageProps extends OptimizedImageProps {
  lightbox?: boolean;
  onLightboxOpen?: (src: string) => void;
}

export function GalleryImage({
  lightbox = false,
  onLightboxOpen,
  className = "",
  ...props
}: GalleryImageProps) {
  const handleClick = () => {
    if (lightbox && onLightboxOpen) {
      onLightboxOpen(props.src);
    }
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-lg ${
        lightbox ? "cursor-pointer" : ""
      } ${className}`}
      onClick={handleClick}
    >
      <OptimizedImage
        {...props}
        className="transition-transform duration-300 group-hover:scale-105"
        objectFit="cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />

      {lightbox && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
