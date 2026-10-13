import { normalizar } from './format';
import type { FiltroAsociados, FiltroSolicitudes, FiltroUsuarios } from './schemas';
import type { Asociado, Solicitud, Usuario } from './types';

/**
 * Filtros puros. Los usa el repositorio mock y sirven de especificación del
 * comportamiento esperado para la API real del Portal.
 */

const soloDigitos = (s: string) => s.replace(/\D/g, '');

/**
 * Búsqueda libre insensible a mayúsculas y tildes. Si el término es numérico
 * (ej. `32.456.789` o `2026-32456789`) compara solo dígitos, así el DNI se
 * encuentra con o sin puntos.
 */
function coincide(termino: string | undefined, ...campos: string[]): boolean {
  if (!termino) return true;
  const t = normalizar(termino);
  if (/^[\d.\s-]+$/.test(t)) {
    const digitos = soloDigitos(t);
    return campos.some((c) => soloDigitos(c).includes(digitos));
  }
  return campos.some((c) => normalizar(c).includes(t));
}

export function filtrarSolicitudes<T extends Solicitud>(items: T[], f: FiltroSolicitudes): T[] {
  return items.filter((s) => {
    if (s.estado === 'aprobada') return false; // las aprobadas viven en Asociados
    if (f.estado !== 'todas' && s.estado !== f.estado) return false;
    if (f.segmento !== 'todos' && s.segmento !== f.segmento) return false;
    return coincide(f.q, `${s.nombre} ${s.apellido}`, s.dni);
  });
}

export function filtrarAsociados<T extends Asociado>(items: T[], f: FiltroAsociados): T[] {
  return items.filter((a) => {
    if (f.estado !== 'todos' && a.estado !== f.estado) return false;
    if (f.segmento !== 'todos' && a.segmento !== f.segmento) return false;
    if (f.desde && a.fechaAlta < f.desde) return false;
    if (f.hasta && a.fechaAlta > f.hasta) return false;
    return coincide(f.q, `${a.nombre} ${a.apellido}`, a.dni, a.numeroAfiliado);
  });
}

export function filtrarUsuarios<T extends Usuario>(items: T[], f: FiltroUsuarios): T[] {
  return items.filter((u) => {
    if (f.estado !== 'todos' && u.estado !== f.estado) return false;
    if (f.rol !== 'todos' && u.rol !== f.rol) return false;
    return coincide(f.q, u.nombre, u.email);
  });
}

export function contarPor<T, K extends string>(items: T[], clave: (item: T) => K, claves: readonly K[]) {
  const conteo = Object.fromEntries(claves.map((k) => [k, 0])) as Record<K, number>;
  for (const item of items) {
    const k = clave(item);
    if (k in conteo) conteo[k] += 1;
  }
  return conteo;
}

/** Ordena por fecha descendente (más reciente primero). */
export const porFechaDesc =
  <T>(campo: (item: T) => string) =>
  (a: T, b: T) =>
    campo(b).localeCompare(campo(a));
