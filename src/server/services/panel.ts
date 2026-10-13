import 'server-only';
import type { ResumenPanel } from '@/domain/types';
import { repos } from '../repositories';

export async function obtenerResumenPanel(): Promise<ResumenPanel> {
  const [asociados, solicitudes, usuarios] = await Promise.all([
    repos().asociados.listar({ estado: 'todos', segmento: 'todos' }),
    repos().solicitudes.listar({ estado: 'todas', segmento: 'todos' }),
    repos().usuarios.listar({ estado: 'todos', rol: 'todos' }),
  ]);

  return {
    asociados: asociados.conteos,
    solicitudes: { pendientes: solicitudes.conteos.pendiente, rechazadas: solicitudes.conteos.rechazada },
    usuarios: usuarios.conteos,
    // El listado ya viene ordenado por fecha de creación descendente.
    usuariosRecientes: usuarios.items.slice(0, 3),
  };
}
