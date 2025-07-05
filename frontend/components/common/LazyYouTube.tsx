"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

interface LazyYouTubeProps {
  videoId: string;
  title: string;
  className?: string;
  width?: number;
  height?: number;
}

export function LazyYouTube({ 
  videoId, 
  title, 
  className = "", 
  width = 560, 
  height = 315 
}: LazyYouTubeProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  const aspectRatio = (height / width) * 100;

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg shadow-lg ${className}`}
      style={{ paddingBottom: `${aspectRatio}%` }}
    >
      {!isLoaded && (
        <>
          {/* Thumbnail with play button */}
          <div className="absolute inset-0">
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={(e) => {
                // Fallback to default YouTube thumbnail
                const target = e.target as HTMLImageElement;
                target.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
              }}
            />
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-all duration-300">
              <button
                onClick={handleLoad}
                className="w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors duration-300 shadow-lg"
                aria-label={`Play ${title}`}
              >
                <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
              </button>
            </div>
          </div>
          
          {/* Loading skeleton */}
          {isVisible && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse">
              <div className="flex items-center justify-center h-full">
                <div className="w-20 h-20 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          )}
        </>
      )}

      {/* YouTube iframe - only loaded when user clicks play */}
      {isLoaded && isVisible && (
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      )}
    </div>
  );
}