'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  // Calendar, // 将来の拡張用にコメントアウト
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { TableRowSkeleton } from '@/components/common/LoadingSpinner';
import type { 
  // Post, // 将来の拡張用にコメントアウト 
  PostTableProps, 
  PostTableActionsProps, 
  SortableField 
} from '@/types/post';
import { formatDate, stringUtils } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function PostTable({
  posts,
  loading = false,
  selectedPosts = [],
  onSelectionChange,
  onEdit: _onEdit, // 将来の拡張用
  onDelete,
  onView: _onView, // 将来の拡張用
  onSort,
  sortField,
  sortDirection,
  className,
}: PostTableProps) {
  const isAllSelected = posts.length > 0 && selectedPosts.length === posts.length;
  const isPartiallySelected = selectedPosts.length > 0 && selectedPosts.length < posts.length;

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? posts.map(post => post.id) : []);
    }
  };

  const handleSelectPost = (postId: number, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = checked
        ? [...selectedPosts, postId]
        : selectedPosts.filter(id => id !== postId);
      onSelectionChange(newSelection);
    }
  };

  const handleSort = (field: SortableField) => {
    if (!onSort) return;
    
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(field, newDirection);
  };

  const getSortIcon = (field: SortableField) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className={cn('border rounded-lg', className)}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox disabled />
              </TableHead>
              <TableHead>タイトル</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>作成日</TableHead>
              <TableHead>公開日</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRowSkeleton key={index} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={cn(
        'border rounded-lg p-8 text-center text-gray-500',
        className
      )}>
        <p className="text-lg">記事が見つかりませんでした</p>
        <p className="text-sm mt-2">新しい記事を作成してみましょう</p>
      </div>
    );
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                indeterminate={isPartiallySelected}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('title')}
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                タイトル
                {onSort && getSortIcon('title')}
              </Button>
            </TableHead>
            
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('status')}
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                ステータス
                {onSort && getSortIcon('status')}
              </Button>
            </TableHead>
            
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('created_at')}
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                作成日
                {onSort && getSortIcon('created_at')}
              </Button>
            </TableHead>
            
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('published_at')}
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                公開日
                {onSort && getSortIcon('published_at')}
              </Button>
            </TableHead>
            
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {posts.map((post) => (
            <TableRow 
              key={post.id}
              className={cn(
                'hover:bg-gray-50 transition-colors',
                selectedPosts.includes(post.id) && 'bg-blue-50'
              )}
            >
              <TableCell>
                <Checkbox
                  checked={selectedPosts.includes(post.id)}
                  onCheckedChange={(checked) => handleSelectPost(post.id, !!checked)}
                />
              </TableCell>
              
              <TableCell className="max-w-0">
                <div className="space-y-1">
                  <Link
                    href={`/admin/dashboard/info/${post.id}`}
                    className="font-medium text-gray-900 hover:text-blue-600 transition-colors block truncate"
                  >
                    {post.title}
                  </Link>
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 truncate">
                      {stringUtils.stripHtml(post.excerpt)}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    {post.author && (
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {post.author.name}
                      </span>
                    )}

                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <Badge variant={post.is_published ? 'default' : 'secondary'}>
                  {post.status_label}
                </Badge>
              </TableCell>
              
              <TableCell>
                <div className="text-sm">
                  <div>{formatDate.toJapanese(post.created_at)}</div>
                  <div className="text-gray-500 text-xs">
                    {formatDate.toRelative(post.created_at)}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="text-sm">
                  {post.published_at ? (
                    <>
                      <div>{formatDate.toJapanese(post.published_at)}</div>
                      <div className="text-gray-500 text-xs">
                        {formatDate.toRelative(post.published_at)}
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-400">未公開</span>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <span className="sr-only">アクションメニュー</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/info/${post.id}`} target="_blank">
                        <Eye className="h-4 w-4 mr-2" />
                        表示
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/dashboard/info/${post.id}`}>
                        <Edit className="h-4 w-4 mr-2" />
                        管理画面で編集
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(post)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        削除
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * テーブルのバルクアクションバー
 */
export function PostTableActions({
  selectedCount,
  onBulkDelete,
  onBulkPublish,
  onBulkUnpublish,
  onClearSelection,
  className,
}: PostTableActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className={cn(
      'flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg',
      className
    )}>
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-blue-900">
          {selectedCount}件の記事を選択中
        </span>
        
        <div className="flex items-center space-x-2">
          {onBulkPublish && (
            <Button variant="outline" size="sm" onClick={onBulkPublish}>
              一括公開
            </Button>
          )}
          
          {onBulkUnpublish && (
            <Button variant="outline" size="sm" onClick={onBulkUnpublish}>
              一括非公開
            </Button>
          )}
          
          {onBulkDelete && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBulkDelete}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              一括削除
            </Button>
          )}
        </div>
      </div>
      
      {onClearSelection && (
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          選択解除
        </Button>
      )}
    </div>
  );
}