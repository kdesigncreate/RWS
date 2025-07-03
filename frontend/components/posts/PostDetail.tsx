'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Calendar, Edit, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Post } from '@/types/post';
import { formatDate, stringUtils } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PostDetailProps {
  post: Post;
  showEditButton?: boolean;
  onEdit?: (post: Post) => void;
  className?: string;
}

export function PostDetail({
  post,
  showEditButton = false,
  onEdit,
  className,
}: PostDetailProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || stringUtils.stripHtml(post.content).slice(0, 160),
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
    }
  };

  return (
    <article className={cn('mx-auto max-w-4xl', className)}>
      {/* ヘッダー部分 */}
      <header className="mb-8">
        {/* ナビゲーション */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              記事一覧に戻る
            </Link>
          </Button>
        </div>

        {/* ステータス */}
        <div className="flex items-center justify-between mb-4">
          <Badge variant={post.is_published ? 'default' : 'secondary'}>
            {post.status_label}
          </Badge>
          
          <div className="flex items-center space-x-2">
            {showEditButton && onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(post)}>
                <Edit className="h-4 w-4 mr-2" />
                編集
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              共有
            </Button>
          </div>
        </div>

        {/* タイトル */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
          {post.title}
        </h1>

        {/* 抜粋（存在する場合） */}
        {post.excerpt && (
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            {post.excerpt}
          </p>
        )}

        {/* メタ情報 */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
          {post.author && (
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              <span>{post.author.name}</span>
            </div>
          )}
          
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              {post.published_at 
                ? formatDate.toJapaneseDateTime(post.published_at)
                : formatDate.toJapaneseDateTime(post.created_at)
              }
            </span>
          </div>
          

          
          {post.updated_at !== post.created_at && (
            <div className="flex items-center text-xs">
              <span>
                更新: {formatDate.toJapanese(post.updated_at)}
              </span>
            </div>
          )}
        </div>

        <Separator />
      </header>

      {/* 本文 */}
      <div className="prose prose-lg max-w-none mb-8">
        <div 
          className="prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900"
          dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
        />
      </div>

      {/* フッター */}
      <footer className="border-t pt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* 記事情報 */}
          <div className="text-sm text-gray-500">
            {post.published_at && (
              <p>
                公開日: {formatDate.toJapanese(post.published_at)}
              </p>
            )}
          </div>

          {/* アクション */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              この記事を共有
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                記事一覧
              </Link>
            </Button>
          </div>
        </div>
      </footer>
    </article>
  );
}

/**
 * 本文コンテンツのフォーマット
 */
function formatContent(content: string): string {
  // 改行をpタグに変換
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  return paragraphs
    .map(paragraph => {
      const trimmed = paragraph.trim();
      
      // 既にHTMLタグで囲まれている場合はそのまま
      if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
        return trimmed;
      }
      
      // 改行をbrタグに変換してpタグで囲む
      const withBreaks = trimmed.replace(/\n/g, '<br>');
      return `<p>${withBreaks}</p>`;
    })
    .join('\n');
}

/**
 * シンプルな記事詳細表示（埋め込み用）
 */
interface PostDetailSimpleProps {
  post: Post;
  showMeta?: boolean;
  className?: string;
}

export function PostDetailSimple({
  post,
  showMeta = true,
  className,
}: PostDetailSimpleProps) {
  return (
    <article className={cn('space-y-4', className)}>
      <header>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {post.title}
        </h2>
        
        {showMeta && (
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
            <Badge variant={post.is_published ? 'default' : 'secondary'} className="text-xs">
              {post.status_label}
            </Badge>
            
            {post.author && (
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
        )}
      </header>

      <div className="prose max-w-none">
        <div 
          className="prose-p:text-gray-700 prose-headings:text-gray-900"
          dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
        />
      </div>
    </article>
  );
}