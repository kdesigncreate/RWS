'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  ArrowLeft,
  Bug,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';
import { AppError, ErrorUtils, ErrorType, ErrorSeverity } from '@/lib/errors';
import { useState } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  // ErrorをAppErrorに変換
  const appError = new AppError({
    type: ErrorType.CLIENT,
    severity: ErrorSeverity.HIGH,
    userMessage: 'ページの読み込み中にエラーが発生しました',
    technicalMessage: error.message,
    context: {
      digest: error.digest,
      stack: error.stack,
    },
  });

  // エラーをログに記録
  ErrorUtils.logError(appError);

  const handleCopyError = async () => {
    const errorText = JSON.stringify({
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    }, null, 2);

    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const isRetryable = ErrorUtils.isRetryable(appError);
  const recoveryActions = ErrorUtils.getRecoveryActions(appError);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            ページでエラーが発生しました
          </CardTitle>
          <p className="text-gray-600 mt-2">
            {appError.userMessage}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* エラータイプ表示 */}
          <Alert>
            <Bug className="h-4 w-4" />
            <AlertDescription>
              申し訳ございません。技術的な問題が発生いたしました。
              {error.digest && (
                <span className="block text-xs text-gray-500 mt-1">
                  エラーID: {error.digest}
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row gap-3">
            {isRetryable && (
              <Button 
                onClick={reset} 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                再試行
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              前のページに戻る
            </Button>

            <Button
              variant="outline"
              onClick={handleGoHome}
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              ホームに戻る
            </Button>
          </div>

          {/* エラー詳細（開発環境のみ） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full justify-between"
              >
                <span>開発者向け詳細情報</span>
                {showDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showDetails && (
                <div className="mt-4 space-y-3">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        エラー詳細
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyError}
                        className="h-auto p-1"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <p><strong>メッセージ:</strong> {error.message}</p>
                      {error.digest && (
                        <p><strong>ダイジェスト:</strong> {error.digest}</p>
                      )}
                      
                      {error.stack && (
                        <div>
                          <strong>スタックトレース:</strong>
                          <pre className="mt-1 bg-white p-2 rounded text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                            {error.stack}
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
          <div className="text-center text-sm text-gray-500 space-y-1">
            <p>問題が継続する場合は、ページを再読み込みしてください。</p>
            <p>それでも解決しない場合は、サポートまでお問い合わせください。</p>
            
            {/* 連絡先情報があれば表示 */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs">
                お困りの際は、R.W.Sドリブル塾までお気軽にお問い合わせください。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}