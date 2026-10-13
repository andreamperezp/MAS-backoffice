import 'server-only';
import type { FiltroAsociados, FiltroSolicitudes, FiltroUsuarios } from '@/domain/schemas';
import type { Asociado, Listado } from '@/domain/types';
import { AppError } from '../errors';
import type { Repositorios } from './types';

/**
 * Adaptador HTTP contra la API del Portal de afiliaciones.
 *
 * El contrato esperado está documentado en `docs/API.md`. Es la única pieza a
 * completar cuando el Portal exponga sus endpoints: los services, las rutas
 * `/api/*` y la UI no cambian.
 *
 * Variables de entorno:
 *   PORTAL_API_URL    ej. https://masmutual.grupodelsud.com/api
 *   PORTAL_API_TOKEN  token de servicio (server-to-server, nunca llega al browser)
 */

function config() {
  const baseUrl = process.env.PORTAL_API_URL;
  const token = process.env.PORTAL_API_TOKEN;
  if (!baseUrl || !token) {
    throw new Error('DATA_SOURCE=portal requiere PORTAL_API_URL y PORTAL_API_TOKEN.');
  }
  return { baseUrl: baseUrl.replace(/\/$/, ''), token };
}

type Query = Record<string, string | undefined>;

function aQueryString(query: Query): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== '') params.set(k, v);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(path: string, init: RequestInit & { query?: Query } = {}): Promise<T> {
  const { baseUrl, token } = config();
  const { query, ...rest } = init;
  const res = await fetch(`${baseUrl}${path}${query ? aQueryString(query) : ''}`, {
    ...rest,
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...rest.headers,
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (res.status === 404) return null as T;
  if (!res.ok) {
    console.error(`[portal-api] ${rest.method ?? 'GET'} ${path} → ${res.status}`);
    throw new AppError('UPSTREAM', 'No se pudo comunicar con el Portal de afiliaciones.');
  }
  return (await res.json()) as T;
}

const filtroQuery = (f: FiltroSolicitudes | FiltroAsociados | FiltroUsuarios): Query =>
  Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === undefined ? undefined : String(v)]));

export function crearRepositoriosPortal(): Repositorios {
  return {
    solicitudes: {
      listar: (f) => request('/solicitudes', { query: filtroQuery(f) }),
      obtener: (id) => request(`/solicitudes/${encodeURIComponent(id)}`),
      actualizarEstado: (id, estado) =>
        request(`/solicitudes/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ estado }) }),
    },
    asociados: {
      listar: (f) => request('/asociados', { query: filtroQuery(f) }),
      obtener: (id) => request(`/asociados/${encodeURIComponent(id)}`),
      buscarPorDni: async (dni) => {
        const res = await request<Listado<Asociado> | null>('/asociados', { query: { dni } });
        return res?.items[0] ?? null;
      },
      crear: (datos) => request('/asociados', { method: 'POST', body: JSON.stringify(datos) }),
      actualizar: (id, cambios) =>
        request(`/asociados/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(cambios) }),
    },
    usuarios: {
      listar: (f) => request('/backoffice/usuarios', { query: filtroQuery(f) }),
      obtener: (id) => request(`/backoffice/usuarios/${encodeURIComponent(id)}`),
      buscarConCredenciales: (usuarioOEmail) =>
        request('/backoffice/usuarios/credenciales', { query: { usuario: usuarioOEmail } }),
      obtenerConCredenciales: (id) => request(`/backoffice/usuarios/${encodeURIComponent(id)}/credenciales`),
      crear: (datos) => request('/backoffice/usuarios', { method: 'POST', body: JSON.stringify(datos) }),
      actualizar: (id, cambios) =>
        request(`/backoffice/usuarios/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(cambios) }),
    },
  };
}
