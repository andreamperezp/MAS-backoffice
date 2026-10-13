import 'server-only';
import { asociadosACsv } from '@/domain/csv';
import type { AccionAsociado, FiltroAsociados } from '@/domain/schemas';
import type { Asociado } from '@/domain/types';
import { AppError, noEncontrado } from '../errors';
import { whatsapp } from '../notificaciones';
import { repos } from '../repositories';

export const listarAsociados = (filtro: FiltroAsociados) => repos().asociados.listar(filtro);

export async function exportarAsociadosCsv(filtro: FiltroAsociados): Promise<{ csv: string; cantidad: number }> {
  const { items } = await repos().asociados.listar(filtro);
  return { csv: asociadosACsv(items), cantidad: items.length };
}

const transicionInvalida = (a: Asociado, accion: string) =>
  new AppError('TRANSICION_INVALIDA', `No se puede ${accion} un asociado en estado "${a.estado}".`);

export async function ejecutarAccionAsociado(id: string, comando: AccionAsociado): Promise<Asociado> {
  const asociado = await repos().asociados.obtener(id);
  if (!asociado) throw noEncontrado('Asociado');

  switch (comando.accion) {
    case 'pausar': {
      if (asociado.estado !== 'activo') throw transicionInvalida(asociado, 'pausar');
      const actualizado = await repos().asociados.actualizar(id, { estado: 'pausado', motivoPausa: comando.motivo });
      await whatsapp.asociadoPausado(actualizado);
      return actualizado;
    }
    case 'reactivar': {
      if (asociado.estado !== 'pausado') throw transicionInvalida(asociado, 'reactivar');
      const actualizado = await repos().asociados.actualizar(id, { estado: 'activo', motivoPausa: null });
      await whatsapp.asociadoReactivado(actualizado);
      return actualizado;
    }
    case 'desactivar': {
      // No se borra: pasa al histórico y se conserva para auditoría.
      if (asociado.estado === 'inactivo') throw transicionInvalida(asociado, 'desactivar');
      return repos().asociados.actualizar(id, { estado: 'inactivo', motivoPausa: null });
    }
  }
}
