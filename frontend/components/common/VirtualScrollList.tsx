'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// 仮想スクロールの設定
interface VirtualScrollConfig {
  itemHeight: number | ((index: number) => number);
  containerHeight: number;
  overscan?: number;
  threshold?: number;
  loadMoreThreshold?: number;
}

// 仮想スクロールアイテムの型
interface VirtualScrollItem<T = unknown> {
  index: number;
  style: React.CSSProperties;
  data: T;
}

// 仮想スクロールリストのプロパティ
interface VirtualScrollListProps<T> {
  items: T[];
  config: VirtualScrollConfig;
  renderItem: (item: VirtualScrollItem) => React.ReactNode;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  loading?: boolean;
  className?: string;
  emptyMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
}

/**
 * 大量のデータを効率的に表示する仮想スクロールリスト
 */
export function VirtualScrollList<T>({
  items,
  config,
  renderItem,
  onLoadMore,
  hasMore = false,
  loading = false,
  className = '',
  emptyMessage = 'データがありません',
  errorMessage,
  onRetry,
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const { itemHeight, containerHeight, overscan = 5, loadMoreThreshold = 200 } = config;

  // アイテムの高さを計算する関数
  const getItemHeight = useCallback((index: number): number => {
    return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
  }, [itemHeight]);

  // 総高さを計算
  const totalHeight = useMemo(() => {
    if (typeof itemHeight === 'number') {
      return items.length * itemHeight;
    }
    
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += getItemHeight(i);
    }
    return height;
  }, [items.length, getItemHeight, itemHeight]);

  // 表示する範囲を計算
  const visibleRange = useMemo(() => {
    if (items.length === 0) {
      return { start: 0, end: 0 };
    }

    let start = 0;
    let end = 0;
    let accumulatedHeight = 0;

    // 開始インデックスを見つける
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i);
      if (accumulatedHeight + height > scrollTop) {
        start = Math.max(0, i - overscan);
        break;
      }
      accumulatedHeight += height;
    }

    // 終了インデックスを見つける
    accumulatedHeight = 0;
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i);
      accumulatedHeight += height;
      if (accumulatedHeight > scrollTop + containerHeight) {
        end = Math.min(items.length, i + overscan + 1);
        break;
      }
    }

    if (end === 0) {
      end = items.length;
    }

    return { start, end };
  }, [scrollTop, containerHeight, items.length, overscan, getItemHeight]);

  // 表示するアイテムのオフセットを計算
  const getItemOffset = useCallback((index: number): number => {
    if (typeof itemHeight === 'number') {
      return index * itemHeight;
    }

    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i);
    }
    return offset;
  }, [getItemHeight, itemHeight]);

  // スクロールイベントハンドラ
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    setScrollTop(scrollTop);

    // 無限スクロールの処理
    if (onLoadMore && hasMore && !loading && !isLoadingMore) {
      const scrollHeight = event.currentTarget.scrollHeight;
      const clientHeight = event.currentTarget.clientHeight;
      const remaining = scrollHeight - scrollTop - clientHeight;

      if (remaining < loadMoreThreshold) {
        setIsLoadingMore(true);
        onLoadMore().finally(() => setIsLoadingMore(false));
      }
    }
  }, [onLoadMore, hasMore, loading, isLoadingMore, loadMoreThreshold]);

  // 表示するアイテムを生成
  const visibleItems = useMemo(() => {
    const items_to_render = [];
    
    for (let i = visibleRange.start; i < visibleRange.end; i++) {
      if (i >= items.length) break;

      const offset = getItemOffset(i);
      const height = getItemHeight(i);

      items_to_render.push({
        index: i,
        data: items[i],
        style: {
          position: 'absolute' as const,
          top: offset,
          left: 0,
          right: 0,
          height: height,
        },
      });
    }

    return items_to_render;
  }, [visibleRange, items, getItemOffset, getItemHeight]);

  // エラー表示
  if (errorMessage) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="text-red-600 text-center mb-4">
          <p className="font-medium">エラーが発生しました</p>
          <p className="text-sm mt-1">{errorMessage}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            再試行
          </button>
        )}
      </div>
    );
  }

  // 空の状態
  if (items.length === 0 && !loading) {
    return (
      <div className={`flex items-center justify-center p-8 text-gray-500 ${className}`}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* 仮想スクロールコンテナ */}
      <div
        ref={scrollElementRef}
        style={{ height: totalHeight, position: 'relative' }}
      >
        {/* 表示されるアイテム */}
        {visibleItems.map((item) => (
          <div key={item.index} style={item.style}>
            {renderItem(item)}
          </div>
        ))}
      </div>

      {/* ローディング表示 */}
      {(loading || isLoadingMore) && (
        <div className="flex items-center justify-center p-4">
          <LoadingSpinner />
          <span className="ml-2 text-gray-600">
            {isLoadingMore ? '追加データを読み込み中...' : '読み込み中...'}
          </span>
        </div>
      )}

      {/* データ終了表示 */}
      {!hasMore && items.length > 0 && !loading && (
        <div className="text-center p-4 text-gray-500 text-sm">
          すべてのデータを表示しました
        </div>
      )}
    </div>
  );
}

/**
 * 固定高さアイテム用の簡単な仮想スクロールリスト
 */
interface SimpleVirtualListProps<T> extends Omit<VirtualScrollListProps<T>, 'config'> {
  itemHeight: number;
  height: number;
}

export function SimpleVirtualList<T>({
  itemHeight,
  height,
  ...props
}: SimpleVirtualListProps<T>) {
  const config: VirtualScrollConfig = {
    itemHeight,
    containerHeight: height,
    overscan: 5,
  };

  return <VirtualScrollList {...props} config={config} />;
}

/**
 * グリッド表示用の仮想スクロール
 */
interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  columns: number;
  containerHeight: number;
  gap?: number;
  renderItem: (item: { index: number; data: T; style: React.CSSProperties }) => React.ReactNode;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  loading?: boolean;
  className?: string;
}

export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  columns,
  containerHeight,
  gap = 0,
  renderItem,
  onLoadMore,
  hasMore = false,
  loading = false,
  className = '',
}: VirtualGridProps<T>) {
  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(items.length / columns);

  const gridRenderItem = useCallback((virtualItem: VirtualScrollItem) => {
    const rowIndex = virtualItem.index;
    const startIndex = rowIndex * columns;
    const endIndex = Math.min(startIndex + columns, items.length);
    // endIndexはループで使用される
    void endIndex;
    
    return (
      <div
        className="flex"
        style={{
          gap: gap,
          height: itemHeight,
        }}
      >
        {Array.from({ length: columns }, (_, colIndex) => {
          const itemIndex = startIndex + colIndex;
          
          if (itemIndex >= items.length) {
            return (
              <div
                key={colIndex}
                style={{ width: itemWidth, height: itemHeight }}
              />
            );
          }

          return (
            <div key={colIndex} style={{ width: itemWidth, height: itemHeight }}>
              {renderItem({
                index: itemIndex,
                data: items[itemIndex],
                style: { width: itemWidth, height: itemHeight },
              })}
            </div>
          );
        })}
      </div>
    );
  }, [items, columns, itemWidth, itemHeight, gap, renderItem]);

  // 行データを作成
  const rowItems = useMemo(() => {
    return Array.from({ length: totalRows }, (_, index) => index);
  }, [totalRows]);

  const config: VirtualScrollConfig = {
    itemHeight: rowHeight,
    containerHeight,
    overscan: 2,
  };

  return (
    <VirtualScrollList
      items={rowItems}
      config={config}
      renderItem={gridRenderItem}
      onLoadMore={onLoadMore}
      hasMore={hasMore}
      loading={loading}
      className={className}
    />
  );
}

/**
 * 可変高さアイテム用の仮想スクロール（高度な使用例）
 */
interface VariableHeightVirtualListProps<T> extends Omit<VirtualScrollListProps<T>, 'config'> {
  estimatedItemHeight: number;
  containerHeight: number;
  measureHeight?: (item: T, index: number) => number;
}

export function VariableHeightVirtualList<T>({
  estimatedItemHeight,
  containerHeight,
  measureHeight,
  ...props
}: VariableHeightVirtualListProps<T>) {
  const [measuredHeights] = useState<Map<number, number>>(new Map());
  // setMeasuredHeightsは将来の拡張用に保持
  // const setMeasuredHeights = useState<Map<number, number>>(new Map())[1];

  const getItemHeight = useCallback((index: number): number => {
    // 測定済みの高さがあればそれを使用
    const measured = measuredHeights.get(index);
    if (measured !== undefined) {
      return measured;
    }

    // カスタム測定関数があればそれを使用
    if (measureHeight && props.items[index]) {
      return measureHeight(props.items[index], index);
    }

    // フォールバック：推定高さ
    return estimatedItemHeight;
  }, [measuredHeights, measureHeight, props.items, estimatedItemHeight]);

  const config: VirtualScrollConfig = {
    itemHeight: getItemHeight,
    containerHeight,
    overscan: 3,
  };

  return <VirtualScrollList {...props} config={config} />;
}