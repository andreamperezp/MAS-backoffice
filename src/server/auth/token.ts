import { jwtVerify, SignJWT } from 'jose';
import type { Rol, SessionUser } from '@/domain/types';

/**
 * Firma y verificación del token de sesión (JWT HS256).
 * Sin dependencias de `next/headers` para poder usarse desde `proxy.ts`.
 */

export const SESSION_COOKIE = 'mas_session';
export const SESSION_DURACION_SEG = 60 * 60 * 8; // jornada laboral

const DEV_SECRET = 'dev-only-secret-cambiar-en-produccion-0123456789';

function secret(): Uint8Array {
  const valor = process.env.AUTH_SECRET;
  if (!valor) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Falta la variable de entorno AUTH_SECRET.');
    }
    return new TextEncoder().encode(DEV_SECRET);
  }
  return new TextEncoder().encode(valor);
}

export async function firmarSesion(user: SessionUser): Promise<string> {
  return new SignJWT({ rol: user.rol, nombre: user.nombre, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURACION_SEG}s`)
    .sign(secret());
}

export async function verificarSesion(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      rol: payload.rol as Rol,
      nombre: String(payload.nombre ?? ''),
      email: String(payload.email ?? ''),
    };
  } catch {
    return null;
  }
}
