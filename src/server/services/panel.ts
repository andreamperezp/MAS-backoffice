import 'server-only';
import { hoyIso } from '@/domain/format';
import type { ResumenPanel, Rol } from '@/domain/types';
import { repos } from '../repositories';

const CANTIDAD_EN_ESPERA = 3;

/**
 * KPIs del Panel. Los datos de usuarios del sistema solo se calculan (y se
 * envían) para superadmin.
 */
export async function obtenerResumenPanel(rol: Rol): Promise<ResumenPanel> {
  const esSuperadmin = rol === 'superadmin';
  const [asociados, solicitudes, pendientes, usuarios] = await Promise.all([
    repos().asociados.listar({ estado: 'todos', segmento: 'todos' }),
    repos().solicitudes.listar({ estado: 'todas', segmento: 'todos' }),
    // La cola de pendientes ya viene en orden FIFO (más antigua primero).
    repos().solicitudes.listar({ estado: 'pendiente', segmento: 'todos' }),
    esSuperadmin ? repos().usuarios.listar({ estado: 'todos', rol: 'todos' }) : null,
  ]);

  const mesActual = hoyIso().slice(0, 7);

  return {
    asociados: asociados.conteos,
    solicitudes: { pendientes: solicitudes.conteos.pendiente, rechazadas: solicitudes.conteos.rechazada },
    altasDelMes: asociados.items.filter((a) => a.fechaAlta.startsWith(mesActual)).length,
    solicitudesEnEspera: pendientes.items.slice(0, CANTIDAD_EN_ESPERA),
    usuarios: usuarios?.conteos ?? null,
    // El listado de usuarios ya viene ordenado por fecha de creación descendente.
    usuariosRecientes: usuarios?.items.slice(0, 3) ?? null,
  };
}
