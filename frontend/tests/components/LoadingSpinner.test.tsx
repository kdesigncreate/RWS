import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  LoadingSpinner, 
  InlineSpinner, 
  ButtonSpinner, 
  LoadingCard, 
  SkeletonItem, 
  PostCardSkeleton, 
  TableRowSkeleton 
} from '@/components/common/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    // スピナーが表示されることを確認（SVG要素を検索）
    const spinner = document.querySelector('svg');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with custom size', () => {
    render(<LoadingSpinner size="lg" />);
    
    // カスタムサイズのスピナーが表示されることを確認
    const spinner = document.querySelector('svg');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    const text = '読み込み中...';
    render(<LoadingSpinner text={text} />);
    
    // カスタムテキストが表示されることを確認
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('renders with fullScreen prop', () => {
    render(<LoadingSpinner fullScreen />);
    
    // フルスクリーンスピナーが表示されることを確認
    const spinner = document.querySelector('svg');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const customClass = 'custom-class';
    render(<LoadingSpinner className={customClass} />);
    
    // カスタムクラスが適用されることを確認
    const container = document.querySelector(`.${customClass}`);
    expect(container).toBeInTheDocument();
  });
});

describe('InlineSpinner', () => {
  it('renders inline spinner', () => {
    render(<InlineSpinner />);
    
    // インラインスピナーが表示されることを確認
    const spinner = document.querySelector('svg');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const customClass = 'custom-inline-class';
    render(<InlineSpinner className={customClass} />);
    
    // カスタムクラスが適用されることを確認
    const spinner = document.querySelector(`.${customClass}`);
    expect(spinner).toBeInTheDocument();
  });
});

describe('ButtonSpinner', () => {
  it('renders button spinner', () => {
    render(<ButtonSpinner />);
    
    // ボタンスピナーが表示されることを確認
    const spinner = document.querySelector('svg');
    expect(spinner).toBeInTheDocument();
  });
});

describe('LoadingCard', () => {
  it('renders with default title', () => {
    render(<LoadingCard />);
    
    // デフォルトタイトルが表示されることを確認
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    const title = 'カスタムタイトル';
    render(<LoadingCard title={title} />);
    
    // カスタムタイトルが表示されることを確認
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('renders with description', () => {
    const description = '詳細な説明';
    render(<LoadingCard description={description} />);
    
    // 説明が表示されることを確認
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const customClass = 'custom-card-class';
    render(<LoadingCard className={customClass} />);
    
    // カスタムクラスが適用されることを確認
    const card = document.querySelector(`.${customClass}`);
    expect(card).toBeInTheDocument();
  });
});

describe('SkeletonItem', () => {
  it('renders skeleton item', () => {
    render(<SkeletonItem />);
    
    // スケルトンアイテムが表示されることを確認
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const customClass = 'custom-skeleton-class';
    render(<SkeletonItem className={customClass} />);
    
    // カスタムクラスが適用されることを確認
    const skeleton = document.querySelector(`.${customClass}`);
    expect(skeleton).toBeInTheDocument();
  });
});

describe('PostCardSkeleton', () => {
  it('renders post card skeleton', () => {
    render(<PostCardSkeleton />);
    
    // 記事カードスケルトンが表示されることを確認
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });
});

describe('TableRowSkeleton', () => {
  it('renders table row skeleton', () => {
    render(
      <table>
        <tbody>
          <TableRowSkeleton />
        </tbody>
      </table>
    );
    
    // テーブル行スケルトンが表示されることを確認
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });
}); 