import { NextRequest, NextResponse } from 'next/server'

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

  // Verificação simples do token (apenas se existe e não está vazio)
  // A verificação completa do JWT será feita nas APIs
  if (token && token.length > 10) {
    console.log('Middleware: Token valid, allowing access')
    return NextResponse.next()
  } else {
    console.log('Middleware: Token invalid, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match only API routes that need authentication
     * Client-side routes will be handled by AuthenticatedLayout
     */
    '/api/((?!auth).*)',
  ],
}