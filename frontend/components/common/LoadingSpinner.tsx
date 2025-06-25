import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export function LoadingSpinner({ 
  size = 'md', 
  className, 
  text, 
  fullScreen = false 
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn(
      'flex items-center justify-center',
      fullScreen && 'min-h-screen',
      className
    )}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={cn(
          'animate-spin text-gray-600',
          sizeClasses[size]
        )} />
        {text && (
          <p className="text-sm text-gray-600 animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  );

  return spinner;
}

/**
 * インライン用の小さなスピナー
 */
interface InlineSpinnerProps {
  className?: string;
}

export function InlineSpinner({ className }: InlineSpinnerProps) {
  return (
    <Loader2 className={cn(
      'h-4 w-4 animate-spin',
      className
    )} />
  );
}

/**
 * ボタン内で使用するスピナー
 */
export function ButtonSpinner() {
  return <Loader2 className="h-4 w-4 animate-spin mr-2" />;
}

/**
 * カード型のローディング表示
 */
interface LoadingCardProps {
  className?: string;
  title?: string;
  description?: string;
}

export function LoadingCard({ 
  className, 
  title = '読み込み中...', 
  description 
}: LoadingCardProps) {
  return (
    <div className={cn(
      'border border-gray-200 rounded-lg p-6 bg-white shadow-sm',
      className
    )}>
      <div className="flex items-center justify-center mb-4">
        <LoadingSpinner size="lg" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-600">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * リスト項目のスケルトンローディング
 */
interface SkeletonItemProps {
  className?: string;
}

export function SkeletonItem({ className }: SkeletonItemProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="flex space-x-4">
        <div className="rounded bg-gray-300 h-12 w-12"></div>
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * 記事カード用のスケルトンローディング
 */
export function PostCardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm animate-pulse">
      <div className="space-y-4">
        {/* タイトル */}
        <div className="h-6 bg-gray-300 rounded w-3/4"></div>
        
        {/* 抜粋 */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
        
        {/* メタ情報 */}
        <div className="flex justify-between items-center pt-4">
          <div className="h-3 bg-gray-300 rounded w-24"></div>
          <div className="h-3 bg-gray-300 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * テーブル行用のスケルトンローディング
 */
export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-300 rounded w-16"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-300 rounded w-20"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-300 rounded w-12"></div>
      </td>
    </tr>
  );
}