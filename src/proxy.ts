import { NextResponse, type NextRequest } from 'next/server';
import { inicioPorRol, puedeVer, seccionDeRuta } from '@/domain/permisos';
import { SESSION_COOKIE, verificarSesion } from '@/server/auth/token';

/**
 * Chequeo optimista de sesión y rol para redirigir rápido sin renderizar.
 * No reemplaza la autorización: cada Route Handler y layout vuelve a validar
 * la sesión contra los datos (ver `server/auth/session.ts`).
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sesion = await verificarSesion(req.cookies.get(SESSION_COOKIE)?.value);
  const ir = (destino: string) => NextResponse.redirect(new URL(destino, req.url));

  if (pathname === '/') return ir(sesion ? inicioPorRol(sesion.rol) : '/login');

  if (pathname === '/login') return sesion ? ir(inicioPorRol(sesion.rol)) : NextResponse.next();

  const seccion = seccionDeRuta(pathname);
  if (seccion) {
    if (!sesion) {
      const login = new URL('/login', req.url);
      login.searchParams.set('volver', pathname);
      return NextResponse.redirect(login);
    }
    if (!puedeVer(seccion, sesion.rol)) return ir(inicioPorRol(sesion.rol));
  }

  return NextResponse.next();
}

export const config = {
  // Las rutas /api/* responden 401/403 en JSON por su cuenta.
  matcher: ['/((?!api|_next/static|_next/image|brand|mock|favicon.ico).*)'],
};
