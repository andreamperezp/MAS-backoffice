import 'server-only';
import type { FiltroAsociados, FiltroSolicitudes, FiltroUsuarios } from '@/domain/schemas';
import type {
  Asociado,
  ConteosAsociados,
  ConteosSolicitudes,
  ConteosUsuarios,
  EstadoSolicitud,
  Listado,
  Solicitud,
  Usuario,
} from '@/domain/types';

/**
 * Contratos de acceso a datos. Los services dependen solo de estas interfaces,
 * así se puede pasar del mock a la API del Portal sin tocar la lógica de negocio.
 */

export interface SolicitudesRepository {
  listar(filtro: FiltroSolicitudes): Promise<Listado<Solicitud, ConteosSolicitudes>>;
  obtener(id: string): Promise<Solicitud | null>;
  actualizarEstado(id: string, estado: EstadoSolicitud): Promise<Solicitud>;
}

export type NuevoAsociado = Omit<Asociado, 'id'>;

export interface AsociadosRepository {
  listar(filtro: FiltroAsociados): Promise<Listado<Asociado, ConteosAsociados>>;
  obtener(id: string): Promise<Asociado | null>;
  buscarPorDni(dni: string): Promise<Asociado | null>;
  crear(datos: NuevoAsociado): Promise<Asociado>;
  actualizar(id: string, cambios: Partial<Pick<Asociado, 'estado' | 'motivoPausa'>>): Promise<Asociado>;
}

/** Usuario con datos de credenciales: nunca debe salir del servidor. */
export interface UsuarioConCredenciales extends Usuario {
  passwordHash: string;
  debeCambiarPassword: boolean;
}

export type NuevoUsuarioDatos = Omit<Usuario, 'id' | 'ultimoAcceso'> & {
  passwordHash: string;
  debeCambiarPassword: boolean;
};

export interface UsuariosRepository {
  listar(filtro: FiltroUsuarios): Promise<Listado<Usuario, ConteosUsuarios>>;
  obtener(id: string): Promise<Usuario | null>;
  /** Busca por nombre de usuario o correo (case-insensitive). */
  buscarConCredenciales(usuarioOEmail: string): Promise<UsuarioConCredenciales | null>;
  obtenerConCredenciales(id: string): Promise<UsuarioConCredenciales | null>;
  crear(datos: NuevoUsuarioDatos): Promise<Usuario>;
  actualizar(
    id: string,
    cambios: Partial<
      Pick<UsuarioConCredenciales, 'rol' | 'estado' | 'ultimoAcceso' | 'passwordHash' | 'debeCambiarPassword'>
    >,
  ): Promise<Usuario>;
}

export interface Repositorios {
  solicitudes: SolicitudesRepository;
  asociados: AsociadosRepository;
  usuarios: UsuariosRepository;
}
