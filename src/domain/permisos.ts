import type { Rol } from './types';

/** Secciones del backoffice y los roles que pueden verlas. */
export const SECCIONES = {
  panel: { href: '/panel', roles: ['superadmin', 'administrador'] },
  solicitudes: { href: '/solicitudes', roles: ['superadmin', 'administrador'] },
  asociados: { href: '/asociados', roles: ['superadmin', 'administrador'] },
  usuarios: { href: '/usuarios', roles: ['superadmin'] },
} as const satisfies Record<string, { href: string; roles: readonly Rol[] }>;

export type Seccion = keyof typeof SECCIONES;

/** Todos los roles arrancan en el Panel (cada uno ve su versión). */
export function inicioPorRol(_rol: Rol): string {
  return SECCIONES.panel.href;
}

/** `null` si la ruta no pertenece a ninguna sección protegida. */
export function seccionDeRuta(pathname: string): Seccion | null {
  const entrada = Object.entries(SECCIONES).find(([, s]) => pathname === s.href || pathname.startsWith(`${s.href}/`));
  return (entrada?.[0] as Seccion | undefined) ?? null;
}

export function puedeVer(seccion: Seccion, rol: Rol): boolean {
  return (SECCIONES[seccion].roles as readonly Rol[]).includes(rol);
}
