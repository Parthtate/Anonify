import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// '/' is deliberately absent: the landing page is public and adapts to the signed-in
// user instead of bouncing them to the dashboard.
export const config = {
  matcher: ['/dashboard/:path*', '/sign-in', '/sign-up', '/verify/:path*'],
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const url = request.nextUrl;

  // Signed-in users have no use for the sign-up or verification flows.
  if (
    token &&
    (url.pathname.startsWith('/sign-in') ||
      url.pathname.startsWith('/sign-up') ||
      url.pathname.startsWith('/verify'))
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!token && url.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
}
