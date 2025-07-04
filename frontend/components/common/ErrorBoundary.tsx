"use client";

import React, { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import {
  AppError,
  ErrorUtils,
  createErrorBoundaryError,
  ErrorType,
  ErrorSeverity,
} from "@/lib/errors";

interface ErrorInfo {
  componentStack: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  showDetails: boolean;
  copied: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      showDetails: false,
      copied: false,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error: null, // errorInfoで設定される
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = createErrorBoundaryError(error, errorInfo);

    this.setState({
      error: appError,
    });

    // エラーをログに記録
    ErrorUtils.logError(appError);

    // 親コンポーネントにエラーを通知
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      showDetails: false,
      copied: false,
    });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleToggleDetails = () => {
    this.setState((prev) => ({
      showDetails: !prev.showDetails,
    }));
  };

  handleCopyError = async () => {
    if (!this.state.error) return;

    const errorText = JSON.stringify(this.state.error.toLogObject(), null, 2);

    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error("Failed to copy error details:", err);
    }
  };

  renderErrorContent() {
    const { error } = this.state;
    const { showErrorDetails = process.env.NODE_ENV === "development" } =
      this.props;

    if (!error) {
      return this.renderGenericError();
    }

    const recoveryActions = ErrorUtils.getRecoveryActions(error);
    const isRetryable = ErrorUtils.isRetryable(error);

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              {this.getSeverityTitle(error.severity)}
            </CardTitle>
            <p className="text-gray-600 mt-2">{error.userMessage}</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* エラータイプ表示 */}
            <Alert>
              <Bug className="h-4 w-4" />
              <AlertDescription>
                エラータイプ: {this.getErrorTypeLabel(error.type)}
                {error.statusCode && ` (${error.statusCode})`}
              </AlertDescription>
            </Alert>

            {/* アクションボタン */}
            <div className="flex flex-col sm:flex-row gap-3">
              {isRetryable && (
                <Button
                  onClick={this.handleRetry}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  再試行
                </Button>
              )}

              {recoveryActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.type === "primary" ? "default" : "outline"}
                  onClick={action.action}
                  className="flex-1"
                >
                  {action.label === "ホームに戻る" && (
                    <Home className="h-4 w-4 mr-2" />
                  )}
                  {action.label}
                </Button>
              ))}
            </div>

            {/* エラー詳細（開発環境または明示的に有効化された場合） */}
            {showErrorDetails && (
              <div className="border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={this.handleToggleDetails}
                  className="w-full justify-between"
                >
                  <span>エラー詳細</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {this.state.showDetails && (
                  <div className="mt-4 space-y-3">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          技術的な詳細
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={this.handleCopyError}
                          className="h-auto p-1"
                        >
                          {this.state.copied ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="text-xs text-gray-600 space-y-1">
                        <p>
                          <strong>メッセージ:</strong> {error.technicalMessage}
                        </p>
                        <p>
                          <strong>タイムスタンプ:</strong>{" "}
                          {error.timestamp.toISOString()}
                        </p>

                        {error.context && (
                          <div>
                            <strong>コンテキスト:</strong>
                            <pre className="mt-1 bg-white p-2 rounded text-xs overflow-auto max-h-32">
                              {JSON.stringify(error.context, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      <p>この情報は開発者がエラーを調査するのに役立ちます。</p>
                      <p>本番環境では詳細は表示されません。</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ヘルプテキスト */}
            <div className="text-center text-sm text-gray-500">
              <p>
                問題が継続する場合は、しばらく待ってから再試行してください。
              </p>
              <p>
                それでも解決しない場合は、サポートまでお問い合わせください。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  renderGenericError() {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              エラーが発生しました
            </CardTitle>
            <p className="text-gray-600 mt-2">
              アプリケーションで予期しないエラーが発生しました
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                再試行
              </Button>
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                ホームに戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  getSeverityTitle(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW:
        return "軽微なエラー";
      case ErrorSeverity.MEDIUM:
        return "エラーが発生しました";
      case ErrorSeverity.HIGH:
        return "重要なエラー";
      case ErrorSeverity.CRITICAL:
        return "深刻なエラー";
      default:
        return "エラーが発生しました";
    }
  }

  getErrorTypeLabel(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return "ネットワークエラー";
      case ErrorType.AUTHENTICATION:
        return "認証エラー";
      case ErrorType.AUTHORIZATION:
        return "認可エラー";
      case ErrorType.VALIDATION:
        return "バリデーションエラー";
      case ErrorType.NOT_FOUND:
        return "リソースが見つかりません";
      case ErrorType.SERVER:
        return "サーバーエラー";
      case ErrorType.CLIENT:
        return "クライアントエラー";
      case ErrorType.UNKNOWN:
        return "不明なエラー";
      default:
        return "不明なエラー";
    }
  }

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックが提供されている場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return this.renderErrorContent();
    }

    return this.props.children;
  }
}

// より簡単に使用できるラッパーコンポーネント
interface SimpleErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SimpleErrorBoundary({
  children,
  fallback,
}: SimpleErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={fallback}
      onError={(error) => ErrorUtils.logError(error)}
    >
      {children}
    </ErrorBoundary>
  );
}

// セクション用のエラー境界（ページ全体ではなく部分的なエラー用）
interface SectionErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  message?: string;
}

export function SectionErrorBoundary({
  children,
  title = "このセクションでエラーが発生しました",
  message = "データの読み込み中に問題が発生しました",
}: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-sm mt-1">{message}</p>
            </div>
          </AlertDescription>
        </Alert>
      }
      onError={(error) => ErrorUtils.logError(error)}
    >
      {children}
    </ErrorBoundary>
  );
}
