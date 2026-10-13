const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** `32456789` → `32.456.789` */
export function formatDni(dni: string): string {
  return dni.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** N.° de afiliado = año de alta + N.° de DNI. */
export function numeroAfiliado(fechaAltaIso: string, dni: string): string {
  return `${fechaAltaIso.slice(0, 4)}-${dni.replace(/\D/g, '')}`;
}

/**
 * Parsea `YYYY-MM-DD` como fecha local (no UTC) para evitar el corrimiento de un
 * día que produce `new Date('2026-09-18')` en husos horarios negativos como AR.
 */
function parseFecha(iso: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(iso);
}

/** `2026-09-18` → `18 sep 2026` */
export function formatFecha(iso: string): string {
  const d = parseFecha(iso);
  return `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

function hora(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function mismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** `Hoy, 09:14` · `Ayer, 17:40` · `22 sep 2026, 11:05` · `Sin accesos todavía` */
export function formatUltimoAcceso(iso: string | null, ahora: Date = new Date()): string {
  if (!iso) return 'Sin accesos todavía';
  const d = new Date(iso);
  if (mismoDia(d, ahora)) return `Hoy, ${hora(d)}`;
  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);
  if (mismoDia(d, ayer)) return `Ayer, ${hora(d)}`;
  return `${formatFecha(iso)}, ${hora(d)}`;
}

/** Fecha local de hoy en formato `YYYY-MM-DD`. */
export function hoyIso(ahora: Date = new Date()): string {
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** `Valeria Suárez` → `VS` */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '')).toUpperCase();
}

/** Normaliza un teléfono argentino para links `wa.me` (solo dígitos, con código de país). */
export function telefonoWhatsapp(telefono: string): string {
  return telefono.replace(/\D/g, '');
}

/** Normaliza texto para búsquedas: minúsculas y sin tildes. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // quita tildes y diacríticos
    .toLowerCase()
    .trim();
}
