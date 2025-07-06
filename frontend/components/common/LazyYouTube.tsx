"use client";

import { useState } from "react";
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

  const handleLoad = () => {
    console.log('YouTube video loading:', videoId, title);
    setIsLoaded(true);
  };

  const aspectRatio = (height / width) * 100;

  return (
    <div 
      className={`relative overflow-hidden rounded-lg shadow-lg ${className}`}
      style={{ paddingBottom: `${aspectRatio}%` }}
    >
      {!isLoaded ? (
        <div className="absolute inset-0">
          <img
            src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
            }}
          />
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
      ) : (
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : 'https://rws-ruddy.vercel.app'}`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </div>
  );
}