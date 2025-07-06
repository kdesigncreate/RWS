import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit, adminRateLimit } from "@/lib/rateLimit";

// セキュリティヘッダーの追加
function addSecurityHeaders(response: NextResponse): NextResponse {
  // CSPを動的に生成（開発環境では緩和）
  const isDev = process.env.NODE_ENV === "development";
  const csp = isDev
    ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: blob: https: https://i.ytimg.com https://*.ytimg.com; connect-src 'self' ws: wss: https: http://localhost:* http://127.0.0.1:* https://*.youtube.com https://*.googlevideo.com; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; media-src 'self' https://*.googlevideo.com https://*.youtube.com;"
    : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: https://i.ytimg.com https://*.ytimg.com; connect-src 'self' https://*.supabase.co https://vercel.live https://va.vercel-scripts.com https://*.youtube.com https://*.googlevideo.com https://*.googleapis.com https://*.vercel.app https://rws-kentas-projects-9fa01438.vercel.app https://rws-ruddy.vercel.app; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; media-src 'self' https://*.googlevideo.com https://*.youtube.com; worker-src 'self' blob:; child-src 'self' blob:; object-src 'none';";

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

// Supabase-based rate limiting for serverless environment
async function checkRateLimit(
  ip: string,
  endpoint: string,
  isAdmin: boolean = false
): Promise<{
  isLimited: boolean
  remaining: number
  resetTime: Date
}> {
  const rateLimit = isAdmin ? adminRateLimit : apiRateLimit
  return await rateLimit.isRateLimited(ip, endpoint)
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent") || "";
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Admin pages - 緩和されたCSP設定（セキュリティ維持）
  if (pathname.startsWith("/admin")) {
    const response = NextResponse.next();
    // AdminページでもCSPを適用するが、Next.jsに必要な設定を含める
    // 管理者ページでは、より緩和されたCSPを適用（YouTube対応を含む）
    const adminCsp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: https://i.ytimg.com https://*.ytimg.com; connect-src 'self' https: wss: ws: https://*.youtube.com https://*.googlevideo.com https://*.googleapis.com; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; media-src 'self' https://*.googlevideo.com https://*.youtube.com; object-src 'none'; base-uri 'self'; form-action 'self';";
    response.headers.set("Content-Security-Policy", adminCsp);
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("X-Admin-Access", "true");
    return response;
  }

  // ボット用の最適化されたレスポンス
  if (isBot(userAgent)) {
    // ボットには軽量なレスポンスを返す
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "index, follow");
    return addSecurityHeaders(response);
  }

  // API エンドポイントのレート制限（Supabase-based）
  if (pathname.startsWith("/api/")) {
    const rateLimitResult = await checkRateLimit(ip, pathname, false);
    if (rateLimitResult.isLimited) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": "200",
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toISOString(),
        },
      });
    }
  }

  // 管理画面のレート制限（より厳しく、Supabase-based）
  if (pathname.startsWith("/admin/")) {
    const rateLimitResult = await checkRateLimit(ip, pathname, true);
    if (rateLimitResult.isLimited) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": "50",
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toISOString(),
        },
      });
    }
  }

  // API プロキシ処理（fetch-based proxy）
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

        // リクエストボディを取得（POSTリクエストの場合）
        let body = undefined;
        if (request.method !== "GET" && request.method !== "HEAD") {
          body = await request.text();
        }

        // Supabase Functionsにリクエストをプロキシ
        const proxyResponse = await fetch(fullTargetUrl, {
          method: request.method,
          headers: headers,
          body: body,
        });

        // レスポンスを作成
        const responseBody = await proxyResponse.text();
        const response = new NextResponse(responseBody, {
          status: proxyResponse.status,
          statusText: proxyResponse.statusText,
          headers: {
            'content-type': proxyResponse.headers.get('content-type') || 'application/json',
          },
        });

        return addSecurityHeaders(response);
      } catch (error) {
        console.error("API proxy error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new NextResponse(`Proxy Error: ${errorMessage}`, { status: 500 });
      }
    }
  }

  // デフォルトレスポンス
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static assets:
     * - _next/static (静的ファイル - CSS/JS等は除外)
     * - _next/image (画像最適化)
     * - favicon.ico (ファビコン)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:css|js|ico|png|jpg|jpeg|gif|svg|woff|woff2)$).*)",
  ],
};
