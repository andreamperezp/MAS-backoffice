import type {
  EstadoAsociado,
  EstadoSolicitud,
  EstadoUsuario,
  MotivoPausa,
  Rol,
  Segmento,
  TipoDocumento,
} from './types';

export const SEGMENTO_LABEL: Record<Segmento, string> = {
  policia: 'Policía',
  salud: 'Salud',
  caja: 'Caja de Policía',
};

/** Versión corta para chips y tarjetas en mobile. */
export const SEGMENTO_LABEL_CORTO: Record<Segmento, string> = {
  policia: 'Policía',
  salud: 'Salud',
  caja: 'Caja',
};

export const ESTADO_SOLICITUD_LABEL: Record<EstadoSolicitud, string> = {
  pendiente: 'Pendiente',
  rechazada: 'Rechazado',
  aprobada: 'Aprobado',
};

export const ESTADO_ASOCIADO_LABEL: Record<EstadoAsociado, string> = {
  activo: 'Activo',
  pausado: 'Pausado',
  inactivo: 'Inactivo',
};

export const MOTIVO_PAUSA_LABEL: Record<MotivoPausa, string> = {
  falta_de_pago: 'Falta de pago',
  en_revision: 'En revisión',
  otro: 'Otro motivo',
};

export const ROL_LABEL: Record<Rol, string> = {
  superadmin: 'Superadmin',
  administrador: 'Administrador',
};

export const ROL_INICIALES: Record<Rol, string> = {
  superadmin: 'SA',
  administrador: 'AD',
};

export const ESTADO_USUARIO_LABEL: Record<EstadoUsuario, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
};

export const DOCUMENTO_LABEL: Record<TipoDocumento, string> = {
  dni_frente: 'DNI (frente)',
  dni_dorso: 'DNI (dorso)',
  recibo_sueldo: 'Recibo de sueldo',
};
