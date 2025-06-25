'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug,
  RotateCcw
} from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    // グローバルエラーをログに記録
    console.error('Global error occurred:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // 本番環境では外部サービスにログを送信
    if (process.env.NODE_ENV === 'production') {
      // TODO: 外部ログサービス（Sentry、LogRocket等）への送信
      // sendErrorToLoggingService(error);
    }
  }, [error]);

  const handleReloadPage = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <html>
      <body>
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-red-200">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-xl font-bold text-red-900">
                深刻なエラーが発生しました
              </CardTitle>
              <p className="text-red-700 mt-2 text-sm">
                アプリケーションで回復不可能なエラーが発生しました
              </p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* エラー情報 */}
              <div className="bg-red-100 p-3 rounded-lg border border-red-200">
                <div className="flex items-center mb-2">
                  <Bug className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-sm font-medium text-red-900">
                    エラーの詳細
                  </span>
                </div>
                <p className="text-xs text-red-800">
                  システムレベルのエラーが発生し、正常な動作を継続できません。
                </p>
                {error.digest && (
                  <p className="text-xs text-red-600 mt-1">
                    エラーID: {error.digest}
                  </p>
                )}
              </div>

              {/* 対処方法 */}
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <h4 className="text-sm font-medium text-yellow-900 mb-2">
                  解決方法:
                </h4>
                <ul className="text-xs text-yellow-800 space-y-1">
                  <li>1. ページを再読み込みする</li>
                  <li>2. ブラウザのキャッシュをクリアする</li>
                  <li>3. 異なるブラウザで試す</li>
                  <li>4. しばらく時間をおいて再度アクセスする</li>
                </ul>
              </div>

              {/* アクションボタン */}
              <div className="space-y-2">
                <Button 
                  onClick={reset}
                  className="w-full bg-red-600 text-white hover:bg-red-700"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  アプリを再起動
                </Button>

                <Button 
                  onClick={handleReloadPage}
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  ページを再読み込み
                </Button>

                <Button 
                  onClick={handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  ホームページに移動
                </Button>
              </div>

              {/* サポート情報 */}
              <div className="text-center text-xs text-gray-600 border-t pt-4">
                <p>問題が継続する場合は、以下の情報をお控えの上、</p>
                <p>サポートまでお問い合わせください:</p>
                <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-xs">
                  {error.digest ? `エラーID: ${error.digest}` : `時刻: ${new Date().toISOString()}`}
                </div>
              </div>

              {/* 開発環境での詳細表示 */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4">
                  <summary className="text-xs text-gray-500 cursor-pointer">
                    開発者向け詳細情報
                  </summary>
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                    <div><strong>Message:</strong> {error.message}</div>
                    {error.stack && (
                      <div className="mt-2">
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-32">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}