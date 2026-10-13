'use server';

import { redirect } from 'next/navigation';
import { inicioPorRol, puedeVer, seccionDeRuta } from '@/domain/permisos';
import { loginSchema } from '@/domain/schemas';
import type { Rol } from '@/domain/types';
import { cerrarSesion, crearSesion } from '@/server/auth/session';
import { autenticar } from '@/server/services/auth';

export interface EstadoLogin {
  errores?: { usuario?: string; contrasena?: string };
  error?: string;
  usuario?: string;
}

/** Solo acepta rutas internas del backoffice que el rol pueda ver (evita open redirect). */
function destinoSeguro(volver: FormDataEntryValue | null, rol: Rol): string {
  if (typeof volver !== 'string' || !volver.startsWith('/') || volver.startsWith('//')) return inicioPorRol(rol);
  const seccion = seccionDeRuta(volver);
  return seccion && puedeVer(seccion, rol) ? volver : inicioPorRol(rol);
}

export async function iniciarSesion(_previo: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const datos = loginSchema.safeParse({
    usuario: formData.get('usuario'),
    contrasena: formData.get('contrasena'),
  });
  const usuario = String(formData.get('usuario') ?? '');

  if (!datos.success) {
    const campos = datos.error.flatten().fieldErrors;
    return { usuario, errores: { usuario: campos.usuario?.[0], contrasena: campos.contrasena?.[0] } };
  }

  const user = await autenticar(datos.data.usuario, datos.data.contrasena);
  if (!user) return { usuario, error: 'Usuario o contraseña incorrectos. Volvé a intentarlo.' };

  await crearSesion(user);
  redirect(destinoSeguro(formData.get('volver'), user.rol));
}

export async function salir(): Promise<void> {
  await cerrarSesion();
  redirect('/login');
}
