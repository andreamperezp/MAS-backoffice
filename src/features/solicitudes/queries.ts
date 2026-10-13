'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AccionSolicitud, FiltroSolicitudes } from '@/domain/schemas';
import type { Asociado, ConteosSolicitudes, Listado, Solicitud } from '@/domain/types';
import { aQueryString, api } from '@/lib/api';

export const solicitudesKeys = {
  todas: ['solicitudes'] as const,
  lista: (f: FiltroSolicitudes) => ['solicitudes', 'lista', f] as const,
};

export function useSolicitudes(filtro: FiltroSolicitudes) {
  return useQuery({
    queryKey: solicitudesKeys.lista(filtro),
    queryFn: ({ signal }) =>
      api<Listado<Solicitud, ConteosSolicitudes>>(`/api/solicitudes${aQueryString(filtro)}`, { signal }),
    placeholderData: keepPreviousData,
  });
}

/** Cantidad de solicitudes pendientes (badge del menú). Comparte caché con el listado por defecto. */
export function usePendientesCount(): number | undefined {
  return useSolicitudes({ estado: 'pendiente', segmento: 'todos', q: undefined }).data?.conteos.pendiente;
}

interface ResultadoAccion {
  solicitud: Solicitud;
  asociado?: Asociado;
}

export function useAccionSolicitud() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, accion }: { id: string; accion: AccionSolicitud }) =>
      api<ResultadoAccion>(`/api/solicitudes/${encodeURIComponent(id)}`, { method: 'PATCH', json: { accion } }),
    onSuccess: (_res, { accion }) => {
      void qc.invalidateQueries({ queryKey: solicitudesKeys.todas });
      void qc.invalidateQueries({ queryKey: ['panel'] });
      if (accion === 'aprobar') void qc.invalidateQueries({ queryKey: ['asociados'] });
    },
  });
}
