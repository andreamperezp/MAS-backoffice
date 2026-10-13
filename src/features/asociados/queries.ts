'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AccionAsociado, FiltroAsociados } from '@/domain/schemas';
import type { Asociado, ConteosAsociados, Listado } from '@/domain/types';
import { aQueryString, api } from '@/lib/api';

export const asociadosKeys = {
  todos: ['asociados'] as const,
  lista: (f: FiltroAsociados) => ['asociados', 'lista', f] as const,
};

const listar = (f: FiltroAsociados, signal?: AbortSignal) =>
  api<Listado<Asociado, ConteosAsociados>>(`/api/asociados${aQueryString(f)}`, { signal });

export function useAsociados(filtro: FiltroAsociados) {
  return useQuery({
    queryKey: asociadosKeys.lista(filtro),
    queryFn: ({ signal }) => listar(filtro, signal),
    placeholderData: keepPreviousData,
  });
}

/** Cantidad de asociados que entrarían en una exportación (preview del modal). */
export function useConteoExportacion(filtro: FiltroAsociados, habilitado: boolean) {
  return useQuery({
    queryKey: asociadosKeys.lista(filtro),
    queryFn: ({ signal }) => listar(filtro, signal),
    enabled: habilitado,
    placeholderData: keepPreviousData,
    select: (d) => d.total,
  });
}

export const urlExportacion = (f: FiltroAsociados) => `/api/asociados/exportar${aQueryString(f)}`;

export function useAccionAsociado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comando }: { id: string; comando: AccionAsociado }) =>
      api<Asociado>(`/api/asociados/${encodeURIComponent(id)}`, { method: 'PATCH', json: comando }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: asociadosKeys.todos });
      void qc.invalidateQueries({ queryKey: ['panel'] });
    },
  });
}
