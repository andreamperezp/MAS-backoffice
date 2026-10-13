import 'server-only';
import { unstable_rethrow } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { AppError } from './errors';

/** Forma estándar de los errores de `/api/*`. El cliente la lee en `lib/api.ts`. */
export interface ErrorApi {
  error: { codigo: string; mensaje: string };
}

const errorJson = (status: number, codigo: string, mensaje: string) =>
  Response.json({ error: { codigo, mensaje } } satisfies ErrorApi, { status });

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Defensa CSRF adicional a `SameSite=Lax`: las mutaciones deben venir del mismo
 * origen que sirve la app.
 */
function origenValido(req: NextRequest): boolean {
  if (METODOS_SEGUROS.has(req.method)) return true;
  const origin = req.headers.get('origin');
  return origin === null || origin === req.nextUrl.origin;
}

/**
 * Envuelve un Route Handler: centraliza el mapeo de errores de negocio y de
 * validación a respuestas JSON, y loguea los inesperados sin filtrar detalles.
 */
export function ruta<C>(fn: (req: NextRequest, ctx: C) => Promise<Response>) {
  return async (req: NextRequest, ctx: C): Promise<Response> => {
    if (!origenValido(req)) return errorJson(403, 'SIN_PERMISO', 'Origen no permitido.');
    try {
      return await fn(req, ctx);
    } catch (err) {
      // Errores de control internos de Next (redirect, prerender de cookies(), etc.).
      unstable_rethrow(err);
      if (err instanceof AppError) return errorJson(err.status, err.codigo, err.message);
      if (err instanceof z.ZodError) {
        return errorJson(422, 'VALIDACION', err.issues[0]?.message ?? 'Datos inválidos.');
      }
      console.error(`[api] ${req.method} ${req.nextUrl.pathname}`, err);
      return errorJson(500, 'INTERNO', 'Ocurrió un error inesperado. Intentá de nuevo.');
    }
  };
}

export function leerQuery<T extends z.ZodType>(req: NextRequest, schema: T): z.infer<T> {
  return schema.parse(Object.fromEntries(req.nextUrl.searchParams));
}

export async function leerBody<T extends z.ZodType>(req: NextRequest, schema: T): Promise<z.infer<T>> {
  const body = await req.json().catch(() => {
    throw new AppError('VALIDACION', 'El cuerpo de la solicitud no es JSON válido.');
  });
  return schema.parse(body);
}
