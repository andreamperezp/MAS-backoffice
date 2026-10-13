import 'server-only';
import { hoyIso, numeroAfiliado } from '@/domain/format';
import type { AccionSolicitud, FiltroSolicitudes } from '@/domain/schemas';
import type { Asociado, Solicitud } from '@/domain/types';
import { AppError, noEncontrado } from '../errors';
import { whatsapp } from '../notificaciones';
import { repos } from '../repositories';

export const listarSolicitudes = (filtro: FiltroSolicitudes) => repos().solicitudes.listar(filtro);

async function obtenerOFallar(id: string): Promise<Solicitud> {
  const solicitud = await repos().solicitudes.obtener(id);
  if (!solicitud) throw noEncontrado('Solicitud');
  return solicitud;
}

function exigirEstado(s: Solicitud, esperado: Solicitud['estado'], accion: string) {
  if (s.estado !== esperado) {
    throw new AppError('TRANSICION_INVALIDA', `No se puede ${accion} una solicitud en estado "${s.estado}".`);
  }
}

/**
 * Aprueba la solicitud: genera el Asociado con su N.° de afiliado (año de alta +
 * DNI), lo que habilita el carnet digital, y notifica por WhatsApp.
 */
async function aprobar(id: string): Promise<{ solicitud: Solicitud; asociado: Asociado }> {
  const solicitud = await obtenerOFallar(id);
  exigirEstado(solicitud, 'pendiente', 'aprobar');

  const existente = await repos().asociados.buscarPorDni(solicitud.dni);
  if (existente) {
    throw new AppError('CONFLICTO', `Ya existe un asociado con DNI ${solicitud.dni} (${existente.numeroAfiliado}).`);
  }

  const fechaAlta = hoyIso();
  const asociado = await repos().asociados.crear({
    solicitudId: solicitud.id,
    nombre: solicitud.nombre,
    apellido: solicitud.apellido,
    dni: solicitud.dni,
    segmento: solicitud.segmento,
    correo: solicitud.correo,
    telefono: solicitud.telefono,
    fechaAlta,
    numeroAfiliado: numeroAfiliado(fechaAlta, solicitud.dni),
    estado: 'activo',
    motivoPausa: null,
  });
  const actualizada = await repos().solicitudes.actualizarEstado(id, 'aprobada');
  await whatsapp.afiliacionAprobada(asociado);
  return { solicitud: actualizada, asociado };
}

export interface ResultadoAccionSolicitud {
  solicitud: Solicitud;
  /** Solo al aprobar: el asociado recién creado. */
  asociado?: Asociado;
}

export async function ejecutarAccionSolicitud(id: string, accion: AccionSolicitud): Promise<ResultadoAccionSolicitud> {
  switch (accion) {
    case 'aprobar':
      return aprobar(id);
    case 'rechazar': {
      exigirEstado(await obtenerOFallar(id), 'pendiente', 'rechazar');
      return { solicitud: await repos().solicitudes.actualizarEstado(id, 'rechazada') };
    }
    case 'volver_a_pendiente': {
      exigirEstado(await obtenerOFallar(id), 'rechazada', 'volver a pendiente');
      return { solicitud: await repos().solicitudes.actualizarEstado(id, 'pendiente') };
    }
  }
}
