import 'server-only';
import type { SessionUser } from '@/domain/types';
import { hashPassword, verificarPassword } from '../auth/password';
import { repos } from '../repositories';

// Hash señuelo: verificar contra él aunque el usuario no exista iguala el tiempo
// de respuesta y evita enumerar usuarios válidos.
const HASH_SENUELO = hashPassword('usuario-inexistente');

/** Devuelve el usuario si las credenciales son válidas; `null` si no. */
export async function autenticar(usuarioOEmail: string, contrasena: string): Promise<SessionUser | null> {
  const usuario = await repos().usuarios.buscarConCredenciales(usuarioOEmail);
  const valida = verificarPassword(contrasena, usuario?.passwordHash ?? HASH_SENUELO);
  if (!usuario || !valida || usuario.estado !== 'activo') return null;

  await repos().usuarios.actualizar(usuario.id, { ultimoAcceso: new Date().toISOString() });
  return { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
}
