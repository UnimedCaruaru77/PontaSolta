import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log('Middleware: Checking path', pathname)

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login', '/api/auth/login']
  
  if (publicRoutes.includes(pathname)) {
    console.log('Middleware: Public route, allowing access')
    return NextResponse.next()
  }

  // Verificar token de autenticação
  const token = request.cookies.get('auth-token')?.value
  console.log('Middleware: Token exists', !!token)

  if (!token) {
    console.log('Middleware: No token, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret')
    console.log('Middleware: Token valid, allowing access')
    return NextResponse.next()
  } catch (error) {
    console.log('Middleware: Token invalid, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}