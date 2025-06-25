'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, User, Calendar, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { Post } from '@/types/post';
import { formatDate, stringUtils } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: Post;
  variant?: 'default' | 'compact' | 'featured';
  showAuthor?: boolean;
  showActions?: boolean;
  showStatus?: boolean;
  showReadingTime?: boolean;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  className?: string;
}

export function PostCard({
  post,
  variant = 'default',
  showAuthor = true,
  showActions = false,
  showStatus = true,
  showReadingTime = true,
  onEdit,
  onDelete,
  className,
}: PostCardProps) {
  const isPublished = post.is_published;
  const isDraft = post.is_draft;

  // コンパクト表示
  if (variant === 'compact') {
    return (
      <Card className={cn('hover:shadow-md transition-shadow duration-200', className)}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1.5">
                {showStatus && (
                  <Badge variant={isPublished ? 'default' : 'secondary'}>
                    {post.status_label}
                  </Badge>
                )}
                {showReadingTime && post.meta?.reading_time_minutes && (
                  <span className="text-xs text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    約{post.meta?.reading_time_minutes}分
                  </span>
                )}
              </div>
              
              <Link href={`/info/${post.id}`} className="block group">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm">
                  {post.title}
                </h3>
              </Link>
              
              <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">
                {post.excerpt || stringUtils.stripHtml(post.content)}
              </p>
              
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  {showAuthor && post.author && (
                    <span className="flex items-center">
                      <User className="h-3 w-3 mr-1" />
                      {post.author.name}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate.toJapanese(post.published_at || post.created_at)}
                  </span>
                </div>
                
                {showActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <span className="sr-only">アクション</span>
                        •••
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/info/${post.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          表示
                        </Link>
                      </DropdownMenuItem>
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(post)}>
                          <Edit className="h-4 w-4 mr-2" />
                          編集
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem 
                          onClick={() => onDelete(post)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          削除
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // フィーチャー表示
  if (variant === 'featured') {
    return (
      <Card className={cn(
        'overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200',
        className
      )}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-3">
            {showStatus && (
              <Badge variant={isPublished ? 'default' : 'secondary'} className="text-xs">
                {post.status_label}
              </Badge>
            )}
            {showReadingTime && post.meta?.reading_time_minutes && (
              <span className="text-sm text-gray-600 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                約{post.meta?.reading_time_minutes}分
              </span>
            )}
          </div>
          
          <Link href={`/info/${post.id}`} className="block group">
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
              {post.title}
            </h2>
          </Link>
        </CardHeader>
        
        <CardContent className="pb-4">
          <p className="text-gray-700 leading-relaxed line-clamp-3">
            {post.excerpt || stringUtils.stripHtml(post.content)}
          </p>
        </CardContent>
        
        <CardFooter className="pt-4 border-t bg-white/50">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {showAuthor && post.author && (
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {post.author.name}
                </span>
              )}
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {formatDate.toJapanese(post.published_at || post.created_at)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/info/${post.id}`}>
                  続きを読む
                </Link>
              </Button>
              
              {showActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <span className="sr-only">アクション</span>
                      •••
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(post)}>
                        <Edit className="h-4 w-4 mr-2" />
                        編集
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(post)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        削除
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    );
  }

  // デフォルト表示
  return (
    <Card className={cn(
      'overflow-hidden hover:shadow-md transition-shadow duration-200',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          {showStatus && (
            <Badge variant={isPublished ? 'default' : 'secondary'}>
              {post.status_label}
            </Badge>
          )}
          {showReadingTime && post.meta?.reading_time_minutes && (
            <span className="text-sm text-gray-500 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              約{post.meta?.reading_time_minutes}分
            </span>
          )}
        </div>
        
        <Link href={`/info/${post.id}`} className="block group">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
            {post.title}
          </h3>
        </Link>
      </CardHeader>
      
      <CardContent className="pb-4">
        <p className="text-gray-600 leading-relaxed line-clamp-3">
          {post.excerpt || stringUtils.stripHtml(post.content)}
        </p>
      </CardContent>
      
      <CardFooter className="pt-4 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {showAuthor && post.author && (
              <span className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                {post.author.name}
              </span>
            )}
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate.toJapanese(post.published_at || post.created_at)}
            </span>
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <span className="sr-only">アクション</span>
                  •••
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/info/${post.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    表示
                  </Link>
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(post)}>
                    <Edit className="h-4 w-4 mr-2" />
                    編集
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(post)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    削除
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * 記事カードリスト表示コンポーネント
 */
interface PostCardListProps {
  posts: Post[];
  variant?: 'default' | 'compact' | 'featured';
  showAuthor?: boolean;
  showActions?: boolean;
  showStatus?: boolean;
  showReadingTime?: boolean;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  className?: string;
  emptyMessage?: string;
}

export function PostCardList({
  posts,
  variant = 'default',
  showAuthor = true,
  showActions = false,
  showStatus = true,
  showReadingTime = true,
  onEdit,
  onDelete,
  className,
  emptyMessage = '記事が見つかりませんでした',
}: PostCardListProps) {
  if (posts.length === 0) {
    return (
      <div className={cn(
        'text-center py-12 text-gray-500',
        className
      )}>
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  const gridClasses = {
    default: 'grid gap-6 md:grid-cols-2 lg:grid-cols-3',
    compact: 'space-y-4',
    featured: 'grid gap-8 md:grid-cols-2',
  };

  return (
    <div className={cn(gridClasses[variant], className)}>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          variant={variant}
          showAuthor={showAuthor}
          showActions={showActions}
          showStatus={showStatus}
          showReadingTime={showReadingTime}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}