import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimpleFooter, Header, AdminHeader, Footer } from '@/components/common/Footer';
import { useAuth } from '@/hooks/useAuth';

// useAuthフックをモック
jest.mock('@/hooks/useAuth');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Next.jsのコンポーネントをモック
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('SimpleFooter', () => {
  it('renders simple footer with copyright text', () => {
    render(<SimpleFooter />);
    
    // コピーライトテキストが表示されることを確認
    expect(screen.getByText('© 2024 RWS Blog. All rights reserved.')).toBeInTheDocument();
  });

  it('renders with correct styling classes', () => {
    render(<SimpleFooter />);
    
    // フッター要素が正しいクラスを持つことを確認
    const footer = screen.getByText('© 2024 RWS Blog. All rights reserved.').closest('footer');
    expect(footer).toHaveClass('bg-white', 'border-t', 'border-gray-200');
  });
});

describe('Header', () => {
  beforeEach(() => {
    // デフォルトのモック設定
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isAdmin: false,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
      getUserInfo: jest.fn(),
      requireAuth: jest.fn(),
    });
  });

  it('renders header with site title', () => {
    render(<Header />);
    
    // サイトタイトルが表示されることを確認
    expect(screen.getByText('RWS Blog')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />);
    
    // ナビゲーションリンクが表示されることを確認
    expect(screen.getByText('ホーム')).toBeInTheDocument();
  });

  it('renders login button when not authenticated', () => {
    render(<Header />);
    
    // ログインボタンが表示されることを確認
    expect(screen.getByText('ログイン')).toBeInTheDocument();
  });

  it('renders user menu when authenticated', () => {
    const mockUser = {
      id: 1,
      name: 'テストユーザー',
      email: 'test@example.com',
      email_verified_at: '2024-01-01T00:00:00Z',
      is_email_verified: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      created_at_formatted: '2024年1月1日',
      updated_at_formatted: '2024年1月1日',
      account_age_days: 30,
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      isAdmin: true,
      login: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
      getUserInfo: jest.fn(),
      requireAuth: jest.fn(),
    });

    render(<Header />);
    
    // ユーザー名が表示されることを確認
    expect(screen.getByText('テストユーザー')).toBeInTheDocument();
    
    // 管理画面ボタンが表示されることを確認
    expect(screen.getByText('管理画面')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const customClass = 'custom-header-class';
    render(<Header className={customClass} />);
    
    // カスタムクラスが適用されることを確認
    const header = screen.getByText('RWS Blog').closest('header');
    expect(header).toHaveClass(customClass);
  });
});

describe('AdminHeader', () => {
  const mockUser = {
    id: 1,
    name: 'テストユーザー',
    email: 'test@example.com',
    email_verified_at: '2024-01-01T00:00:00Z',
    is_email_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    created_at_formatted: '2024年1月1日',
    updated_at_formatted: '2024年1月1日',
    account_age_days: 30,
  };

  const mockLogout = jest.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      isAdmin: true,
      login: jest.fn(),
      logout: mockLogout,
      checkAuth: jest.fn(),
      getUserInfo: jest.fn(),
      requireAuth: jest.fn(),
    });
  });

  it('renders admin header with default title', () => {
    render(<AdminHeader />);
    
    // デフォルトタイトルが表示されることを確認
    expect(screen.getByText('管理画面')).toBeInTheDocument();
    
    // サイトトップリンクが表示されることを確認
    expect(screen.getByText('サイトトップ')).toBeInTheDocument();
  });

  it('renders admin header with custom title', () => {
    render(<AdminHeader title="カスタムタイトル" />);
    
    // カスタムタイトルが表示されることを確認
    expect(screen.getByText('カスタムタイトル')).toBeInTheDocument();
  });

  it('displays user information', () => {
    render(<AdminHeader />);
    
    // ユーザー名が表示されることを確認
    expect(screen.getByText('こんにちは、テストユーザーさん')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const customClass = 'custom-admin-header-class';
    render(<AdminHeader className={customClass} />);
    
    // カスタムクラスが適用されることを確認
    const header = screen.getByText('管理画面').closest('header');
    expect(header).toHaveClass(customClass);
  });
});

describe('Footer', () => {
  it('renders footer with default navigation', () => {
    render(<Footer />);
    
    // フッターが表示されることを確認
    const footer = document.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('renders footer with custom navigation items', () => {
    const customItems = [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
    ];
    
    render(<Footer navigationItems={customItems} />);
    
    // カスタムナビゲーションアイテムが表示されることを確認
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });
}); 