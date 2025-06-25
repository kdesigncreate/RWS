/**
 * セキュアなAPIクライアント
 * 認証、レート制限、エラーハンドリング、ログを含む
 */

import { AppError, ErrorType, ErrorSeverity } from '@/lib/errors';
import { SecurityLogger } from '@/lib/security';

interface SecureApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  maxConcurrentRequests: number;
}

interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  skipAuth?: boolean;
  skipRateLimit?: boolean;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

class SecureApiClient {
  private config: SecureApiConfig;
  private activeRequests = new Set<AbortController>();
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;

  constructor(config: Partial<SecureApiConfig> = {}) {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
      timeout: 30000, // 30秒
      retries: 3,
      retryDelay: 1000, // 1秒
      maxConcurrentRequests: 10,
      ...config,
    };
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      return localStorage.getItem('auth_token');
    } catch (error) {
      console.warn('Failed to get auth token:', error);
      return null;
    }
  }

  private getCSRFToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
      return metaTag?.content || null;
    } catch (error) {
      console.warn('Failed to get CSRF token:', error);
      return null;
    }
  }

  private async makeRequest<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    this.activeRequests.add(controller);

    try {
      // リクエスト制限チェック
      if (this.activeRequests.size > this.config.maxConcurrentRequests) {
        throw new AppError({
          type: ErrorType.CLIENT,
          severity: ErrorSeverity.MEDIUM,
          userMessage: 'リクエストが多すぎます。しばらく待ってから再試行してください。',
          technicalMessage: 'Too many concurrent requests',
        });
      }

      // ヘッダーの設定
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      };

      // 認証トークンの追加
      if (!options.skipAuth) {
        const token = this.getAuthToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }

      // CSRFトークンの追加（POST、PUT、DELETE時）
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET')) {
        const csrfToken = this.getCSRFToken();
        if (csrfToken) {
          headers['X-CSRF-Token'] = csrfToken;
        }
      }

      // タイムアウト処理
      const timeout = options.timeout || this.config.timeout;
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);

      // リクエスト実行
      const response = await fetch(`${this.config.baseUrl}${url}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // レスポンスの検証
      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // レスポンスデータの取得
      let data: T;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as unknown as T;
      }

      // セキュリティログ
      SecurityLogger.logEvent('api_request', {
        method: options.method || 'GET',
        url: url.replace(/\/\d+/g, '/:id'), // IDをマスク
        status: response.status,
        duration: Date.now() - performance.now(),
      });

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AppError({
          type: ErrorType.NETWORK,
          severity: ErrorSeverity.MEDIUM,
          userMessage: 'リクエストがタイムアウトしました。',
          technicalMessage: 'Request timeout',
        });
      }

      // ネットワークエラー
      throw new AppError({
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.HIGH,
        userMessage: 'ネットワークエラーが発生しました。',
        technicalMessage: error instanceof Error ? error.message : 'Unknown network error',
      });

    } finally {
      this.activeRequests.delete(controller);
    }
  }

  private async handleErrorResponse(response: Response): Promise<void> {
    let errorData: any = {};
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        errorData = await response.json();
      }
    } catch {
      // JSONパースエラーは無視
    }

    switch (response.status) {
      case 400:
        throw new AppError({
          type: ErrorType.VALIDATION,
          severity: ErrorSeverity.LOW,
          userMessage: errorData.message || '入力内容に問題があります。',
          technicalMessage: `Bad Request: ${response.statusText}`,
          context: errorData,
        });

      case 401:
        // 認証エラー - トークンをクリア
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        throw new AppError({
          type: ErrorType.AUTH,
          severity: ErrorSeverity.HIGH,
          userMessage: '認証が必要です。ログインしてください。',
          technicalMessage: 'Unauthorized',
        });

      case 403:
        throw new AppError({
          type: ErrorType.AUTH,
          severity: ErrorSeverity.HIGH,
          userMessage: 'このリソースにアクセスする権限がありません。',
          technicalMessage: 'Forbidden',
        });

      case 404:
        throw new AppError({
          type: ErrorType.CLIENT,
          severity: ErrorSeverity.MEDIUM,
          userMessage: '要求されたリソースが見つかりません。',
          technicalMessage: 'Not Found',
        });

      case 429:
        throw new AppError({
          type: ErrorType.CLIENT,
          severity: ErrorSeverity.MEDIUM,
          userMessage: 'リクエストの頻度が高すぎます。しばらく待ってから再試行してください。',
          technicalMessage: 'Too Many Requests',
        });

      case 500:
        throw new AppError({
          type: ErrorType.SERVER,
          severity: ErrorSeverity.HIGH,
          userMessage: 'サーバーエラーが発生しました。しばらく待ってから再試行してください。',
          technicalMessage: 'Internal Server Error',
        });

      default:
        throw new AppError({
          type: ErrorType.SERVER,
          severity: ErrorSeverity.HIGH,
          userMessage: '予期しないエラーが発生しました。',
          technicalMessage: `HTTP ${response.status}: ${response.statusText}`,
        });
    }
  }

  private async retryRequest<T>(
    url: string,
    options: RequestOptions,
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    try {
      return await this.makeRequest<T>(url, options);
    } catch (error) {
      const maxRetries = options.retries ?? this.config.retries;
      
      if (attempt < maxRetries && this.shouldRetry(error)) {
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest<T>(url, options, attempt + 1);
      }
      
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    if (error instanceof AppError) {
      // サーバーエラーまたはネットワークエラーの場合のみリトライ
      return error.type === ErrorType.SERVER || error.type === ErrorType.NETWORK;
    }
    return false;
  }

  // パブリックAPIメソッド
  async get<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.retryRequest<T>(url, { ...options, method: 'GET' });
  }

  async post<T>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.retryRequest<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.retryRequest<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(url: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.retryRequest<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.retryRequest<T>(url, { ...options, method: 'DELETE' });
  }

  // ファイルアップロード用
  async upload<T>(url: string, formData: FormData, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const uploadOptions = { ...options };
    delete uploadOptions.headers; // Content-Typeを自動設定させる

    return this.retryRequest<T>(url, {
      ...uploadOptions,
      method: 'POST',
      body: formData,
    });
  }

  // すべてのリクエストをキャンセル
  cancelAllRequests(): void {
    this.activeRequests.forEach(controller => {
      controller.abort();
    });
    this.activeRequests.clear();
  }

  // ヘルスチェック
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', { timeout: 5000, retries: 1 });
      return true;
    } catch {
      return false;
    }
  }
}

// シングルトンインスタンス
export const secureApiClient = new SecureApiClient();

// 型定義
export type { SecureApiConfig, RequestOptions, ApiResponse };
export { SecureApiClient };