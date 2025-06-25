import React from 'react';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  error?: Error | string | null;
  onRetry?: () => void;
  onGoHome?: () => void;
  onGoBack?: () => void;
  className?: string;
  variant?: 'inline' | 'card' | 'page';
  showActions?: boolean;
}

export function ErrorDisplay({
  title = 'エラーが発生しました',
  message,
  error,
  onRetry,
  onGoHome,
  onGoBack,
  className,
  variant = 'inline',
  showActions = true,
}: ErrorDisplayProps) {
  // エラーメッセージを解析
  const getErrorMessage = () => {
    if (message) return message;
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    return 'よくわからないエラーが発生しました。しばらく待ってからもう一度お試しください。';
  };

  // インライン表示（Alert使用）
  if (variant === 'inline') {
    return (
      <Alert className={cn('border-red-200 bg-red-50', className)}>
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex flex-col space-y-2">
            <span className="font-medium">{title}</span>
            <span className="text-sm">{getErrorMessage()}</span>
            {showActions && (onRetry || onGoBack) && (
              <div className="flex space-x-2 mt-2">
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    再試行
                  </Button>
                )}
                {onGoBack && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onGoBack}
                    className="text-red-700 hover:bg-red-100"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    戻る
                  </Button>
                )}
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // カード表示
  if (variant === 'card') {
    return (
      <div className={cn(
        'border border-red-200 rounded-lg p-6 bg-red-50',
        className
      )}>
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-medium text-red-900 mb-2">
              {title}
            </h3>
            <p className="text-red-800 mb-4">
              {getErrorMessage()}
            </p>
            {showActions && (
              <div className="flex flex-wrap gap-2">
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    再試行
                  </Button>
                )}
                {onGoBack && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onGoBack}
                    className="text-red-700 hover:bg-red-100"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    戻る
                  </Button>
                )}
                {onGoHome && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onGoHome}
                    className="text-red-700 hover:bg-red-100"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    ホーム
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ページ全体表示
  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center bg-gray-50 px-4',
      className
    )}>
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          <p className="text-gray-600">
            {getErrorMessage()}
          </p>
        </div>
        
        {showActions && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRetry && (
              <Button onClick={onRetry} className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                再試行
              </Button>
            )}
            {onGoBack && (
              <Button 
                variant="outline" 
                onClick={onGoBack}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                戻る
              </Button>
            )}
            {onGoHome && (
              <Button 
                variant="outline" 
                onClick={onGoHome}
                className="w-full sm:w-auto"
              >
                <Home className="h-4 w-4 mr-2" />
                ホームに戻る
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * API エラー専用表示コンポーネント
 */
interface ApiErrorDisplayProps {
  error: {
    message: string;
    errors?: Record<string, string[]>;
  };
  onRetry?: () => void;
  className?: string;
}

export function ApiErrorDisplay({ error, onRetry, className }: ApiErrorDisplayProps) {
  const hasValidationErrors = error.errors && Object.keys(error.errors).length > 0;

  return (
    <div className={cn('space-y-4', className)}>
      <ErrorDisplay
        title="API エラー"
        message={error.message}
        onRetry={onRetry}
        variant="card"
      />
      
      {hasValidationErrors && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-2">
              <span className="font-medium">入力内容に問題があります：</span>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {Object.entries(error.errors!).map(([field, messages]) => (
                  <li key={field}>
                    <span className="font-medium">{field}:</span> {messages.join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * 404 エラー専用コンポーネント
 */
interface NotFoundErrorProps {
  resource?: string;
  onGoHome?: () => void;
  onGoBack?: () => void;
  className?: string;
}

export function NotFoundError({ 
  resource = 'ページ', 
  onGoHome, 
  onGoBack, 
  className 
}: NotFoundErrorProps) {
  return (
    <ErrorDisplay
      title="お探しのページが見つかりません"
      message={`申し訳ございませんが、お探しの${resource}が見つかりませんでした。URLが正しいかご確認ください。`}
      onGoHome={onGoHome}
      onGoBack={onGoBack}
      variant="page"
      className={className}
    />
  );
}

/**
 * 認証エラー専用コンポーネント
 */
interface AuthErrorProps {
  onLogin?: () => void;
  onGoHome?: () => void;
  className?: string;
}

export function AuthError({ onLogin, onGoHome, className }: AuthErrorProps) {
  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center bg-gray-50 px-4',
      className
    )}>
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            認証が必要です
          </h1>
          <p className="text-gray-600">
            このページにアクセスするには、ログインが必要です。
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onLogin && (
            <Button onClick={onLogin} className="w-full sm:w-auto">
              ログイン
            </Button>
          )}
          {onGoHome && (
            <Button 
              variant="outline" 
              onClick={onGoHome}
              className="w-full sm:w-auto"
            >
              <Home className="h-4 w-4 mr-2" />
              ホームに戻る
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ネットワークエラー専用コンポーネント
 */
export function NetworkError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <ErrorDisplay
      title="接続エラー"
      message="インターネット接続に問題があるようです。接続を確認してから再試行してください。"
      onRetry={onRetry}
      variant="card"
      className={className}
    />
  );
}

/**
 * サーバーエラー専用コンポーネント
 */
export function ServerError({ onRetry, className }: { onRetry?: () => void; className?: string }) {
  return (
    <ErrorDisplay
      title="サーバーエラー"
      message="サーバーで問題が発生しています。しばらく待ってから再試行してください。"
      onRetry={onRetry}
      variant="card"
      className={className}
    />
  );
}