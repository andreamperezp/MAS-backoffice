/**
 * Modelo de dominio del backoffice.
 *
 * Las solicitudes nacen en el Portal de afiliaciones (masmutual.grupodelsud.com):
 * el formulario pide segmento, nombre, apellido, correo, teléfono, DNI (frente y
 * dorso) y último recibo de sueldo. Al aprobarse, la solicitud se convierte en un
 * Asociado con su número de afiliado y carnet digital.
 *
 * Las fechas viajan como strings ISO 8601 (`YYYY-MM-DD` o datetime completo) para
 * que el modelo sea serializable entre servidor y cliente sin conversiones.
 */

export const SEGMENTOS = ['policia', 'salud', 'caja'] as const;
export type Segmento = (typeof SEGMENTOS)[number];

export const ESTADOS_SOLICITUD = ['pendiente', 'rechazada', 'aprobada'] as const;
export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];

export const ESTADOS_ASOCIADO = ['activo', 'pausado', 'inactivo'] as const;
export type EstadoAsociado = (typeof ESTADOS_ASOCIADO)[number];

export const MOTIVOS_PAUSA = ['falta_de_pago', 'en_revision', 'otro'] as const;
export type MotivoPausa = (typeof MOTIVOS_PAUSA)[number];

export const ROLES = ['superadmin', 'administrador'] as const;
export type Rol = (typeof ROLES)[number];

export const ESTADOS_USUARIO = ['activo', 'inactivo'] as const;
export type EstadoUsuario = (typeof ESTADOS_USUARIO)[number];

export const TIPOS_DOCUMENTO = ['dni_frente', 'dni_dorso', 'recibo_sueldo'] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export interface Documento {
  tipo: TipoDocumento;
  nombreArchivo: string;
  url: string;
}

export interface Solicitud {
  id: string;
  nombre: string;
  apellido: string;
  /** Solo dígitos, sin puntos. */
  dni: string;
  segmento: Segmento;
  correo: string;
  telefono: string;
  /** Fecha en que la persona envió el formulario desde el Portal. */
  fechaSolicitud: string;
  estado: EstadoSolicitud;
  documentos: Documento[];
}

export interface Asociado {
  id: string;
  /** Solicitud de origen, si el alta vino del Portal. */
  solicitudId: string | null;
  nombre: string;
  apellido: string;
  dni: string;
  segmento: Segmento;
  correo: string;
  telefono: string;
  /** N.° de afiliado = año de alta + N.° de DNI (ej. `2026-32456789`). */
  numeroAfiliado: string;
  fechaAlta: string;
  estado: EstadoAsociado;
  motivoPausa: MotivoPausa | null;
}

export interface Usuario {
  id: string;
  nombre: string;
  /** Nombre de usuario con el que inicia sesión. */
  usuario: string;
  email: string;
  rol: Rol;
  estado: EstadoUsuario;
  fechaCreacion: string;
  /** `null` si todavía no inició sesión. */
  ultimoAcceso: string | null;
}

/** Datos del usuario logueado que se exponen al cliente. */
export interface SessionUser {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
}

/** Respuesta paginable genérica de los listados. */
export interface Listado<T, TConteos extends Record<string, number> = Record<string, number>> {
  items: T[];
  total: number;
  conteos: TConteos;
}

export type ConteosSolicitudes = { pendiente: number; rechazada: number; total: number };
export type ConteosAsociados = Record<EstadoAsociado, number>;
export type ConteosUsuarios = Record<EstadoUsuario, number>;

export interface ResumenPanel {
  asociados: ConteosAsociados;
  solicitudes: { pendientes: number; rechazadas: number };
  /** Asociados dados de alta en el mes en curso. */
  altasDelMes: number;
  /** Pendientes más antiguas (cola FIFO), para el panel del administrador. */
  solicitudesEnEspera: Solicitud[];
  /** Solo para superadmin; `null` para el resto de los roles. */
  usuarios: ConteosUsuarios | null;
  usuariosRecientes: Usuario[] | null;
}
