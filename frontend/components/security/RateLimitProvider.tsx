'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { RateLimiter, SecurityLogger } from '@/lib/security';
import { AppError, ErrorType, ErrorSeverity } from '@/lib/errors';

interface RateLimitContextType {
  checkLimit: (action: string, limit?: number) => Promise<boolean>;
  getRemainingRequests: (action: string) => number;
  isBlocked: (action: string) => boolean;
}

const RateLimitContext = createContext<RateLimitContextType | undefined>(undefined);

interface RateLimitProviderProps {
  children: React.ReactNode;
}

// レート制限設定
const RATE_LIMIT_CONFIG = {
  // API呼び出し制限
  api: { limit: 100, window: 60000 }, // 1分間に100回
  
  // ログイン試行制限
  login: { limit: 5, window: 60000 }, // 1分間に5回
  
  // パスワードリセット制限
  passwordReset: { limit: 3, window: 300000 }, // 5分間に3回
  
  // コメント投稿制限
  comment: { limit: 10, window: 60000 }, // 1分間に10回
  
  // お問い合わせ制限
  contact: { limit: 3, window: 3600000 }, // 1時間に3回
  
  // 検索制限
  search: { limit: 50, window: 60000 }, // 1分間に50回
  
  // ファイルアップロード制限
  upload: { limit: 5, window: 300000 }, // 5分間に5回
  
  // 一般的なフォーム送信制限
  form: { limit: 20, window: 60000 }, // 1分間に20回
};

export function RateLimitProvider({ children }: RateLimitProviderProps) {
  const getIdentifier = useCallback(() => {
    // ユーザー識別子を取得（IPアドレス代替）
    // 実際の実装では、IPアドレスまたはユーザーIDを使用
    return `user_${Date.now().toString(36)}_${Math.random().toString(36)}`;
  }, []);

  const checkLimit = useCallback(async (
    action: string,
    customLimit?: number
  ): Promise<boolean> => {
    const config = RATE_LIMIT_CONFIG[action as keyof typeof RATE_LIMIT_CONFIG];
    const limit = customLimit || config?.limit || 10;
    const window = config?.window || 60000;
    
    const identifier = `${getIdentifier()}_${action}`;
    const result = RateLimiter.checkLimit(identifier, limit, window);
    
    if (!result.allowed) {
      // レート制限違反をログに記録
      SecurityLogger.logEvent('rate_limit', {
        action,
        identifier: identifier.substring(0, 20) + '...', // 識別子の一部のみログ
        limit,
        window,
        resetTime: new Date(result.resetTime).toISOString(),
      });
      
      // ユーザーに通知
      showRateLimitNotification(action, result.resetTime);
    }
    
    return result.allowed;
  }, [getIdentifier]);

  const getRemainingRequests = useCallback((action: string): number => {
    const config = RATE_LIMIT_CONFIG[action as keyof typeof RATE_LIMIT_CONFIG];
    const limit = config?.limit || 10;
    const window = config?.window || 60000;
    
    const identifier = `${getIdentifier()}_${action}`;
    const result = RateLimiter.checkLimit(identifier, limit, window);
    
    return result.remaining;
  }, [getIdentifier]);

  const isBlocked = useCallback((action: string): boolean => {
    const config = RATE_LIMIT_CONFIG[action as keyof typeof RATE_LIMIT_CONFIG];
    const limit = config?.limit || 10;
    const window = config?.window || 60000;
    
    const identifier = `${getIdentifier()}_${action}`;
    const result = RateLimiter.checkLimit(identifier, limit, window);
    
    return !result.allowed;
  }, [getIdentifier]);

  const contextValue: RateLimitContextType = {
    checkLimit,
    getRemainingRequests,
    isBlocked,
  };

  return (
    <RateLimitContext.Provider value={contextValue}>
      {children}
    </RateLimitContext.Provider>
  );
}

export function useRateLimit(): RateLimitContextType {
  const context = useContext(RateLimitContext);
  if (context === undefined) {
    throw new Error('useRateLimit must be used within a RateLimitProvider');
  }
  return context;
}

// レート制限通知の表示
function showRateLimitNotification(action: string, resetTime: number) {
  const timeUntilReset = Math.ceil((resetTime - Date.now()) / 1000);
  const minutes = Math.floor(timeUntilReset / 60);
  const seconds = timeUntilReset % 60;
  
  const timeMessage = minutes > 0 
    ? `${minutes}分${seconds}秒` 
    : `${seconds}秒`;
  
  const actionMessages: Record<string, string> = {
    login: 'ログイン試行回数が上限に達しました',
    api: 'APIの呼び出し回数が上限に達しました',
    comment: 'コメント投稿回数が上限に達しました',
    contact: 'お問い合わせ送信回数が上限に達しました',
    search: '検索回数が上限に達しました',
    upload: 'ファイルアップロード回数が上限に達しました',
    form: 'フォーム送信回数が上限に達しました',
  };
  
  const message = actionMessages[action] || 'アクション実行回数が上限に達しました';
  
  // トースト通知（実装に応じて調整）
  if (typeof window !== 'undefined') {
    console.warn(`${message}。${timeMessage}後に再試行してください。`);
    
    // カスタム通知システムがあれば使用
    const customWindow = window as typeof window & {
      showNotification?: (options: {
        type: string;
        message: string;
        duration: number;
      }) => void;
    };
    
    if (customWindow.showNotification) {
      customWindow.showNotification({
        type: 'warning',
        message: `${message}。${timeMessage}後に再試行してください。`,
        duration: 5000,
      });
    }
  }
}

// レート制限付きのAPI呼び出しHook
export function useRateLimitedApi() {
  const { checkLimit } = useRateLimit();
  
  async function rateLimitedCall<T>(
    action: string,
    apiCall: () => Promise<T>,
    customLimit?: number
  ): Promise<T> {
    const allowed = await checkLimit(action, customLimit);
    
    if (!allowed) {
      throw new AppError({
        type: ErrorType.CLIENT,
        severity: ErrorSeverity.MEDIUM,
        userMessage: 'リクエストの頻度が高すぎます。しばらく待ってから再試行してください。',
        technicalMessage: `Rate limit exceeded for action: ${action}`,
        context: { action, customLimit },
      });
    }
    
    return apiCall();
  }
  
  return rateLimitedCall;
}

// レート制限付きフォーム送信Hook
export function useRateLimitedForm(action: string = 'form') {
  const { checkLimit } = useRateLimit();
  
  return useCallback(async (
    submitFunction: () => Promise<void> | void
  ): Promise<boolean> => {
    const allowed = await checkLimit(action);
    
    if (!allowed) {
      return false;
    }
    
    try {
      await submitFunction();
      return true;
    } catch (error) {
      console.error('Form submission failed:', error);
      throw error;
    }
  }, [checkLimit, action]);
}

// HOC: レート制限付きコンポーネント
export function withRateLimit<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  action: string,
  limit?: number
) {
  const RateLimitedComponent = React.memo((props: P) => {
    const { checkLimit, isBlocked } = useRateLimit();
    const [blocked, setBlocked] = React.useState(false);
    
    React.useEffect(() => {
      setBlocked(isBlocked(action));
    }, [isBlocked]);
    
    const handleAction = React.useCallback(async () => {
      const allowed = await checkLimit(action, limit);
      setBlocked(!allowed);
      return allowed;
    }, [checkLimit]);
    
    if (blocked) {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            アクション制限中です。しばらく待ってから再試行してください。
          </p>
        </div>
      );
    }
    
    return (
      <WrappedComponent 
        {...props} 
        onAction={handleAction}
      />
    );
  });
  
  RateLimitedComponent.displayName = `withRateLimit(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return RateLimitedComponent;
}

// レート制限状態表示コンポーネント
interface RateLimitStatusProps {
  action: string;
  className?: string;
}

export function RateLimitStatus({ action, className = '' }: RateLimitStatusProps) {
  const { getRemainingRequests, isBlocked } = useRateLimit();
  const [remaining, setRemaining] = React.useState(0);
  const [blocked, setBlocked] = React.useState(false);
  
  React.useEffect(() => {
    const updateStatus = () => {
      setRemaining(getRemainingRequests(action));
      setBlocked(isBlocked(action));
    };
    
    updateStatus();
    
    // 定期的に更新
    const interval = setInterval(updateStatus, 1000);
    
    return () => clearInterval(interval);
  }, [action, getRemainingRequests, isBlocked]);
  
  if (blocked) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        制限中 - しばらく待ってください
      </div>
    );
  }
  
  if (remaining <= 5) {
    return (
      <div className={`text-yellow-600 text-sm ${className}`}>
        残り {remaining} 回
      </div>
    );
  }
  
  return null;
}

// レート制限付きボタンコンポーネント
interface RateLimitedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  action: string;
  limit?: number;
  children: React.ReactNode;
  onRateLimitExceeded?: () => void;
}

export function RateLimitedButton({
  action,
  limit,
  children,
  onClick,
  onRateLimitExceeded,
  disabled,
  ...props
}: RateLimitedButtonProps) {
  const { checkLimit } = useRateLimit();
  const [isDisabled, setIsDisabled] = React.useState(false);
  
  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const allowed = await checkLimit(action, limit);
    
    if (!allowed) {
      setIsDisabled(true);
      onRateLimitExceeded?.();
      
      // 1分後に再有効化
      setTimeout(() => {
        setIsDisabled(false);
      }, 60000);
      
      return;
    }
    
    onClick?.(event);
  };
  
  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled || isDisabled}
      className={`${props.className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
      {isDisabled && (
        <span className="ml-2 text-xs">(制限中)</span>
      )}
    </button>
  );
}