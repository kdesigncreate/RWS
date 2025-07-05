import { NextRequest, NextResponse } from "next/server";

// セキュリティヘッダーの追加
function addSecurityHeaders(response: NextResponse): NextResponse {
  // CSPを動的に生成（開発環境では緩和）
  const isDev = process.env.NODE_ENV === "development";
  const csp = isDev
    ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: blob: https:; connect-src 'self' ws: wss: https: http://localhost:* http://127.0.0.1:*; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com;"
    : "default-src 'self'; script-src 'self' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com https://*.vercel.app; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.vercel.app; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: https://i.ytimg.com https://*.ytimg.com; connect-src 'self' https://*.vercel.app https://*.supabase.co https://vercel.live https://va.vercel-scripts.com https://*.youtube.com https://*.googlevideo.com https://*.googleapis.com; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; media-src 'self' https://*.googlevideo.com https://*.youtube.com; worker-src 'self' blob:; child-src 'self' blob:; object-src 'none';";

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), autoplay=(self), fullscreen=(self)",
  );

  if (!isDev) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  return response;
}

// レート制限のための簡易チェック（本格的なレート制限にはRedis等が必要）
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

function isRateLimited(
  ip: string,
  limit: number = 100,
  windowMs: number = 60000,
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.lastReset > windowMs) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return false;
  }

  if (record.count >= limit) {
    return true;
  }

  record.count++;
  return false;
}

// ボット検出（簡易版）
function isBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /crawling/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /whatsapp/i,
    /telegrambot/i,
  ];

  return botPatterns.some((pattern) => pattern.test(userAgent));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent") || "";
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // 静的ファイルのキャッシュ最適化とMIMEタイプ修正（最優先）
  if (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/images/")
  ) {
    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );
    
    // CSSファイルの正しいMIMEタイプを設定
    if (pathname.endsWith(".css")) {
      response.headers.set("Content-Type", "text/css; charset=utf-8");
      response.headers.set("X-Content-Type-Options", "nosniff");
    }
    if (pathname.endsWith(".js")) {
      response.headers.set("Content-Type", "application/javascript; charset=utf-8");
      response.headers.set("X-Content-Type-Options", "nosniff");
    }
    if (pathname.endsWith(".json")) {
      response.headers.set("Content-Type", "application/json; charset=utf-8");
    }
    
    // セキュリティヘッダーは静的ファイルには適用しない（CSP問題回避）
    return response;
  }

  // ボット用の最適化されたレスポンス
  if (isBot(userAgent)) {
    // ボットには軽量なレスポンスを返す
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "index, follow");
    return addSecurityHeaders(response);
  }

  // API エンドポイントのレート制限
  if (pathname.startsWith("/api/")) {
    if (isRateLimited(ip, 200, 60000)) {
      // API: 1分間に200リクエスト
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": "200",
          "X-RateLimit-Remaining": "0",
        },
      });
    }
  }

  // 管理画面のレート制限（より厳しく）
  if (pathname.startsWith("/admin/")) {
    if (isRateLimited(`admin-${ip}`, 50, 60000)) {
      // 管理画面: 1分間に50リクエスト
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": "50",
          "X-RateLimit-Remaining": "0",
        },
      });
    }
  }

  // API プロキシ処理（改良版）
  if (pathname.startsWith("/api/")) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (supabaseUrl) {
      try {
        // Supabase URLが設定されている場合、Functions URLに書き換え
        const apiPath = pathname.replace("/api", "");
        const targetUrl = `${supabaseUrl}/functions/v1/api${apiPath}`;

        // クエリパラメータも保持
        const searchParams = request.nextUrl.searchParams.toString();
        const fullTargetUrl = searchParams
          ? `${targetUrl}?${searchParams}`
          : targetUrl;

        // 必要なヘッダーのみを転送（セキュリティを考慮）
        const headers = new Headers();
        const allowedHeaders = [
          "authorization",
          "content-type",
          "accept",
          "user-agent",
          "x-requested-with",
        ];

        allowedHeaders.forEach((headerName) => {
          const value = request.headers.get(headerName);
          if (value) {
            headers.set(headerName, value);
          }
        });

        const response = NextResponse.rewrite(new URL(fullTargetUrl), {
          request: { headers },
        });

        return addSecurityHeaders(response);
      } catch (error) {
        console.error("API proxy error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
      }
    }
  }

  // 管理画面のアクセス制御強化
  if (pathname.startsWith("/admin")) {
    // 開発環境でのデバッグログ
    if (process.env.NODE_ENV === "development") {
      console.log(`Admin access: ${pathname} from ${ip}`);
    }

    // 管理画面の基本的なセキュリティチェック
    const response = NextResponse.next();

    // 管理画面専用のセキュリティヘッダー
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Admin-Access", "true");

    return addSecurityHeaders(response);
  }


  // デフォルトレスポンス
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * But include _next/static for proper MIME type handling
     */
    "/((?!_next/image|favicon.ico).*)",
  ],
};
