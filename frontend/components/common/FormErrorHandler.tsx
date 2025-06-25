'use client';

import React from 'react';
import { FieldError, FieldErrors } from 'react-hook-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, X, CheckCircle } from 'lucide-react';
import { AppError, ErrorType } from '@/lib/errors';

// 単一フィールドエラー表示コンポーネント
interface FieldErrorDisplayProps {
  error?: FieldError;
  className?: string;
}

export function FieldErrorDisplay({ error, className = '' }: FieldErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className={`text-sm text-red-600 mt-1 flex items-center ${className}`}>
      <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
      <span>{error.message}</span>
    </div>
  );
}

// 複数フィールドエラー表示コンポーネント
interface FormErrorSummaryProps {
  errors: FieldErrors;
  title?: string;
  className?: string;
  showFieldNames?: boolean;
}

export function FormErrorSummary({ 
  errors, 
  title = 'フォームにエラーがあります',
  className = '',
  showFieldNames = true 
}: FormErrorSummaryProps) {
  const errorEntries = Object.entries(errors).filter(([_, error]) => error?.message);

  if (errorEntries.length === 0) return null;

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div>
          <p className="font-medium mb-2">{title}</p>
          <ul className="space-y-1">
            {errorEntries.map(([fieldName, error]) => (
              <li key={fieldName} className="text-sm flex items-start">
                <span className="mr-2">•</span>
                <div>
                  {showFieldNames && (
                    <Badge variant="outline" className="mr-2 text-xs">
                      {getFieldDisplayName(fieldName)}
                    </Badge>
                  )}
                  <span>{error?.message}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
}

// APIエラー表示コンポーネント
interface ApiErrorDisplayProps {
  error: AppError | Error | string | null;
  className?: string;
  showRetry?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ApiErrorDisplay({ 
  error, 
  className = '',
  showRetry = false,
  onRetry,
  onDismiss 
}: ApiErrorDisplayProps) {
  if (!error) return null;

  let errorMessage: string;
  let errorType: ErrorType | undefined;
  let canRetry = false;

  if (error instanceof AppError) {
    errorMessage = error.userMessage;
    errorType = error.type;
    canRetry = showRetry && (onRetry !== undefined);
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else {
    errorMessage = error;
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium">{errorMessage}</p>
            
            {errorType && (
              <div className="mt-1">
                <Badge variant="outline" className="text-xs">
                  {getErrorTypeDisplayName(errorType)}
                </Badge>
              </div>
            )}
            
            {canRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-sm underline hover:no-underline"
              >
                再試行
              </button>
            )}
          </div>
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="ml-2 text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// 成功メッセージ表示コンポーネント
interface SuccessMessageProps {
  message: string;
  className?: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function SuccessMessage({ 
  message, 
  className = '',
  onDismiss,
  autoHide = false,
  autoHideDelay = 3000 
}: SuccessMessageProps) {
  React.useEffect(() => {
    if (autoHide && onDismiss) {
      const timer = setTimeout(onDismiss, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onDismiss]);

  return (
    <Alert className={`border-green-200 bg-green-50 text-green-800 ${className}`}>
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <span>{message}</span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="ml-2 text-green-600 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

// バリデーション状態表示コンポーネント
interface ValidationStatusProps {
  isValid: boolean;
  isValidating?: boolean;
  isDirty?: boolean;
  className?: string;
}

export function ValidationStatus({ 
  isValid, 
  isValidating = false, 
  isDirty = false,
  className = '' 
}: ValidationStatusProps) {
  if (!isDirty) return null;

  return (
    <div className={`flex items-center space-x-1 text-xs ${className}`}>
      {isValidating ? (
        <>
          <div className="animate-spin h-3 w-3 border border-blue-300 border-t-blue-600 rounded-full" />
          <span className="text-blue-600">検証中...</span>
        </>
      ) : isValid ? (
        <>
          <CheckCircle className="h-3 w-3 text-green-600" />
          <span className="text-green-600">入力内容は有効です</span>
        </>
      ) : (
        <>
          <AlertTriangle className="h-3 w-3 text-red-600" />
          <span className="text-red-600">入力内容を確認してください</span>
        </>
      )}
    </div>
  );
}

// フォーム送信状態表示コンポーネント
interface FormSubmissionStatusProps {
  isSubmitting: boolean;
  error?: AppError | Error | string | null;
  success?: string | null;
  className?: string;
  onRetry?: () => void;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
}

export function FormSubmissionStatus({
  isSubmitting,
  error,
  success,
  className = '',
  onRetry,
  onDismissError,
  onDismissSuccess
}: FormSubmissionStatusProps) {
  if (isSubmitting) {
    return (
      <Alert className={`border-blue-200 bg-blue-50 text-blue-800 ${className}`}>
        <div className="animate-spin h-4 w-4 border border-blue-300 border-t-blue-600 rounded-full" />
        <AlertDescription>
          送信中です。しばらくお待ちください...
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <ApiErrorDisplay
        error={error}
        className={className}
        showRetry={!!onRetry}
        onRetry={onRetry}
        onDismiss={onDismissError}
      />
    );
  }

  if (success) {
    return (
      <SuccessMessage
        message={success}
        className={className}
        onDismiss={onDismissSuccess}
        autoHide={true}
      />
    );
  }

  return null;
}

// リアルタイムバリデーション表示コンポーネント
interface RealTimeValidationProps {
  field: string;
  value: any;
  rules: ValidationRule[];
  className?: string;
}

interface ValidationRule {
  test: (value: any) => boolean;
  message: string;
  type?: 'error' | 'warning' | 'info';
}

export function RealTimeValidation({
  field,
  value,
  rules,
  className = ''
}: RealTimeValidationProps) {
  const results = rules.map(rule => ({
    ...rule,
    passed: rule.test(value),
  }));

  if (!value || results.length === 0) return null;

  return (
    <div className={`mt-2 space-y-1 ${className}`}>
      {results.map((result, index) => (
        <div key={index} className="flex items-center space-x-2 text-xs">
          {result.passed ? (
            <CheckCircle className="h-3 w-3 text-green-600" />
          ) : (
            <X className="h-3 w-3 text-red-600" />
          )}
          <span className={result.passed ? 'text-green-600' : 'text-red-600'}>
            {result.message}
          </span>
        </div>
      ))}
    </div>
  );
}

// ヘルパー関数
function getFieldDisplayName(fieldName: string): string {
  const displayNames: Record<string, string> = {
    email: 'メールアドレス',
    password: 'パスワード',
    title: 'タイトル',
    content: '本文',
    excerpt: '要約',
    status: 'ステータス',
    name: '名前',
    phone: '電話番号',
    address: '住所',
    message: 'メッセージ',
    confirmPassword: 'パスワード（確認）',
  };

  return displayNames[fieldName] || fieldName;
}

function getErrorTypeDisplayName(errorType: ErrorType): string {
  const displayNames: Record<ErrorType, string> = {
    [ErrorType.NETWORK]: 'ネットワークエラー',
    [ErrorType.AUTHENTICATION]: '認証エラー',
    [ErrorType.AUTHORIZATION]: '認可エラー',
    [ErrorType.VALIDATION]: 'バリデーションエラー',
    [ErrorType.NOT_FOUND]: 'リソースが見つかりません',
    [ErrorType.SERVER]: 'サーバーエラー',
    [ErrorType.CLIENT]: 'クライアントエラー',
    [ErrorType.UNKNOWN]: '不明なエラー',
  };

  return displayNames[errorType] || 'エラー';
}

// パスワード強度チェック用のバリデーションルール
export const passwordStrengthRules: ValidationRule[] = [
  {
    test: (value: string) => value && value.length >= 8,
    message: '8文字以上',
  },
  {
    test: (value: string) => /[A-Z]/.test(value),
    message: '大文字を含む',
  },
  {
    test: (value: string) => /[a-z]/.test(value),
    message: '小文字を含む',
  },
  {
    test: (value: string) => /[0-9]/.test(value),
    message: '数字を含む',
  },
  {
    test: (value: string) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
    message: '特殊文字を含む',
  },
];

// メールアドレス形式チェック用のバリデーションルール
export const emailValidationRules: ValidationRule[] = [
  {
    test: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: '有効なメールアドレス形式',
  },
];