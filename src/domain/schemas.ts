import { z } from 'zod';
import { ESTADOS_ASOCIADO, ESTADOS_USUARIO, MOTIVOS_PAUSA, ROLES, SEGMENTOS } from './types';

// Mensajes de validación en español para toda la app.
z.config(z.locales.es());

const fechaIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)');

/** Convierte `''` en `undefined` para query strings con parámetros vacíos. */
const opcional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema.optional());

// ── Filtros de listados (query string) ──────────────────────────────────────

export const filtroSolicitudesSchema = z.object({
  estado: z.enum(['todas', 'pendiente', 'rechazada']).catch('pendiente'),
  segmento: z.enum(['todos', ...SEGMENTOS]).catch('todos'),
  q: opcional(z.string().max(100)),
});
export type FiltroSolicitudes = z.infer<typeof filtroSolicitudesSchema>;

export const filtroAsociadosSchema = z.object({
  estado: z.enum(['todos', ...ESTADOS_ASOCIADO]).catch('todos'),
  segmento: z.enum(['todos', ...SEGMENTOS]).catch('todos'),
  q: opcional(z.string().max(100)),
  desde: opcional(fechaIso),
  hasta: opcional(fechaIso),
});
export type FiltroAsociados = z.infer<typeof filtroAsociadosSchema>;

export const filtroUsuariosSchema = z.object({
  estado: z.enum(['todos', ...ESTADOS_USUARIO]).catch('todos'),
  rol: z.enum(['todos', ...ROLES]).catch('todos'),
  q: opcional(z.string().max(100)),
});
export type FiltroUsuarios = z.infer<typeof filtroUsuariosSchema>;

// ── Comandos (body de mutaciones) ───────────────────────────────────────────

export const accionSolicitudSchema = z.object({
  accion: z.enum(['aprobar', 'rechazar', 'volver_a_pendiente']),
});
export type AccionSolicitud = z.infer<typeof accionSolicitudSchema>['accion'];

export const accionAsociadoSchema = z.discriminatedUnion('accion', [
  z.object({ accion: z.literal('pausar'), motivo: z.enum(MOTIVOS_PAUSA) }),
  z.object({ accion: z.literal('reactivar') }),
  z.object({ accion: z.literal('desactivar') }),
]);
export type AccionAsociado = z.infer<typeof accionAsociadoSchema>;

export const nuevoUsuarioSchema = z.object({
  nombre: z.string().trim().min(3, 'Ingresá nombre y apellido').max(80),
  email: z.email('Correo inválido').trim().toLowerCase(),
  rol: z.enum(ROLES),
});
export type NuevoUsuario = z.infer<typeof nuevoUsuarioSchema>;

export const actualizarUsuarioSchema = z
  .object({
    rol: z.enum(ROLES).optional(),
    estado: z.enum(ESTADOS_USUARIO).optional(),
  })
  .refine((v) => v.rol !== undefined || v.estado !== undefined, {
    message: 'Indicá rol o estado',
  });
export type ActualizarUsuario = z.infer<typeof actualizarUsuarioSchema>;

export const loginSchema = z.object({
  usuario: z.string().trim().min(1, 'Ingresá tu usuario').max(100),
  contrasena: z.string().min(1, 'Ingresá tu contraseña').max(200),
});
