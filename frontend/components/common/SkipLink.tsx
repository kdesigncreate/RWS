/**
 * スキップリンクコンポーネント
 * アクセシビリティ向上のため、メインコンテンツに直接ジャンプできる
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  href,
  children,
  className,
}) => {
  return (
    <a
      href={href}
      className={cn(
        // 通常は画面外に配置
        'absolute -top-10 left-6 z-50',
        // フォーカス時に表示
        'focus:top-6',
        // スタイリング
        'bg-blue-600 text-white px-4 py-2 rounded-md',
        'font-medium text-sm',
        'transition-all duration-150',
        // キーボードフォーカスのアウトライン
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        className
      )}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
            // フォーカス可能な要素の場合はフォーカスを移動
            if (target instanceof HTMLElement) {
              target.focus();
            }
          }
        }
      }}
    >
      {children}
    </a>
  );
};

/**
 * メインコンテンツスキップリンク
 */
export const SkipToMainContent: React.FC = () => {
  return (
    <SkipLink href="#main-content">
      メインコンテンツにスキップ
    </SkipLink>
  );
};

/**
 * ナビゲーションスキップリンク
 */
export const SkipToNavigation: React.FC = () => {
  return (
    <SkipLink href="#navigation">
      ナビゲーションにスキップ
    </SkipLink>
  );
};

/**
 * フッタースキップリンク
 */
export const SkipToFooter: React.FC = () => {
  return (
    <SkipLink href="#footer">
      フッターにスキップ
    </SkipLink>
  );
};