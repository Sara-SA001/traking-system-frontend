import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('tracking_token')?.value;
  const role = request.cookies.get('tracking_role')?.value;
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isProtectedPage = pathname.startsWith('/admin') || pathname.startsWith('/teacher') || pathname.startsWith('/dashboard');

  if (!token && isProtectedPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (token && isAuthPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = role === 'ADMIN' ? '/admin' : role === 'TEACHER' ? '/teacher' : '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith('/admin') && role && role !== 'ADMIN') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = role === 'TEACHER' ? '/teacher' : '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith('/teacher') && role && role !== 'TEACHER') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = role === 'ADMIN' ? '/admin' : '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/register', '/admin/:path*', '/teacher/:path*', '/dashboard/:path*'],
};
