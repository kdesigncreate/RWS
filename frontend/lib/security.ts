/**
 * セキュリティ強化システム
 * 認証、認可、入力検証、XSS/CSRF防止を統合管理
 */

// import { AppError, ErrorType, ErrorSeverity } from '@/lib/errors'; // 未実装のため一時的にコメントアウト

// セキュリティ設定
export const SECURITY_CONFIG = {
  // パスワード要件
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SYMBOLS: true,

  // セッション設定
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30分
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15分

  // CSRF設定
  CSRF_TOKEN_LENGTH: 32,
  CSRF_TOKEN_TIMEOUT: 60 * 60 * 1000, // 1時間

  // レート制限
  API_RATE_LIMIT: 100, // 1分間のリクエスト数
  LOGIN_RATE_LIMIT: 5, // 1分間のログイン試行数
} as const;

// 入力サニタイゼーション
export class InputSanitizer {
  /**
   * HTMLタグを除去
   */
  static stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, "");
  }

  /**
   * HTMLエンティティエスケープ
   */
  static escapeHtml(input: string): string {
    const entityMap: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "/": "&#x2F;",
      "`": "&#x60;",
      "=": "&#x3D;",
    };

    return input.replace(/[&<>"'`=/]/g, (char) => entityMap[char] || char);
  }

  /**
   * SQLインジェクション対策（基本的な文字をエスケープ）
   */
  static escapeSql(input: string): string {
    return input.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
      switch (char) {
        case "\0":
          return "\\0";
        case "\x08":
          return "\\b";
        case "\x09":
          return "\\t";
        case "\x1a":
          return "\\z";
        case "\n":
          return "\\n";
        case "\r":
          return "\\r";
        case '"':
        case "'":
        case "\\":
        case "%":
          return "\\" + char;
        default:
          return char;
      }
    });
  }

  /**
   * JavaScriptコードの除去
   */
  static removeJavaScript(input: string): string {
    // javascript: プロトコルの除去
    let sanitized = input.replace(/javascript:/gi, "");

    // on* イベントハンドラの除去
    sanitized = sanitized.replace(/\bon\w+\s*=/gi, "");

    // script タグの除去
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "",
    );

    return sanitized;
  }

  /**
   * URLの検証とサニタイズ
   */
  static sanitizeUrl(url: string): string {
    try {
      const urlObject = new URL(url);

      // 許可されたプロトコルのみ
      const allowedProtocols = ["http:", "https:", "mailto:", "tel:"];
      if (!allowedProtocols.includes(urlObject.protocol)) {
        throw new Error("Invalid protocol");
      }

      return urlObject.toString();
    } catch {
      return "#";
    }
  }

  /**
   * ファイル名のサニタイズ
   */
  static sanitizeFilename(filename: string): string {
    // 危険な文字を除去
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
      .replace(/^\.+/, "")
      .substring(0, 255);
  }
}

// パスワード強度チェック
export class PasswordValidator {
  /**
   * パスワードの強度を検証
   */
  static validate(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // 長さチェック
    if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
      errors.push(
        `パスワードは${SECURITY_CONFIG.PASSWORD_MIN_LENGTH}文字以上である必要があります`,
      );
    } else {
      score += 1;
    }

    // 大文字チェック
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errors.push("大文字を含む必要があります");
    } else if (/[A-Z]/.test(password)) {
      score += 1;
    }

    // 小文字チェック
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errors.push("小文字を含む必要があります");
    } else if (/[a-z]/.test(password)) {
      score += 1;
    }

    // 数字チェック
    if (SECURITY_CONFIG.PASSWORD_REQUIRE_NUMBERS && !/[0-9]/.test(password)) {
      errors.push("数字を含む必要があります");
    } else if (/[0-9]/.test(password)) {
      score += 1;
    }

    // 記号チェック
    if (
      SECURITY_CONFIG.PASSWORD_REQUIRE_SYMBOLS &&
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      errors.push("記号を含む必要があります");
    } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    }

    // 一般的なパスワードチェック
    const commonPasswords = [
      "password",
      "123456",
      "123456789",
      "qwerty",
      "abc123",
      "password123",
      "admin",
      "root",
      "user",
      "guest",
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push("一般的すぎるパスワードです");
      score -= 2;
    }

    // 連続文字チェック
    if (/(.)\1{2,}/.test(password)) {
      errors.push("同じ文字の連続は避けてください");
      score -= 1;
    }

    // スコア調整
    score = Math.max(0, Math.min(5, score));

    return {
      isValid: errors.length === 0,
      errors,
      score,
    };
  }

  /**
   * パスワード強度のテキスト
   */
  static getStrengthText(score: number): string {
    switch (score) {
      case 0:
      case 1:
        return "非常に弱い";
      case 2:
        return "弱い";
      case 3:
        return "普通";
      case 4:
        return "強い";
      case 5:
        return "非常に強い";
      default:
        return "不明";
    }
  }

  /**
   * パスワード強度の色
   */
  static getStrengthColor(score: number): string {
    switch (score) {
      case 0:
      case 1:
        return "text-red-600";
      case 2:
        return "text-orange-600";
      case 3:
        return "text-yellow-600";
      case 4:
        return "text-blue-600";
      case 5:
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  }
}

// CSRF保護
export class CSRFProtection {
  private static tokens = new Map<string, number>();

  /**
   * CSRFトークンを生成
   */
  static generateToken(): string {
    const token = this.generateRandomString(SECURITY_CONFIG.CSRF_TOKEN_LENGTH);
    this.tokens.set(token, Date.now());
    return token;
  }

  /**
   * CSRFトークンを検証
   */
  static validateToken(token: string): boolean {
    const timestamp = this.tokens.get(token);

    if (!timestamp) {
      return false;
    }

    // トークンの有効期限チェック
    if (Date.now() - timestamp > SECURITY_CONFIG.CSRF_TOKEN_TIMEOUT) {
      this.tokens.delete(token);
      return false;
    }

    return true;
  }

  /**
   * 期限切れトークンをクリーンアップ
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [token, timestamp] of this.tokens.entries()) {
      if (now - timestamp > SECURITY_CONFIG.CSRF_TOKEN_TIMEOUT) {
        this.tokens.delete(token);
      }
    }
  }

  private static generateRandomString(length: number): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// レート制限
export class RateLimiter {
  private static requests = new Map<
    string,
    { count: number; resetTime: number }
  >();

  /**
   * レート制限チェック
   */
  static checkLimit(
    identifier: string,
    limit: number,
    windowMs: number = 60000,
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetTime) {
      // 新しいウィンドウ
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });

      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: now + windowMs,
      };
    }

    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    entry.count++;

    return {
      allowed: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * レート制限をリセット
   */
  static reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * 期限切れエントリをクリーンアップ
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// セッション管理
export class SessionManager {
  /**
   * セッションの有効性をチェック
   */
  static isValidSession(lastActivity: number): boolean {
    return Date.now() - lastActivity < SECURITY_CONFIG.SESSION_TIMEOUT;
  }

  /**
   * セッションを更新
   */
  static updateSession(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("lastActivity", Date.now().toString());
    }
  }

  /**
   * セッションをクリア
   */
  static clearSession(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("lastActivity");
      sessionStorage.clear();
    }
  }

  /**
   * 最後のアクティビティ時間を取得
   */
  static getLastActivity(): number {
    if (typeof window === "undefined") return 0;

    const lastActivity = localStorage.getItem("lastActivity");
    return lastActivity ? parseInt(lastActivity, 10) : 0;
  }
}

// ブルートフォース攻撃対策
export class BruteForceProtection {
  private static attempts = new Map<
    string,
    { count: number; lockedUntil?: number }
  >();

  /**
   * ログイン試行を記録
   */
  static recordAttempt(
    identifier: string,
    success: boolean,
  ): {
    allowed: boolean;
    attemptsRemaining: number;
    lockedUntil?: number;
  } {
    const entry = this.attempts.get(identifier) || { count: 0 };

    if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
      return {
        allowed: false,
        attemptsRemaining: 0,
        lockedUntil: entry.lockedUntil,
      };
    }

    if (success) {
      // 成功時はカウンターをリセット
      this.attempts.delete(identifier);
      return {
        allowed: true,
        attemptsRemaining: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS,
      };
    }

    // 失敗時はカウンターを増加
    entry.count++;

    if (entry.count >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      entry.lockedUntil = Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION;
      this.attempts.set(identifier, entry);

      return {
        allowed: false,
        attemptsRemaining: 0,
        lockedUntil: entry.lockedUntil,
      };
    }

    this.attempts.set(identifier, entry);

    return {
      allowed: true,
      attemptsRemaining: SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - entry.count,
    };
  }

  /**
   * アカウントロックを解除
   */
  static unlock(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * 期限切れエントリをクリーンアップ
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.attempts.entries()) {
      if (entry.lockedUntil && now > entry.lockedUntil) {
        this.attempts.delete(key);
      }
    }
  }
}

// セキュリティイベントログ
export class SecurityLogger {
  /**
   * セキュリティイベントをログ出力
   */
  static logEvent(
    eventType:
      | "auth_failure"
      | "rate_limit"
      | "csp_violation"
      | "xss_attempt"
      | "suspicious_activity",
    details: Record<string, unknown>,
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: eventType,
      userAgent: typeof window !== "undefined" ? navigator.userAgent : "",
      url: typeof window !== "undefined" ? window.location.href : "",
      ...details,
    };

    // 開発環境ではコンソールに出力
    if (process.env.NODE_ENV === "development") {
      console.warn("[Security Event]", logEntry);
    }

    // 本番環境では外部サービスに送信
    if (process.env.NODE_ENV === "production") {
      this.sendToSecurityService(logEntry);
    }
  }

  private static async sendToSecurityService(
    logEntry: Record<string, unknown>,
  ): Promise<void> {
    try {
      // セキュリティ監視サービスへの送信
      if (process.env.NEXT_PUBLIC_SECURITY_ENDPOINT) {
        await fetch(process.env.NEXT_PUBLIC_SECURITY_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(logEntry),
        });
      }
    } catch (error) {
      console.error("Failed to send security log:", error);
    }
  }
}

// セキュリティミドルウェア
export class SecurityMiddleware {
  /**
   * リクエストのセキュリティチェック
   */
  static validateRequest(request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: unknown;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Content-Type チェック
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      const contentType = request.headers["content-type"];
      if (!contentType || !contentType.includes("application/json")) {
        errors.push("Invalid Content-Type");
      }
    }

    // Origin チェック
    const origin = request.headers["origin"];
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_FRONTEND_URL,
      "http://localhost:3000",
      "https://rws-dribble.com",
    ].filter(Boolean);

    if (origin && !allowedOrigins.includes(origin)) {
      errors.push("Invalid Origin");
    }

    // User-Agent チェック
    const userAgent = request.headers["user-agent"];
    if (!userAgent || userAgent.length < 10) {
      errors.push("Invalid User-Agent");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// 定期的なクリーンアップ
if (typeof window !== "undefined") {
  // 5分ごとにクリーンアップ実行
  setInterval(
    () => {
      CSRFProtection.cleanup();
      RateLimiter.cleanup();
      BruteForceProtection.cleanup();
    },
    5 * 60 * 1000,
  );
}
