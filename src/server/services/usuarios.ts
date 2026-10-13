import 'server-only';
import { hoyIso } from '@/domain/format';
import type { ActualizarUsuario, FiltroUsuarios, NuevoUsuario } from '@/domain/schemas';
import type { SessionUser, Usuario } from '@/domain/types';
import { generarPasswordTemporal, hashPassword, verificarPassword } from '../auth/password';
import { AppError, noEncontrado } from '../errors';
import { mailer } from '../notificaciones';
import { repos } from '../repositories';

export const listarUsuarios = (filtro: FiltroUsuarios) => repos().usuarios.listar(filtro);

async function obtenerOFallar(id: string): Promise<Usuario> {
  const usuario = await repos().usuarios.obtener(id);
  if (!usuario) throw noEncontrado('Usuario');
  return usuario;
}

export async function crearUsuario(datos: NuevoUsuario): Promise<Usuario> {
  const nombreUsuario = datos.email.split('@')[0];
  const [porEmail, porUsuario] = await Promise.all([
    repos().usuarios.buscarConCredenciales(datos.email),
    repos().usuarios.buscarConCredenciales(nombreUsuario),
  ]);
  if (porEmail || porUsuario) throw new AppError('CONFLICTO', 'Ya existe un usuario con ese correo.');

  const passwordTemporal = generarPasswordTemporal();
  const usuario = await repos().usuarios.crear({
    nombre: datos.nombre,
    email: datos.email,
    usuario: nombreUsuario,
    rol: datos.rol,
    estado: 'activo',
    fechaCreacion: hoyIso(),
    passwordHash: hashPassword(passwordTemporal),
    debeCambiarPassword: true,
  });
  await mailer.invitacion(usuario, passwordTemporal);
  return usuario;
}

/**
 * Cambia rol y/o estado. Protege dos invariantes: nadie puede quitarse a sí
 * mismo el acceso de superadmin, y siempre queda al menos un superadmin activo.
 */
export async function actualizarUsuario(id: string, cambios: ActualizarUsuario, actor: SessionUser): Promise<Usuario> {
  const usuario = await obtenerOFallar(id);
  const pierdeSuperadmin =
    usuario.rol === 'superadmin' &&
    usuario.estado === 'activo' &&
    ((cambios.rol && cambios.rol !== 'superadmin') || cambios.estado === 'inactivo');

  if (pierdeSuperadmin) {
    if (usuario.id === actor.id) {
      throw new AppError('CONFLICTO', 'No podés quitarte el acceso de superadmin a vos mismo.');
    }
    const { items } = await repos().usuarios.listar({ estado: 'activo', rol: 'superadmin', q: undefined });
    if (items.length <= 1) throw new AppError('CONFLICTO', 'Tiene que quedar al menos un superadmin activo.');
  }

  return repos().usuarios.actualizar(id, cambios);
}

/** Genera una contraseña temporal; el usuario deberá cambiarla al ingresar. */
export async function restablecerPassword(id: string): Promise<{ usuario: Usuario; passwordTemporal: string }> {
  const usuario = await obtenerOFallar(id);
  const passwordTemporal = generarPasswordTemporal();
  await repos().usuarios.actualizar(id, {
    passwordHash: hashPassword(passwordTemporal),
    debeCambiarPassword: true,
  });
  return { usuario, passwordTemporal };
}

/**
 * Envía por correo la contraseña temporal recién generada. Se valida contra el
 * hash guardado para que el endpoint no pueda usarse para enviar texto arbitrario.
 */
export async function enviarPasswordTemporal(id: string, passwordTemporal: string): Promise<void> {
  const usuario = await repos().usuarios.obtenerConCredenciales(id);
  if (!usuario) throw noEncontrado('Usuario');
  if (!usuario.debeCambiarPassword || !verificarPassword(passwordTemporal, usuario.passwordHash)) {
    throw new AppError('CONFLICTO', 'La contraseña temporal ya no es válida. Generá una nueva.');
  }
  await mailer.passwordTemporal(usuario, passwordTemporal);
}
