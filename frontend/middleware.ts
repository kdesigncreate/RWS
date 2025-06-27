import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // 管理画面のパスでの基本的なルーティング処理のみ実装
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/dashboard')) {
    // 管理画面アクセス時の基本処理
    console.log('Admin access:', request.nextUrl.pathname);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};