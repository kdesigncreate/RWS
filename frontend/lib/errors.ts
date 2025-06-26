/**
 * エラーハンドリングシステム
 * アプリケーション全体で統一されたエラー処理を提供
 */

// エラーの種類を定義
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN',
}

// エラーの重要度レベル
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// カスタムエラークラス
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly statusCode?: number;
  public readonly userMessage: string;
  public readonly technicalMessage: string;
  public readonly timestamp: Date;
  public readonly context?: Record<string, unknown>;

  constructor({
    type,
    severity = ErrorSeverity.MEDIUM,
    statusCode,
    userMessage,
    technicalMessage,
    context,
  }: {
    type: ErrorType;
    severity?: ErrorSeverity;
    statusCode?: number;
    userMessage: string;
    technicalMessage: string;
    context?: Record<string, unknown>;
  }) {
    super(technicalMessage);
    
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.technicalMessage = technicalMessage;
    this.timestamp = new Date();
    this.context = context;

    // Error.captureStackTrace があれば使用
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  // ログ出力用の情報を取得
  toLogObject() {
    return {
      name: this.name,
      type: this.type,
      severity: this.severity,
      statusCode: this.statusCode,
      userMessage: this.userMessage,
      technicalMessage: this.technicalMessage,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
    };
  }

  // ユーザー向けの情報を取得
  toUserObject() {
    return {
      type: this.type,
      message: this.userMessage,
      timestamp: this.timestamp,
    };
  }
}

// APIエラーレスポンスの型定義
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
  code?: string;
}

// エラーハンドラーの型定義
export type ErrorHandler = (error: AppError) => void;

// エラーリカバリーアクションの型定義
export interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  type?: 'primary' | 'secondary';
}

// エラー処理のユーティリティ関数
export class ErrorUtils {
  /**
   * APIエラーレスポンスからAppErrorを作成
   */
  static fromApiError(
    error: unknown,
    defaultMessage: string = 'エラーが発生しました'
  ): AppError {
    const errorObj = error as {
      response?: {
        status?: number;
        data?: ApiErrorResponse;
      };
      message?: string;
      config?: {
        url?: string;
        method?: string;
        data?: unknown;
      };
    };
    
    const response = errorObj.response;
    const data = response?.data;
    
    let type: ErrorType;
    let userMessage: string;
    const statusCode = response?.status;

    // ステータスコードに基づいてエラータイプを決定
    switch (statusCode) {
      case 400:
        type = ErrorType.VALIDATION;
        userMessage = data?.message || '入力内容に問題があります';
        break;
      case 401:
        type = ErrorType.AUTHENTICATION;
        userMessage = 'ログインが必要です';
        break;
      case 403:
        type = ErrorType.AUTHORIZATION;
        userMessage = 'アクセス権限がありません';
        break;
      case 404:
        type = ErrorType.NOT_FOUND;
        userMessage = '要求されたリソースが見つかりません';
        break;
      case 422:
        type = ErrorType.VALIDATION;
        userMessage = data?.message || 'データの検証に失敗しました';
        break;
      case 429:
        type = ErrorType.CLIENT;
        userMessage = 'リクエストが多すぎます。しばらく待ってから再試行してください';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        type = ErrorType.SERVER;
        userMessage = 'サーバーエラーが発生しました。しばらく待ってから再試行してください';
        break;
      default:
        if (!statusCode) {
          type = ErrorType.NETWORK;
          userMessage = 'ネットワークエラーが発生しました';
        } else {
          type = ErrorType.UNKNOWN;
          userMessage = defaultMessage;
        }
    }

    return new AppError({
      type,
      severity: (statusCode && statusCode >= 500) ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      statusCode,
      userMessage,
      technicalMessage: data?.message || errorObj.message || 'Unknown error',
      context: {
        url: errorObj.config?.url,
        method: errorObj.config?.method,
        data: errorObj.config?.data,
        errors: data?.errors,
      },
    });
  }

  /**
   * 一般的なJavaScriptエラーからAppErrorを作成
   */
  static fromError(
    error: Error,
    type: ErrorType = ErrorType.UNKNOWN,
    userMessage?: string
  ): AppError {
    return new AppError({
      type,
      severity: ErrorSeverity.MEDIUM,
      userMessage: userMessage || 'エラーが発生しました',
      technicalMessage: error.message,
      context: {
        stack: error.stack,
      },
    });
  }

  /**
   * バリデーションエラーを作成
   */
  static createValidationError(
    message: string,
    fields?: Record<string, string[]>
  ): AppError {
    return new AppError({
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.LOW,
      userMessage: message,
      technicalMessage: 'Validation failed',
      context: {
        fields,
      },
    });
  }

  /**
   * ネットワークエラーを作成
   */
  static createNetworkError(details?: string): AppError {
    return new AppError({
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      userMessage: 'ネットワーク接続に問題があります。インターネット接続を確認してください',
      technicalMessage: details || 'Network error occurred',
    });
  }

  /**
   * 認証エラーを作成
   */
  static createAuthenticationError(): AppError {
    return new AppError({
      type: ErrorType.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      userMessage: 'ログインセッションが無効です。再度ログインしてください',
      technicalMessage: 'Authentication required',
    });
  }

  /**
   * エラーをログに記録
   */
  static logError(error: AppError | Error, context?: Record<string, unknown>) {
    const errorData = error instanceof AppError 
      ? error.toLogObject() 
      : {
          name: error.name,
          message: error.message,
          stack: error.stack,
          timestamp: new Date(),
          context,
        };

    // 開発環境では詳細な情報をコンソールに出力
    if (process.env.NODE_ENV === 'development') {
      console.error('Error occurred:', errorData);
    }

    // 本番環境では外部サービスにログを送信
    if (process.env.NODE_ENV === 'production') {
      // TODO: 外部ログサービス（Sentry、LogRocket等）への送信
      // sendToLoggingService(errorData);
    }
  }

  /**
   * エラーが再試行可能かどうかを判定
   */
  static isRetryable(error: AppError): boolean {
    const retryableTypes = [
      ErrorType.NETWORK,
      ErrorType.SERVER,
    ];

    const retryableStatusCodes = [500, 502, 503, 504, 408, 429];

    return Boolean(
      retryableTypes.includes(error.type) ||
      (error.statusCode && retryableStatusCodes.includes(error.statusCode))
    );
  }

  /**
   * エラーの重要度に基づいて適切な通知方法を決定
   */
  static getNotificationMethod(error: AppError): 'toast' | 'modal' | 'page' {
    switch (error.severity) {
      case ErrorSeverity.LOW:
        return 'toast';
      case ErrorSeverity.MEDIUM:
        return 'toast';
      case ErrorSeverity.HIGH:
        return 'modal';
      case ErrorSeverity.CRITICAL:
        return 'page';
      default:
        return 'toast';
    }
  }

  /**
   * エラーに対する推奨アクションを取得
   */
  static getRecoveryActions(error: AppError): ErrorRecoveryAction[] {
    const actions: ErrorRecoveryAction[] = [];

    switch (error.type) {
      case ErrorType.NETWORK:
        actions.push({
          label: '再試行',
          action: () => window.location.reload(),
          type: 'primary',
        });
        break;

      case ErrorType.AUTHENTICATION:
        actions.push({
          label: 'ログイン',
          action: () => { window.location.href = '/admin'; },
          type: 'primary',
        });
        break;

      case ErrorType.NOT_FOUND:
        actions.push({
          label: 'ホームに戻る',
          action: () => { window.location.href = '/'; },
          type: 'primary',
        });
        break;

      case ErrorType.SERVER:
        if (ErrorUtils.isRetryable(error)) {
          actions.push({
            label: '再試行',
            action: () => window.location.reload(),
            type: 'primary',
          });
        }
        break;
    }

    // 共通アクション
    actions.push({
      label: 'ホームに戻る',
      action: () => { window.location.href = '/'; },
      type: 'secondary',
    });

    return actions;
  }
}

// エラー境界で使用するためのヘルパー
export const createErrorBoundaryError = (
  error: Error,
  errorInfo: { componentStack: string }
): AppError => {
  return new AppError({
    type: ErrorType.CLIENT,
    severity: ErrorSeverity.HIGH,
    userMessage: 'アプリケーションで予期しないエラーが発生しました',
    technicalMessage: error.message,
    context: {
      componentStack: errorInfo.componentStack,
      stack: error.stack,
    },
  });
};