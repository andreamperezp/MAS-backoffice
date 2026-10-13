import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/server/auth/token';

/**
 * Limpia la cookie de sesión y manda al login. Lo usan el cliente ante un 401 y
 * el layout cuando el JWT es válido pero el usuario ya no está activo (evita el
 * loop proxy → /panel → /login → proxy).
 */
export function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/login', req.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
