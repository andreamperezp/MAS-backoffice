/**
 * Cliente HTTP del browser hacia el BFF (`/api/*`). Nunca habla directo con el
 * Portal: las credenciales de servicio quedan del lado del servidor.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly codigo: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Params = Record<string, string | number | undefined | null>;

export function aQueryString(params: Params): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export async function api<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  const res = await fetch(path, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...rest.headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    credentials: 'same-origin',
  });

  if (res.status === 401) {
    // Sesión vencida o usuario desactivado: limpiar cookie y volver al login.
    // Navegación completa a propósito: /api/auth/salir es un Route Handler que borra la cookie.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign('/api/auth/salir');
    throw new ApiError('Tu sesión expiró.', 401, 'NO_AUTENTICADO');
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { codigo: string; mensaje: string } } | null;
    throw new ApiError(
      body?.error?.mensaje ?? 'Ocurrió un error inesperado. Intentá de nuevo.',
      res.status,
      body?.error?.codigo ?? 'DESCONOCIDO',
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const mensajeDeError = (error: unknown) =>
  error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
