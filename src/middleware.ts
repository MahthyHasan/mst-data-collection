import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Check role-based access
    const isAdminRoute =
      path.startsWith('/users') ||
      path.startsWith('/audit-logs') ||
      path.startsWith('/auth-logs') ||
      path.startsWith('/api/users') ||
      path.startsWith('/api/audit-logs') ||
      path.startsWith('/api/auth-logs');

    if (isAdminRoute && token?.role !== 'admin') {
      // Redirect unauthorized users to access denied page
      return NextResponse.rewrite(new URL('/unauthorized', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth endpoints)
     * - login (login page)
     * - unauthorized (access denied page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api/auth|login|unauthorized|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
