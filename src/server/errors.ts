import 'server-only';

export type CodigoError =
  'NO_AUTENTICADO' | 'SIN_PERMISO' | 'NO_ENCONTRADO' | 'CONFLICTO' | 'TRANSICION_INVALIDA' | 'VALIDACION' | 'UPSTREAM';

const STATUS: Record<CodigoError, number> = {
  NO_AUTENTICADO: 401,
  SIN_PERMISO: 403,
  NO_ENCONTRADO: 404,
  CONFLICTO: 409,
  TRANSICION_INVALIDA: 409,
  VALIDACION: 422,
  UPSTREAM: 502,
};

/** Error de negocio con mensaje apto para mostrar al usuario. */
export class AppError extends Error {
  readonly status: number;

  constructor(
    readonly codigo: CodigoError,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
    this.status = STATUS[codigo];
  }
}

export const noEncontrado = (entidad: string) => new AppError('NO_ENCONTRADO', `${entidad} no encontrado.`);
