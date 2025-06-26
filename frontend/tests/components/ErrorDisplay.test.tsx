import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { 
  ErrorDisplay, 
  ApiErrorDisplay, 
  NotFoundError, 
  AuthError, 
  NetworkError, 
  ServerError 
} from '@/components/common/ErrorDisplay';

describe('ErrorDisplay', () => {
  const mockOnRetry = jest.fn();
  const mockOnGoHome = jest.fn();
  const mockOnGoBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Inline variant', () => {
    it('renders inline error with default title', () => {
      render(<ErrorDisplay variant="inline" />);
      
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      expect(screen.getByText('よくわからないエラーが発生しました。しばらく待ってからもう一度お試しください。')).toBeInTheDocument();
    });

    it('renders inline error with custom message', () => {
      render(<ErrorDisplay variant="inline" message="Custom error message" />);
      
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('renders inline error with string error', () => {
      render(<ErrorDisplay variant="inline" error="String error message" />);
      
      expect(screen.getByText('String error message')).toBeInTheDocument();
    });

    it('renders inline error with Error object', () => {
      const error = new Error('Error object message');
      render(<ErrorDisplay variant="inline" error={error} />);
      
      expect(screen.getByText('Error object message')).toBeInTheDocument();
    });

    it('shows retry button when onRetry is provided', () => {
      render(<ErrorDisplay variant="inline" onRetry={mockOnRetry} />);
      
      const retryButton = screen.getByText('再試行');
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it('shows back button when onGoBack is provided', () => {
      render(<ErrorDisplay variant="inline" onGoBack={mockOnGoBack} />);
      
      const backButton = screen.getByText('戻る');
      expect(backButton).toBeInTheDocument();
      
      fireEvent.click(backButton);
      expect(mockOnGoBack).toHaveBeenCalledTimes(1);
    });

    it('hides actions when showActions is false', () => {
      render(<ErrorDisplay variant="inline" onRetry={mockOnRetry} showActions={false} />);
      
      expect(screen.queryByText('再試行')).not.toBeInTheDocument();
    });
  });

  describe('Card variant', () => {
    it('renders card error with default title', () => {
      render(<ErrorDisplay variant="card" />);
      
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });

    it('shows all action buttons when provided', () => {
      render(
        <ErrorDisplay 
          variant="card" 
          onRetry={mockOnRetry} 
          onGoHome={mockOnGoHome} 
          onGoBack={mockOnGoBack} 
        />
      );
      
      expect(screen.getByText('再試行')).toBeInTheDocument();
      expect(screen.getByText('ホーム')).toBeInTheDocument();
      expect(screen.getByText('戻る')).toBeInTheDocument();
    });

    it('handles action button clicks', () => {
      render(
        <ErrorDisplay 
          variant="card" 
          onRetry={mockOnRetry} 
          onGoHome={mockOnGoHome} 
          onGoBack={mockOnGoBack} 
        />
      );
      
      fireEvent.click(screen.getByText('再試行'));
      fireEvent.click(screen.getByText('ホーム'));
      fireEvent.click(screen.getByText('戻る'));
      
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
      expect(mockOnGoHome).toHaveBeenCalledTimes(1);
      expect(mockOnGoBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Page variant', () => {
    it('renders page error with default title', () => {
      render(<ErrorDisplay variant="page" />);
      
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });

    it('shows action buttons in page layout', () => {
      render(
        <ErrorDisplay 
          variant="page" 
          onRetry={mockOnRetry} 
          onGoHome={mockOnGoHome} 
          onGoBack={mockOnGoBack} 
        />
      );
      
      expect(screen.getByText('再試行')).toBeInTheDocument();
      expect(screen.getByText('ホームに戻る')).toBeInTheDocument();
      expect(screen.getByText('戻る')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    const customClass = 'custom-error-class';
    render(<ErrorDisplay className={customClass} />);
    
    // Alertコンポーネントの最外側要素（role="alert"）を確認
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveClass(customClass);
  });
});

describe('ApiErrorDisplay', () => {
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders API error message', () => {
    const apiError = {
      message: 'API Error Message',
      errors: { field: ['Field error'] },
    };

    render(<ApiErrorDisplay error={apiError} onRetry={mockOnRetry} />);
    
    expect(screen.getByText('API Error Message')).toBeInTheDocument();
  });

  it('renders validation errors when present', () => {
    const apiError = {
      message: 'Validation failed',
      errors: { 
        title: ['Title is required'],
        content: ['Content is required'],
      },
    };

    render(<ApiErrorDisplay error={apiError} />);
    
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Content is required')).toBeInTheDocument();
  });

  it('handles retry action', () => {
    const apiError = {
      message: 'API Error',
    };

    render(<ApiErrorDisplay error={apiError} onRetry={mockOnRetry} />);
    
    fireEvent.click(screen.getByText('再試行'));
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });
});

describe('NotFoundError', () => {
  const mockOnGoHome = jest.fn();
  const mockOnGoBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default resource name', () => {
    render(<NotFoundError onGoHome={mockOnGoHome} onGoBack={mockOnGoBack} />);
    
    expect(screen.getByText('お探しのページが見つかりません')).toBeInTheDocument();
  });

  it('renders with custom resource name', () => {
    render(<NotFoundError resource="記事" onGoHome={mockOnGoHome} onGoBack={mockOnGoBack} />);
    
    expect(screen.getByText('お探しのページが見つかりません')).toBeInTheDocument();
  });

  it('handles action buttons', () => {
    render(<NotFoundError onGoHome={mockOnGoHome} onGoBack={mockOnGoBack} />);
    
    fireEvent.click(screen.getByText('ホームに戻る'));
    fireEvent.click(screen.getByText('戻る'));
    
    expect(mockOnGoHome).toHaveBeenCalledTimes(1);
    expect(mockOnGoBack).toHaveBeenCalledTimes(1);
  });
});

describe('AuthError', () => {
  const mockOnLogin = jest.fn();
  const mockOnGoHome = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders authentication error message', () => {
    render(<AuthError onLogin={mockOnLogin} onGoHome={mockOnGoHome} />);
    
    expect(screen.getByText('認証が必要です')).toBeInTheDocument();
  });

  it('handles login action', () => {
    render(<AuthError onLogin={mockOnLogin} onGoHome={mockOnGoHome} />);
    
    fireEvent.click(screen.getByText('ログイン'));
    expect(mockOnLogin).toHaveBeenCalledTimes(1);
  });

  it('handles go home action', () => {
    render(<AuthError onLogin={mockOnLogin} onGoHome={mockOnGoHome} />);
    
    fireEvent.click(screen.getByText('ホームに戻る'));
    expect(mockOnGoHome).toHaveBeenCalledTimes(1);
  });
});

describe('NetworkError', () => {
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders network error message', () => {
    render(<NetworkError onRetry={mockOnRetry} />);
    
    expect(screen.getByText('接続エラー')).toBeInTheDocument();
  });

  it('handles retry action', () => {
    render(<NetworkError onRetry={mockOnRetry} />);
    
    fireEvent.click(screen.getByText('再試行'));
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });
});

describe('ServerError', () => {
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders server error message', () => {
    render(<ServerError onRetry={mockOnRetry} />);
    
    expect(screen.getByText('サーバーエラー')).toBeInTheDocument();
  });

  it('handles retry action', () => {
    render(<ServerError onRetry={mockOnRetry} />);
    
    fireEvent.click(screen.getByText('再試行'));
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });
}); 