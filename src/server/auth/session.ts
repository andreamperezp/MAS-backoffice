import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { inicioPorRol } from '@/domain/permisos';
import type { Rol, SessionUser } from '@/domain/types';
import { AppError } from '../errors';
import { repos } from '../repositories';
import { firmarSesion, SESSION_COOKIE, SESSION_DURACION_SEG, verificarSesion } from './token';

/**
 * Data Access Layer de autenticación. `proxy.ts` hace un chequeo optimista; la
 * autorización real se hace acá, cerca de los datos, en cada request.
 */

export async function crearSesion(user: SessionUser): Promise<void> {
  const token = await firmarSesion(user);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURACION_SEG,
  });
}

export async function cerrarSesion(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * Usuario actual validado contra el repositorio: si fue desactivado o cambió de
 * rol, la sesión vieja deja de valer aunque el JWT siga vigente.
 */
export async function usuarioActual(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const sesion = await verificarSesion(token);
  if (!sesion) return null;

  const usuario = await repos().usuarios.obtener(sesion.id);
  if (!usuario || usuario.estado !== 'activo') return null;
  return { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
}

/** Para Route Handlers: lanza 401/403 en vez de redirigir. */
export async function requerirUsuario(roles?: Rol[]): Promise<SessionUser> {
  const user = await usuarioActual();
  if (!user) throw new AppError('NO_AUTENTICADO', 'Tu sesión expiró. Volvé a iniciar sesión.');
  if (roles && !roles.includes(user.rol)) {
    throw new AppError('SIN_PERMISO', 'No tenés permisos para realizar esta acción.');
  }
  return user;
}

/** Para Server Components: redirige al login o al inicio del rol. */
export async function requerirUsuarioPagina(roles?: Rol[]): Promise<SessionUser> {
  const user = await usuarioActual();
  if (!user) redirect('/login');
  if (roles && !roles.includes(user.rol)) redirect(inicioPorRol(user.rol));
  return user;
}
