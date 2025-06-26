import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  console.log('MIDDLEWARE: Intercepting request to', request.url);
  
  // Supabase直接アクセスを検出してリダイレクト
  if (request.url.includes('ixrwzaasrxoshjnpxnme.supabase.co/rest/v1/login')) {
    console.warn('MIDDLEWARE: Redirecting Supabase login to our API');
    const url = request.nextUrl.clone();
    url.pathname = '/api/login';
    url.hostname = request.nextUrl.hostname;
    url.protocol = request.nextUrl.protocol;
    url.port = request.nextUrl.port;
    return NextResponse.redirect(url);
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