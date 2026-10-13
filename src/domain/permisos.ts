import type { Rol } from './types';

/** Secciones del backoffice y los roles que pueden verlas. */
export const SECCIONES = {
  panel: { href: '/panel', roles: ['superadmin'] },
  solicitudes: { href: '/solicitudes', roles: ['superadmin', 'administrador'] },
  asociados: { href: '/asociados', roles: ['superadmin', 'administrador'] },
  usuarios: { href: '/usuarios', roles: ['superadmin'] },
} as const satisfies Record<string, { href: string; roles: readonly Rol[] }>;

export type Seccion = keyof typeof SECCIONES;

export function inicioPorRol(rol: Rol): string {
  return rol === 'superadmin' ? SECCIONES.panel.href : SECCIONES.solicitudes.href;
}

/** `null` si la ruta no pertenece a ninguna sección protegida. */
export function seccionDeRuta(pathname: string): Seccion | null {
  const entrada = Object.entries(SECCIONES).find(([, s]) => pathname === s.href || pathname.startsWith(`${s.href}/`));
  return (entrada?.[0] as Seccion | undefined) ?? null;
}

export function puedeVer(seccion: Seccion, rol: Rol): boolean {
  return (SECCIONES[seccion].roles as readonly Rol[]).includes(rol);
}
