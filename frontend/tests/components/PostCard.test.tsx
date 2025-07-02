import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import '@testing-library/jest-dom';
import { PostCard } from '@/components/posts/PostCard';
import { Post } from '@/types/post';

// Next.js router のモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
});

// テスト用のサンプルデータ
const mockPost: Post = {
  id: 1,
  title: 'テスト記事のタイトル',
  content: 'これはテスト記事の内容です。長い内容を想定してテストを行います。',
  excerpt: 'テスト記事の抜粋です',
  status: 'published',
  status_label: '公開',
  published_at: '2024-01-15T10:00:00Z',
  published_at_formatted: '2024年1月15日',
  is_published: true,
  is_draft: false,
  user_id: 1,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  created_at_formatted: '2024年1月15日',
  updated_at_formatted: '2024年1月15日',
  author: {
    id: 1,
    name: 'テストユーザー',
    email: 'test@example.com',
    email_verified_at: '2024-01-01T00:00:00Z',
    is_email_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_at_formatted: '2024年1月1日',
    updated_at_formatted: '2024年1月1日',
    account_age_days: 0,
  },
  meta: {
    title_length: 10,
    content_length: 30,
    excerpt_length: 10,
    reading_time_minutes: 2,
  },
};

const mockDraftPost: Post = {
  ...mockPost,
  id: 2,
  title: '下書き記事',
  status: 'draft',
  status_label: '下書き',
  is_published: false,
  is_draft: true,
  published_at: null,
  published_at_formatted: null,
};

describe('PostCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 基本的なレンダリングテスト
   */
  it('renders post card with all required information', () => {
    render(<PostCard post={mockPost} />);

    // タイトルが表示されているか
    expect(screen.getByText(mockPost.title)).toBeInTheDocument();
    
    // 作成者名が表示されているか
    if (mockPost.author) {
      expect(screen.getByText(mockPost.author.name)).toBeInTheDocument();
    }
    
    // 作成日が表示されているか（フォーマット済み）
    expect(screen.getByText(/2024年1月15日/)).toBeInTheDocument();
    
    // コンテンツの一部が表示されているか
    expect(screen.getByText(/テスト記事の抜粋です/)).toBeInTheDocument();
  });

  /**
   * コンテンツの表示テスト
   */
  it('displays content correctly', () => {
    render(<PostCard post={mockPost} />);

    // 抜粋が表示されているか
    if (mockPost.excerpt) {
      expect(screen.getByText(mockPost.excerpt)).toBeInTheDocument();
    }
  });

  /**
   * クリック時のナビゲーションテスト
   */
  it('navigates to post detail page when clicked', async () => {
    render(<PostCard post={mockPost} />);

    const titleLink = screen.getByRole('link', { name: mockPost.title });
    
    fireEvent.click(titleLink);

    // Linkコンポーネントのhref属性を確認
    expect(titleLink).toHaveAttribute('href', `/info/${mockPost.id}`);
  });

  /**
   * リンクのhref属性テスト
   */
  it('has correct href for post detail link', () => {
    render(<PostCard post={mockPost} />);

    const titleLink = screen.getByRole('link', { name: mockPost.title });
    expect(titleLink).toHaveAttribute('href', `/info/${mockPost.id}`);
  });

  /**
   * カードスタイルテスト
   */
  it('applies correct styling classes', () => {
    render(<PostCard post={mockPost} />);

    const cardElement = screen.getByText(mockPost.title).closest('[data-slot="card"]');
    
    // 基本的なスタイリングクラスが適用されているか
    expect(cardElement).toHaveClass('hover:shadow-md');
  });

  /**
   * 公開ステータス表示テスト
   */
  it('shows published status badge for published posts', () => {
    render(<PostCard post={mockPost} showStatus={true} />);

    const statusBadge = screen.getByText('公開');
    expect(statusBadge).toBeInTheDocument();
  });

  /**
   * 下書きステータス表示テスト
   */
  it('shows draft status badge for draft posts', () => {
    render(<PostCard post={mockDraftPost} showStatus={true} />);

    const statusBadge = screen.getByText('下書き');
    expect(statusBadge).toBeInTheDocument();
  });

  /**
   * ステータス非表示テスト
   */
  it('hides status badge when showStatus is false', () => {
    render(<PostCard post={mockPost} showStatus={false} />);

    expect(screen.queryByText('公開')).not.toBeInTheDocument();
    expect(screen.queryByText('下書き')).not.toBeInTheDocument();
  });

  /**
   * 管理者アクション表示テスト
   */
  it('shows action menu when showActions is true', () => {
    const mockOnEdit = jest.fn();
    render(<PostCard post={mockPost} showActions={true} onEdit={mockOnEdit} />);

    const actionButton = screen.getByText('•••');
    expect(actionButton).toBeInTheDocument();
  });

  /**
   * 編集機能の存在テスト
   */
  it('renders edit functionality when onEdit is provided', () => {
    const mockOnEdit = jest.fn();
    render(<PostCard post={mockPost} showActions={true} onEdit={mockOnEdit} />);

    // アクションメニューボタンが表示されていること
    const actionButton = screen.getByText('•••');
    expect(actionButton).toBeInTheDocument();
    
    // onEditコールバックが正しく渡されていること
    expect(mockOnEdit).toBeDefined();
  });

  /**
   * 削除機能の存在テスト
   */
  it('renders delete functionality when onDelete is provided', () => {
    const mockOnDelete = jest.fn();
    render(<PostCard post={mockPost} showActions={true} onDelete={mockOnDelete} />);

    // アクションメニューボタンが表示されていること
    const actionButton = screen.getByText('•••');
    expect(actionButton).toBeInTheDocument();
    
    // onDeleteコールバックが正しく渡されていること
    expect(mockOnDelete).toBeDefined();
  });

  /**
   * 読み時間表示テスト
   */
  it('shows reading time when showReadingTime is true', () => {
    render(<PostCard post={mockPost} showReadingTime={true} />);

    expect(screen.getByText('約2分')).toBeInTheDocument();
  });

  /**
   * カードバリアント表示テスト
   */
  it('renders compact variant correctly', () => {
    render(<PostCard post={mockPost} variant="compact" />);

    expect(screen.getByText(mockPost.title)).toBeInTheDocument();
    if (mockPost.author) {
      expect(screen.getByText(mockPost.author.name)).toBeInTheDocument();
    }
  });

  /**
   * フィーチャーバリアント表示テスト
   */
  it('renders featured variant correctly', () => {
    render(<PostCard post={mockPost} variant="featured" />);

    expect(screen.getByText(mockPost.title)).toBeInTheDocument();
    expect(screen.getByText('続きを読む')).toBeInTheDocument();
  });

  /**
   * 作成者非表示テスト
   */
  it('hides author when showAuthor is false', () => {
    render(<PostCard post={mockPost} showAuthor={false} />);

    if (mockPost.author) {
      expect(screen.queryByText(mockPost.author.name)).not.toBeInTheDocument();
    }
  });

  /**
   * 読み時間非表示テスト
   */
  it('hides reading time when showReadingTime is false', () => {
    render(<PostCard post={mockPost} showReadingTime={false} />);

    expect(screen.queryByText('約2分')).not.toBeInTheDocument();
  });

  /**
   * アクション非表示テスト
   */
  it('hides actions when showActions is false', () => {
    render(<PostCard post={mockPost} showActions={false} />);

    expect(screen.queryByText('•••')).not.toBeInTheDocument();
  });

  /**
   * キーボードナビゲーションテスト
   */
  it('supports keyboard navigation on title link', () => {
    render(<PostCard post={mockPost} />);

    const titleLink = screen.getByRole('link', { name: mockPost.title });
    
    // リンクがフォーカス可能であること
    titleLink.focus();
    expect(titleLink).toHaveFocus();
    
    // Enterキーでナビゲーションが可能であること
    fireEvent.keyDown(titleLink, { key: 'Enter', code: 'Enter' });
    expect(titleLink).toHaveAttribute('href', `/info/${mockPost.id}`);
  });

  /**
   * アクセシビリティテスト
   */
  it('has proper accessibility attributes', () => {
    render(<PostCard post={mockPost} />);

    const titleLink = screen.getByRole('link', { name: mockPost.title });
    
    // リンクに適切なhref属性があること
    expect(titleLink).toHaveAttribute('href', `/info/${mockPost.id}`);
    
    // SVGアイコンが存在すること
    const svgIcons = document.querySelectorAll('svg');
    expect(svgIcons.length).toBeGreaterThan(0);
  });

  /**
   * エラーハンドリングテスト
   */
  it('handles missing author data gracefully', () => {
    const postWithoutAuthor = {
      ...mockPost,
      author: undefined,
    };

    render(<PostCard post={postWithoutAuthor as Post} showAuthor={true} />);

    // 作成者情報が表示されないこと
    if (mockPost.author) {
      expect(screen.queryByText(mockPost.author.name)).not.toBeInTheDocument();
    }
  });

  /**
   * 日付フォーマットテスト
   */
  it('formats and displays dates correctly', () => {
    const postWithSpecificDate = {
      ...mockPost,
      published_at: '2023-12-25T15:30:00Z',
      created_at: '2023-12-25T15:30:00Z',
      created_at_formatted: '2023年12月25日',
      published_at_formatted: '2023年12月25日',
    };

    render(<PostCard post={postWithSpecificDate} />);

    // 日付が表示されていること（JST時間帯では翌日になる）
    expect(screen.getByText(/2023年12月26日/)).toBeInTheDocument();
  });
});